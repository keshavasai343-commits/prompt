import { useState } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check, Star, Save, Download, Zap, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useClipboard } from '@/hooks/useClipboard'
import { useSavePrompt } from '@/hooks/usePrompts'
import type { PromptGenerateResponse, PromptCategory, TargetAI } from '@/types'
import { CATEGORY_LABELS, TARGET_AI_LABELS } from '@/types'

interface PromptOutputProps {
  result: PromptGenerateResponse
  originalInput: string
  onSave?: () => void
}

export function PromptOutput({ result, originalInput }: PromptOutputProps) {
  const { copy, copied } = useClipboard()
  const savePrompt = useSavePrompt()
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    await savePrompt.mutateAsync({
      title: originalInput.slice(0, 100),
      original_input: originalInput,
      enhanced_prompt: result.enhanced_prompt,
      category: result.category,
      target_ai: result.target_ai,
      ai_model_used: result.ai_model_used,
    })
    setSaved(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Enhanced Prompt</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="purple" className="text-[10px]">
                {CATEGORY_LABELS[result.category as PromptCategory]}
              </Badge>
              <Badge variant="default" className="text-[10px]">
                {TARGET_AI_LABELS[result.target_ai as TargetAI]}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {result.ai_model_used}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {result.generation_time_ms && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {result.generation_time_ms}ms
            </div>
          )}
          {result.tokens_used && (
            <div className="text-xs text-muted-foreground">
              {result.tokens_used} tokens
            </div>
          )}
        </div>
      </div>

      {/* Prompt content */}
      <div className="px-6 py-5">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {result.enhanced_prompt}
          </ReactMarkdown>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-border px-6 py-4">
        <Button
          variant="gradient"
          size="sm"
          onClick={() => copy(result.enhanced_prompt)}
          className="gap-2"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied!' : 'Copy Prompt'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          isLoading={savePrompt.isPending}
          disabled={saved}
          className="gap-2"
        >
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'Saved' : 'Save'}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const blob = new Blob([result.enhanced_prompt], { type: 'text/plain' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'prompt.txt'
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>

        <Button variant="ghost" size="icon" className="ml-auto">
          <Star className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}
