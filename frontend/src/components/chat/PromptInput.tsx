import { useState } from 'react'
import { motion } from 'framer-motion'
import { Wand2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  type PromptCategory,
  type TargetAI,
  type AIModel,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  TARGET_AI_LABELS,
  AI_MODELS,
} from '@/types'

interface PromptInputProps {
  onGenerate: (params: {
    input_text: string
    category: PromptCategory
    target_ai: TargetAI
    ai_model: string
  }) => void
  isLoading?: boolean
}

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [PromptCategory, string][]
const TARGET_AIS = Object.entries(TARGET_AI_LABELS) as [TargetAI, string][]

export function PromptInput({ onGenerate, isLoading }: PromptInputProps) {
  const [inputText, setInputText] = useState('')
  const [category, setCategory] = useState<PromptCategory>('coding')
  const [targetAI, setTargetAI] = useState<TargetAI>('chatgpt')
  const [selectedModel, setSelectedModel] = useState<AIModel>(AI_MODELS[0])
  const [showModelMenu, setShowModelMenu] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || isLoading) return
    onGenerate({ input_text: inputText.trim(), category, target_ai: targetAI, ai_model: selectedModel.id })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e as unknown as React.FormEvent)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl p-6 shadow-xl"
    >
      {/* Category selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {CATEGORIES.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 ${
              category === key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <span>{CATEGORY_ICONS[key]}</span>
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Main textarea */}
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build, write, or create... (e.g., 'Build login page', 'Marketing campaign for SaaS')"
            rows={4}
            className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
          />
          <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
            {inputText.length}/2000
          </div>
        </div>

        {/* Bottom controls */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* Target AI */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Target:</span>
            <div className="flex flex-wrap gap-1.5">
              {TARGET_AIS.slice(0, 6).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTargetAI(key)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                    targetAI === key
                      ? 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Model selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowModelMenu(!showModelMenu)}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
              >
                {selectedModel.name}
                {selectedModel.badge && (
                  <Badge variant="purple" className="text-[10px] py-0 px-1.5">{selectedModel.badge}</Badge>
                )}
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
              {showModelMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-64 rounded-xl border border-border bg-card shadow-2xl z-50 py-1">
                  {AI_MODELS.map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => { setSelectedModel(model); setShowModelMenu(false) }}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors ${
                        selectedModel.id === model.id ? 'bg-accent' : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {model.name}
                          {model.badge && <Badge variant="purple" className="text-[10px] py-0 px-1.5">{model.badge}</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground">{model.provider} · {model.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Generate button */}
            <Button
              type="submit"
              variant="gradient"
              size="default"
              isLoading={isLoading}
              disabled={!inputText.trim()}
              className="gap-2 px-5"
            >
              <Wand2 className="h-4 w-4" />
              Generate
              <span className="text-xs opacity-60 hidden sm:inline">⌘↵</span>
            </Button>
          </div>
        </div>
      </form>
    </motion.div>
  )
}
