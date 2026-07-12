import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Copy, Check, Save, Download, Star, Zap, Clock, ChevronDown, ChevronUp,
  Lightbulb, AlertTriangle, HelpCircle, User, Target, Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useClipboard } from '@/hooks/useClipboard'
import { useSavePrompt } from '@/hooks/usePrompts'
import type { PromptGenerateResponse, PromptCategory, TargetAI } from '@/types'
import { CATEGORY_LABELS, TARGET_AI_LABELS } from '@/types'

type Tab = 'standard' | 'advanced' | 'expert'

const TABS: { id: Tab; label: string; desc: string; color: string; ring: string }[] = [
  { id: 'standard', label: 'Standard', desc: 'Quick & clear', color: 'text-sky-400', ring: 'ring-sky-500/40' },
  { id: 'advanced', label: 'Advanced', desc: 'Detailed', color: 'text-violet-400', ring: 'ring-violet-500/40' },
  { id: 'expert', label: 'Expert', desc: 'Comprehensive', color: 'text-emerald-400', ring: 'ring-emerald-500/40' },
]

function QualityMeter({ score }: { score: number }) {
  const clamp = Math.max(0, Math.min(100, score))
  const color =
    clamp >= 80 ? 'from-emerald-500 to-green-400' :
    clamp >= 60 ? 'from-blue-500 to-cyan-400' :
    clamp >= 40 ? 'from-yellow-500 to-amber-400' :
    'from-red-500 to-orange-400'
  const label =
    clamp >= 80 ? 'Excellent' :
    clamp >= 60 ? 'Good' :
    clamp >= 40 ? 'Fair' :
    'Needs work'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">Prompt Quality</span>
        <span className="font-bold tabular-nums text-foreground">{clamp}<span className="text-muted-foreground text-xs">/100</span></span>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${clamp}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{label} — based on input specificity</p>
    </div>
  )
}

function AccordionSection({
  icon,
  title,
  badge,
  badgeVariant = 'default',
  children,
  defaultOpen = false,
}: {
  icon: React.ReactNode
  title: string
  badge?: string | number
  badgeVariant?: 'default' | 'secondary' | 'warning' | 'success' | 'purple' | 'outline' | 'destructive'
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl border border-border bg-background/40">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-accent/50 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-2.5">
          {icon}
          <span className="text-sm font-medium text-foreground">{title}</span>
          {badge !== undefined && (
            <Badge variant={badgeVariant} className="text-[10px] px-1.5 py-0">{badge}</Badge>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface PromptOutputProps {
  result: PromptGenerateResponse
  originalInput: string
}

export function PromptOutput({ result, originalInput }: PromptOutputProps) {
  const [activeTab, setActiveTab] = useState<Tab>('expert')
  const [saved, setSaved] = useState(false)
  const { copy, copied } = useClipboard()
  const savePrompt = useSavePrompt()

  const hasVariants = !!result.variants
  const hasAnalysis = !!result.analysis

  const promptText = hasVariants
    ? {
        standard: result.variants!.standard,
        advanced: result.variants!.advanced,
        expert: result.variants!.expert,
      }
    : { standard: result.enhanced_prompt, advanced: result.enhanced_prompt, expert: result.enhanced_prompt }

  const activeText = promptText[activeTab]

  const handleSave = async () => {
    await savePrompt.mutateAsync({
      title: originalInput.slice(0, 100),
      original_input: originalInput,
      enhanced_prompt: promptText.expert,
      category: result.category,
      target_ai: result.target_ai,
      ai_model_used: result.ai_model_used,
    })
    setSaved(true)
  }

  const handleExport = (variant: Tab = activeTab) => {
    const text = promptText[variant]
    const blob = new Blob([text], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prompt-${variant}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden"
    >
      {/* ── Header ── */}
      <div className="border-b border-border bg-card/40 px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/20">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">AI-Enhanced Prompt</h3>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
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

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {result.generation_time_ms && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {result.generation_time_ms}ms
              </span>
            )}
            {result.tokens_used && (
              <span>{result.tokens_used} tokens</span>
            )}
          </div>
        </div>

        {/* Detected intent + role */}
        {hasAnalysis && (
          <div className="mt-3 flex flex-wrap gap-2">
            {result.analysis!.detected_intent && (
              <div className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-1.5 text-xs">
                <Target className="h-3 w-3 text-violet-400" />
                <span className="text-muted-foreground">Intent:</span>
                <span className="text-foreground">{result.analysis!.detected_intent}</span>
              </div>
            )}
            {result.analysis!.assigned_role && (
              <div className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-1.5 text-xs">
                <User className="h-3 w-3 text-emerald-400" />
                <span className="text-muted-foreground">Role:</span>
                <span className="text-foreground">{result.analysis!.assigned_role}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Variant Tabs ── */}
      {hasVariants && (
        <div className="flex gap-1 border-b border-border bg-card/30 px-6 py-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? `bg-accent text-foreground ring-1 ${tab.ring}`
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <Layers className={`h-3 w-3 ${activeTab === tab.id ? tab.color : ''}`} />
              {tab.label}
              <span className={`hidden sm:inline text-[10px] ${activeTab === tab.id ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                · {tab.desc}
              </span>
            </button>
          ))}
          <div className="ml-auto flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copy(activeText)}
              className="h-7 gap-1.5 text-xs px-2"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Prompt Content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="px-6 py-7"
        >
          <div className="prose prose-base dark:prose-invert max-w-none leading-relaxed text-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeText}</ReactMarkdown>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Analysis Section ── */}
      {hasAnalysis && (
        <div className="border-t border-border px-6 py-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Analysis &amp; Insights
          </p>

          {/* Quality score */}
          <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
            <QualityMeter score={result.analysis!.quality_score} />
          </div>

          {/* Suggested improvements */}
          {result.analysis!.suggested_improvements.length > 0 && (
            <AccordionSection
              icon={<Lightbulb className="h-4 w-4 text-yellow-400" />}
              title="Suggested Improvements"
              badge={result.analysis!.suggested_improvements.length}
              badgeVariant="warning"
              defaultOpen
            >
              <ul className="space-y-2">
                {result.analysis!.suggested_improvements.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-yellow-500/15 text-[10px] font-bold text-yellow-400">
                      {i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </AccordionSection>
          )}

          {/* Missing information */}
          {result.analysis!.missing_information.length > 0 && (
            <AccordionSection
              icon={<AlertTriangle className="h-4 w-4 text-orange-400" />}
              title="Missing Information"
              badge={result.analysis!.missing_information.length}
              badgeVariant="default"
            >
              <div className="flex flex-wrap gap-2">
                {result.analysis!.missing_information.map((item, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-xs text-orange-300"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                    {item}
                  </span>
                ))}
              </div>
            </AccordionSection>
          )}

          {/* Follow-up questions */}
          {result.analysis!.follow_up_questions.length > 0 && (
            <AccordionSection
              icon={<HelpCircle className="h-4 w-4 text-sky-400" />}
              title="Follow-up Questions"
              badge={result.analysis!.follow_up_questions.length}
              badgeVariant="secondary"
            >
              <ul className="space-y-2.5">
                {result.analysis!.follow_up_questions.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-0.5 text-sky-400 font-bold shrink-0">Q{i + 1}.</span>
                    {q}
                  </li>
                ))}
              </ul>
            </AccordionSection>
          )}
        </div>
      )}

      {/* ── Footer Actions ── */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border bg-card/30 px-6 py-4">
        <Button
          variant="gradient"
          size="sm"
          onClick={() => copy(activeText)}
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

        <Button variant="ghost" size="sm" onClick={() => handleExport()} className="gap-2">
          <Download className="h-4 w-4" />
          Export .md
        </Button>

        {/* Export all variants */}
        {hasVariants && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const all = [
                `# Standard Prompt\n\n${promptText.standard}`,
                `\n\n# Advanced Prompt\n\n${promptText.advanced}`,
                `\n\n# Expert Prompt\n\n${promptText.expert}`,
              ].join('')
              const blob = new Blob([all], { type: 'text/markdown' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'all-prompts.md'
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            All Variants
          </Button>
        )}

        <Button variant="ghost" size="icon" className="ml-auto">
          <Star className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}
