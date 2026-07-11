import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { promptService } from '@/services/promptService'
import type { PromptCategory, TargetAI } from '@/types'
import { extractErrorMessage } from '@/services/api'

export function usePrompts(params?: {
  page?: number
  page_size?: number
  category?: PromptCategory
  target_ai?: TargetAI
  is_favorite?: boolean
  search?: string
}) {
  return useQuery({
    queryKey: ['prompts', params],
    queryFn: () => promptService.list(params),
  })
}

export function useGeneratePrompt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: promptService.generate,
    onError: (error) => toast.error(extractErrorMessage(error)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] }),
  })
}

export function useSavePrompt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: promptService.save,
    onSuccess: () => {
      toast.success('Prompt saved!')
      queryClient.invalidateQueries({ queryKey: ['prompts'] })
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  })
}

export function useUpdatePrompt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof promptService.update>[1] }) =>
      promptService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prompts'] }),
    onError: (error) => toast.error(extractErrorMessage(error)),
  })
}

export function useDeletePrompt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: promptService.delete,
    onSuccess: () => {
      toast.success('Prompt deleted')
      queryClient.invalidateQueries({ queryKey: ['prompts'] })
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  })
}

export function useCopyPrompt() {
  return useMutation({
    mutationFn: promptService.copy,
    onError: (error) => toast.error(extractErrorMessage(error)),
  })
}
