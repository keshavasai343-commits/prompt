import { useState } from 'react'
import { motion } from 'framer-motion'
import { History, Trash2, Copy, Check, Clock } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useClipboard } from '@/hooks/useClipboard'
import { apiClient } from '@/services/api'
import type { HistoryListResponse, HistoryItem } from '@/types'
import { CATEGORY_LABELS, TARGET_AI_LABELS } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

export function HistoryPage() {
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()
  const { copy, copied } = useClipboard()

  const { data, isLoading } = useQuery({
    queryKey: ['history', page],
    queryFn: async () => {
      const { data } = await apiClient.get<HistoryListResponse>('/history', {
        params: { page, page_size: 20 },
      })
      return data
    },
  })

  const clearHistory = useMutation({
    mutationFn: async () => apiClient.delete('/history'),
    onSuccess: () => {
      toast.success('History cleared')
      queryClient.invalidateQueries({ queryKey: ['history'] })
    },
  })

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Prompt History" subtitle="Your recent prompt generations" />

      <div className="p-6 space-y-4">
        {/* Actions bar */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{data?.total ?? 0} generations total</span>
          {data && data.total > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive gap-2"
              onClick={() => clearHistory.mutate()}
              isLoading={clearHistory.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear All
            </Button>
          )}
        </div>

        {/* History items */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border p-4 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : data?.items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <History className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No history yet</h3>
            <p className="text-sm text-muted-foreground">Your generated prompts will appear here</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {data?.items.map((item: HistoryItem) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="group rounded-xl border border-border bg-card/60 p-4 hover:border-primary/20 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="default" className="text-[10px]">
                      {CATEGORY_LABELS[item.category]}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {TARGET_AI_LABELS[item.target_ai]}
                    </Badge>
                    {item.ai_model_used && (
                      <Badge variant="secondary" className="text-[10px]">
                        {item.ai_model_used}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-2 font-medium">"{item.original_input}"</p>

                <div className="rounded-lg bg-muted/50 px-3 py-2 mb-3">
                  <p className="text-xs text-foreground/80 line-clamp-3">{item.enhanced_prompt}</p>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => copy(item.enhanced_prompt)}
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy
                  </Button>
                  {item.tokens_used && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      {item.tokens_used} tokens
                    </span>
                  )}
                  {item.generation_time_ms && (
                    <span className="text-xs text-muted-foreground">
                      {item.generation_time_ms}ms
                    </span>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Pagination */}
            {data && data.total > 20 && (
              <div className="flex justify-center gap-2 pt-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * 20 >= data.total}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
