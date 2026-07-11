import { apiClient } from './api'
import type {
  Prompt,
  PromptCategory,
  PromptGenerateRequest,
  PromptGenerateResponse,
  PromptListResponse,
  TargetAI,
} from '@/types'

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
      { responseType: 'blob' }
    )
    return data
  },
}
