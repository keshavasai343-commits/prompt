import { apiClient } from './api'
import type { Template, PromptCategory, TargetAI } from '@/types'

interface TemplateListResponse {
  items: Template[]
  total: number
}

interface CreateTemplateRequest {
  name: string
  description?: string
  template_text: string
  category: PromptCategory
  target_ai: TargetAI
  is_public?: boolean
  tags?: string
}

export const templateService = {
  async list(params?: { category?: PromptCategory; target_ai?: TargetAI; search?: string }): Promise<TemplateListResponse> {
    const { data } = await apiClient.get<TemplateListResponse>('/templates', { params })
    return data
  },

  async create(data: CreateTemplateRequest): Promise<Template> {
    const { data: res } = await apiClient.post<Template>('/templates', data)
    return res
  },

  async use(id: number): Promise<Template> {
    const { data } = await apiClient.post<Template>(`/templates/${id}/use`)
    return data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/templates/${id}`)
  },
}
