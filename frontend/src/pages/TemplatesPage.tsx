import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { LayoutTemplate, Search, TrendingUp } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { templateService } from '@/services/templateService'
import type { Template, PromptCategory } from '@/types'
import { CATEGORY_LABELS, CATEGORY_ICONS, TARGET_AI_LABELS } from '@/types'
import toast from 'react-hot-toast'

const CATEGORIES: [string, string][] = [['', 'All'], ...Object.entries(CATEGORY_LABELS)]

export function TemplatesPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<PromptCategory | undefined>()

  const { data, isLoading } = useQuery({
    queryKey: ['templates', category, search],
    queryFn: () => templateService.list({ category, search: search || undefined }),
  })

  const handleUse = async (template: Template) => {
    await templateService.use(template.id)
    await navigator.clipboard.writeText(template.template_text)
    toast.success(`Template copied! (${template.use_count + 1} uses)`)
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Templates" subtitle="Pre-built prompt templates for every use case" />

      <div className="p-6 space-y-6">
        {/* Search */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
            />
          </div>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setCategory(key as PromptCategory || undefined)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                (category ?? '') === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {key && <span>{CATEGORY_ICONS[key as PromptCategory]}</span>}
              {label}
            </button>
          ))}
        </div>

        {/* Templates grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border p-4 space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : data?.items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <LayoutTemplate className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No templates found</h3>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.items.map((template: Template, index: number) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <button
                  onClick={() => handleUse(template)}
                  className="group w-full text-left rounded-xl border border-border bg-card/60 p-4 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{CATEGORY_ICONS[template.category]}</span>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {template.name}
                        </h3>
                        {template.is_system && (
                          <Badge variant="success" className="text-[10px] mt-0.5">System</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      {template.use_count}
                    </div>
                  </div>

                  {template.description && (
                    <p className="text-xs text-muted-foreground mb-3">{template.description}</p>
                  )}

                  <div className="rounded-lg bg-muted/50 px-3 py-2 mb-3">
                    <p className="text-xs text-foreground/70 line-clamp-3 font-mono">
                      {template.template_text}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-[10px]">
                      {CATEGORY_LABELS[template.category]}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {TARGET_AI_LABELS[template.target_ai]}
                    </Badge>
                    <span className="ml-auto text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                      Click to copy →
                    </span>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
