import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PromptCategory, PromptGenerateResponse, TargetAI } from '@/types'

export interface ConversationMessage {
  id: string
  type: 'user' | 'assistant'
  text: string
}

export interface LastParams {
  input_text: string
  category: PromptCategory
  target_ai: TargetAI
  ai_model: string
}

interface GenerateDraft {
  // Input form
  inputText: string
  category: PromptCategory
  targetAI: TargetAI
  modelId: string
  // Conversation
  messages: ConversationMessage[]
  lastParams: LastParams | null
  lastResult: PromptGenerateResponse | null
  // Setters
  setInputText: (v: string) => void
  setCategory: (v: PromptCategory) => void
  setTargetAI: (v: TargetAI) => void
  setModelId: (v: string) => void
  setMessages: (v: ConversationMessage[] | ((prev: ConversationMessage[]) => ConversationMessage[])) => void
  setLastParams: (v: LastParams | null) => void
  setLastResult: (v: PromptGenerateResponse | null) => void
}

export const useGenerateDraft = create<GenerateDraft>()(
  persist(
    (set) => ({
      inputText: '',
      category: 'coding',
      targetAI: 'chatgpt',
      modelId: 'gemini-2.5-flash',
      messages: [],
      lastParams: null,
      lastResult: null,
      setInputText: (v) => set({ inputText: v }),
      setCategory: (v) => set({ category: v }),
      setTargetAI: (v) => set({ targetAI: v }),
      setModelId: (v) => set({ modelId: v }),
      setMessages: (v) =>
        set((state) => ({ messages: typeof v === 'function' ? v(state.messages) : v })),
      setLastParams: (v) => set({ lastParams: v }),
      setLastResult: (v) => set({ lastResult: v }),
    }),
    { name: 'generate-draft' },
  ),
)
