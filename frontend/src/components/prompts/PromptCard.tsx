import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Copy, Trash2, Check, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardFooter } from '@/components/ui/Card'
import { useClipboard } from '@/hooks/useClipboard'
import { useUpdatePrompt, useDeletePrompt } from '@/hooks/usePrompts'
import type { Prompt } from '@/types'
import { CATEGORY_LABELS, TARGET_AI_LABELS, CATEGORY_ICONS } from '@/types'
import { formatDistanceToNow } from 'date-fns'

interface PromptCardProps {
  prompt: Prompt
  onSelect?: (prompt: Prompt) => void
}

export function PromptCard({ prompt, onSelect }: PromptCardProps) {
  const { copy, copied } = useClipboard()
  const updatePrompt = useUpdatePrompt()
  const deletePrompt = useDeletePrompt()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    updatePrompt.mutate({ id: prompt.id, data: { is_favorite: !prompt.is_favorite } })
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (showDeleteConfirm) {
      deletePrompt.mutate(prompt.id)
    } else {
      setShowDeleteConfirm(true)
      setTimeout(() => setShowDeleteConfirm(false), 3000)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="group cursor-pointer hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
        onClick={() => onSelect?.(prompt)}
      >
        <CardContent className="pt-4 pb-2">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base">{CATEGORY_ICONS[prompt.category]}</span>
              <Badge variant="default" className="text-[10px]">
                {CATEGORY_LABELS[prompt.category]}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {TARGET_AI_LABELS[prompt.target_ai]}
              </Badge>
            </div>
            <button
              onClick={toggleFavorite}
              className={`shrink-0 transition-colors ${
                prompt.is_favorite ? 'text-yellow-400' : 'text-muted-foreground hover:text-yellow-400'
              }`}
            >
              <Star className="h-4 w-4" fill={prompt.is_favorite ? 'currentColor' : 'none'} />
            </button>
          </div>

          <h3 className="text-sm font-semibold text-foreground line-clamp-1 mb-1">{prompt.title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">{prompt.original_input}</p>

          <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-xs text-foreground/80 line-clamp-3">{prompt.enhanced_prompt}</p>
          </div>
        </CardContent>

        <CardFooter className="justify-between pt-2">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(prompt.created_at), { addSuffix: true })}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); copy(prompt.enhanced_prompt) }}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); onSelect?.(prompt) }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${showDeleteConfirm ? 'text-destructive' : ''}`}
              onClick={handleDelete}
              isLoading={deletePrompt.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
