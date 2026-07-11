import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { PromptInput } from '@/components/chat/PromptInput'
import { PromptOutput } from '@/components/chat/PromptOutput'
import { Skeleton } from '@/components/ui/Skeleton'
import { useGeneratePrompt } from '@/hooks/usePrompts'
import type { PromptGenerateResponse, PromptCategory, TargetAI } from '@/types'

const EXAMPLE_PROMPTS = [
  'Build a login page with social auth',
  'Write SEO blog post about AI trends',
  'Create marketing campaign for SaaS app',
  'Design a modern dashboard UI',
  'Generate fantasy landscape artwork',
  'Analyze customer churn data',
]

export function GeneratePage() {
  const generateMutation = useGeneratePrompt()
  const [result, setResult] = useState<PromptGenerateResponse | null>(null)
  const [lastInput, setLastInput] = useState('')

  const handleGenerate = async (params: {
    input_text: string
    category: PromptCategory
    target_ai: TargetAI
    ai_model: string
  }) => {
    setLastInput(params.input_text)
    const res = await generateMutation.mutateAsync(params)
    setResult(res)
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Generate Prompt"
        subtitle="Transform your idea into a powerful AI prompt"
      />

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">
        {/* Welcome state */}
        {!result && !generateMutation.isPending && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-2xl shadow-violet-500/25 mb-6">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              What do you want to create?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Describe your task in plain language and get a detailed, optimized prompt for any AI tool.
            </p>

            {/* Example prompts */}
            <div className="flex flex-wrap gap-2 justify-center">
              {EXAMPLE_PROMPTS.map((example) => (
                <button
                  key={example}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all"
                  onClick={() => handleGenerate({
                    input_text: example,
                    category: 'general',
                    target_ai: 'chatgpt',
                    ai_model: 'gpt-4o',
                  })}
                >
                  <ArrowRight className="h-3 w-3 text-primary" />
                  {example}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Input */}
        <PromptInput onGenerate={handleGenerate} isLoading={generateMutation.isPending} />

        {/* Loading skeleton */}
        <AnimatePresence>
          {generateMutation.isPending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-border bg-card/60 p-6 space-y-3"
            >
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="pt-2 flex gap-2">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-20" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence mode="wait">
          {result && !generateMutation.isPending && (
            <PromptOutput
              key={result.enhanced_prompt.slice(0, 20)}
              result={result}
              originalInput={lastInput}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
