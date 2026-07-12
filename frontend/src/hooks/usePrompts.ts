import { useCallback, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { promptService } from '@/services/promptService'
import { extractErrorMessage } from '@/services/api'
import type {
  PromptCategory,
  PromptGenerateRequest,
  PromptGenerateResponse,
  TargetAI,
} from '@/types'

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

// Streaming variant — gives real-time token output and full structured result
export function useStreamingGenerate() {
  const queryClient = useQueryClient()
  const [streamingText, setStreamingText] = useState('')
  const [result, setResult] = useState<PromptGenerateResponse | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(
    async (data: PromptGenerateRequest) => {
      setIsStreaming(true)
      setStreamingText('')
      setResult(null)
      setError(null)

      try {
        for await (const event of promptService.generateStream(data)) {
          if (event.type === 'token') {
            setStreamingText((prev) => prev + event.text)
          } else if (event.type === 'complete') {
            const d = event.data
            const response: PromptGenerateResponse = {
              enhanced_prompt: d.enhanced_prompt,
              category: d.category as PromptCategory,
              target_ai: d.target_ai as TargetAI,
              ai_model_used: d.ai_model_used,
              tokens_used: d.tokens_used ?? undefined,
              generation_time_ms: d.generation_time_ms,
              variants:
                d.standard_prompt && d.advanced_prompt && d.expert_prompt
                  ? {
                      standard: d.standard_prompt,
                      advanced: d.advanced_prompt,
                      expert: d.expert_prompt,
                    }
                  : undefined,
              analysis:
                d.detected_intent
                  ? {
                      detected_intent: d.detected_intent,
                      assigned_role: d.assigned_role,
                      quality_score: d.quality_score,
                      suggested_improvements: d.suggested_improvements,
                      missing_information: d.missing_information,
                      follow_up_questions: d.follow_up_questions,
                    }
                  : undefined,
            }
            setResult(response)
            setIsStreaming(false)
            queryClient.invalidateQueries({ queryKey: ['history'] })
          } else if (event.type === 'error') {
            setError(event.message)
            setIsStreaming(false)
            toast.error(event.message)
          }
        }
      } catch (err) {
        const msg = extractErrorMessage(err)
        setError(msg)
        setIsStreaming(false)
        toast.error(msg)
      }
    },
    [queryClient],
  )

  const reset = useCallback(() => {
    setStreamingText('')
    setResult(null)
    setIsStreaming(false)
    setError(null)
  }, [])

  return { generate, streamingText, result, isStreaming, error, reset }
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
