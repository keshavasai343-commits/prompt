import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Download, Star, BookMarked } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { PromptCard } from '@/components/prompts/PromptCard'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { usePrompts } from '@/hooks/usePrompts'
import type { PromptCategory, Prompt } from '@/types'
import { CATEGORY_LABELS } from '@/types'
import { promptService } from '@/services/promptService'
import toast from 'react-hot-toast'

const CATEGORIES: [string, string][] = [['', 'All'], ...Object.entries(CATEGORY_LABELS)]

export function SavedPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState<PromptCategory | undefined>()
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [selected, _setSelected] = useState<number[]>([])

  const { data, isLoading } = usePrompts({
    page,
    page_size: 12,
    category,
    is_favorite: favoritesOnly || undefined,
    search: debouncedSearch || undefined,
  })

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    clearTimeout((window as unknown as { _searchTimer: ReturnType<typeof setTimeout> })._searchTimer)
    ;(window as unknown as { _searchTimer: ReturnType<typeof setTimeout> })._searchTimer = setTimeout(() => {
      setDebouncedSearch(e.target.value)
      setPage(1)
    }, 300)
  }

  const handleExport = async (format: string) => {
    if (selected.length === 0) {
      toast.error('Select prompts to export')
      return
    }
    try {
      const blob = await promptService.export(selected, format)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `prompts.${format}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Exported ${selected.length} prompts`)
    } catch {
      toast.error('Export failed')
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Saved Prompts" subtitle={`${data?.total ?? 0} prompts saved`} />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={handleSearchChange}
              placeholder="Search prompts..."
              className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
            />
          </div>

          <button
            onClick={() => { setFavoritesOnly(!favoritesOnly); setPage(1) }}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              favoritesOnly ? 'bg-yellow-500/10 text-yellow-400' : 'border border-border text-muted-foreground hover:bg-accent'
            }`}
          >
            <Star className="h-4 w-4" fill={favoritesOnly ? 'currentColor' : 'none'} />
            Favorites
          </button>

          {selected.length > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-muted-foreground">{selected.length} selected</span>
              {['json', 'csv', 'md', 'txt'].map((fmt) => (
                <Button key={fmt} variant="outline" size="sm" onClick={() => handleExport(fmt)}>
                  <Download className="h-3.5 w-3.5 mr-1" />.{fmt}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setCategory(key as PromptCategory || undefined); setPage(1) }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                (category ?? '') === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border p-4 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        ) : data?.items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <BookMarked className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No prompts yet</h3>
            <p className="text-sm text-muted-foreground">Generate and save prompts to see them here</p>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.items.map((prompt: Prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>

            {/* Pagination */}
            {data && data.total_pages > 1 && (
              <div className="flex justify-center gap-2 pt-4">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  Previous
                </Button>
                <span className="flex items-center text-sm text-muted-foreground px-4">
                  Page {page} of {data.total_pages}
                </span>
                <Button variant="outline" size="sm" disabled={page === data.total_pages} onClick={() => setPage(p => p + 1)}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
