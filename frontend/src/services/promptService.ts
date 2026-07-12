import { apiClient } from './api'
import type {
  Prompt,
  PromptCategory,
  PromptGenerateRequest,
  PromptGenerateResponse,
  PromptListResponse,
  StreamEvent,
  TargetAI,
} from '@/types'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

interface SavePromptRequest {
  title: string
  original_input: string
  enhanced_prompt: string
  category: PromptCategory
  target_ai: TargetAI
  ai_model_used?: string
  is_favorite?: boolean
  is_public?: boolean
  tags?: string
}

interface UpdatePromptRequest {
  title?: string
  is_favorite?: boolean
  is_public?: boolean
  tags?: string
  enhanced_prompt?: string
}

interface ListPromptsParams {
  page?: number
  page_size?: number
  category?: PromptCategory
  target_ai?: TargetAI
  is_favorite?: boolean
  search?: string
}

export const promptService = {
  async generate(data: PromptGenerateRequest): Promise<PromptGenerateResponse> {
    const { data: res } = await apiClient.post<PromptGenerateResponse>('/prompts/generate', data)
    return res
  },

  async *generateStream(data: PromptGenerateRequest): AsyncGenerator<StreamEvent> {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${API_BASE}/prompts/generate/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error((err as { detail?: string }).detail ?? `HTTP ${response.status}`)
    }

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (raw === '[DONE]') return
        try {
          yield JSON.parse(raw) as StreamEvent
        } catch {
          // ignore malformed SSE lines
        }
      }
    }
  },

  async save(data: SavePromptRequest): Promise<Prompt> {
    const { data: res } = await apiClient.post<Prompt>('/prompts', data)
    return res
  },

  async list(params: ListPromptsParams = {}): Promise<PromptListResponse> {
    const { data } = await apiClient.get<PromptListResponse>('/prompts', { params })
    return data
  },

  async get(id: number): Promise<Prompt> {
    const { data } = await apiClient.get<Prompt>(`/prompts/${id}`)
    return data
  },

  async update(id: number, data: UpdatePromptRequest): Promise<Prompt> {
    const { data: res } = await apiClient.put<Prompt>(`/prompts/${id}`, data)
    return res
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/prompts/${id}`)
  },

  async copy(id: number): Promise<Prompt> {
    const { data } = await apiClient.post<Prompt>(`/prompts/${id}/copy`)
    return data
  },

  async export(prompt_ids: number[], format: string): Promise<Blob> {
    const { data } = await apiClient.post(
      '/prompts/export',
      { prompt_ids, format },
      { responseType: 'blob' },
    )
    return data
  },
}
