import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Sparkles, ArrowRight, User, Bot } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { PromptInput } from '@/components/chat/PromptInput'
import { PromptOutput } from '@/components/chat/PromptOutput'
import { useStreamingGenerate } from '@/hooks/usePrompts'
import { useGenerateDraft } from '@/store/generateDraft'
import type { PromptCategory, TargetAI } from '@/types'

const EXAMPLE_PROMPTS: { text: string; category: PromptCategory; target_ai: TargetAI }[] = [
  { text: 'Build a login page with social auth', category: 'coding', target_ai: 'cursor' },
  { text: 'Write SEO blog post about AI trends', category: 'writing', target_ai: 'chatgpt' },
  { text: 'Create marketing campaign for SaaS app', category: 'marketing', target_ai: 'chatgpt' },
  { text: 'Design a modern dashboard UI', category: 'ui_ux', target_ai: 'cursor' },
  { text: 'Generate fantasy landscape artwork', category: 'image_generation', target_ai: 'midjourney' },
  { text: 'Analyze customer churn with Python', category: 'data_science', target_ai: 'chatgpt' },
]

// Typewriter cursor for streaming display
function StreamingDisplay({ text }: { text: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      <span className="inline-block h-4 w-0.5 animate-pulse bg-violet-400 ml-0.5 align-middle" />
    </div>
  )
}

// Animated thinking dots
function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 px-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-violet-400"
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  )
}

// User bubble
function UserBubble({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex justify-end"
    >
      <div className="flex items-end gap-2 max-w-[80%]">
        <div className="rounded-2xl rounded-br-sm bg-gradient-to-br from-violet-600 to-indigo-600 px-4 py-3 text-sm text-white shadow-lg shadow-violet-500/20">
          {text}
        </div>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <User className="h-3.5 w-3.5" />
        </div>
      </div>
    </motion.div>
  )
}

// AI streaming bubble
function AiStreamingBubble({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex justify-start"
    >
      <div className="flex items-start gap-2 max-w-[90%]">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shadow-sm">
          <Bot className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="rounded-2xl rounded-tl-sm border border-border bg-card/80 px-4 py-3 text-sm shadow-sm backdrop-blur-sm">
          {text ? <StreamingDisplay text={text} /> : <ThinkingDots />}
        </div>
      </div>
    </motion.div>
  )
}

export function GeneratePage() {
  const { generate, streamingText, result, isStreaming } = useStreamingGenerate()
  const { messages, lastParams, lastResult, setMessages, setLastParams, setLastResult } = useGenerateDraft()
  const conversationRef = useRef<HTMLDivElement>(null)
  const hasConversation = messages.length > 0 || isStreaming

  // Auto-scroll to bottom as content grows
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight
    }
  }, [messages, streamingText, result])

  const handleGenerate = async (params: {
    input_text: string
    category: PromptCategory
    target_ai: TargetAI
    ai_model: string
  }) => {
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, type: 'user', text: params.input_text },
    ])
    setLastParams(params)
    setLastResult(null)
    await generate(params)
  }

  // When the stream completes, persist the result to the store
  useEffect(() => {
    if (result && !isStreaming) {
      setLastResult(result)
    }
  }, [result, isStreaming])

  return (
    <div className="flex flex-col h-full">
      <Header title="Generate Prompt" subtitle="Transform any idea into a powerful, expert AI prompt" />

      {/* ── Conversation area ── */}
      <div ref={conversationRef} className="flex-1 overflow-y-auto scroll-smooth">
        <div className="max-w-5xl mx-auto w-full px-6 py-6">

          {/* Welcome state */}
          {!hasConversation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center text-center py-12"
            >
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-2xl shadow-violet-500/30 mb-6">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">What do you want to create?</h2>
              <p className="text-muted-foreground mb-8 max-w-sm">
                Describe your task and get Standard, Advanced, and Expert prompts — with quality analysis.
              </p>

              <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
                {EXAMPLE_PROMPTS.map((ex) => (
                  <button
                    key={ex.text}
                    onClick={() => handleGenerate({ input_text: ex.text, ...ex, ai_model: 'gemini-2.5-flash' })}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-card/80 transition-all"
                  >
                    <ArrowRight className="h-3 w-3 text-primary" />
                    {ex.text}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Conversation messages */}
          <div className="space-y-6">
            <AnimatePresence>
              {messages.map((msg) =>
                msg.type === 'user' ? (
                  <UserBubble key={msg.id} text={msg.text} />
                ) : null
                // Assistant messages are replaced by the full PromptOutput below
              )}
            </AnimatePresence>

            {/* Live streaming bubble — shown while streaming, before result is ready */}
            {isStreaming && (
              <>
                {/* Show latest user message if messages haven't been added yet */}
                <AiStreamingBubble text={streamingText} />
              </>
            )}

            {/* Full structured output — shown after stream completes, persists across navigation */}
            {lastResult && !isStreaming && lastParams && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <PromptOutput result={lastResult} originalInput={lastParams.input_text} />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ── Sticky input ── */}
      <div className="border-t border-border bg-background/95 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto w-full px-6 py-4">
          <PromptInput onGenerate={handleGenerate} isLoading={isStreaming} />
        </div>
      </div>
    </div>
  )
}
