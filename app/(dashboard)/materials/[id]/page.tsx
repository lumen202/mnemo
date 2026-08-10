'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, FileText, StickyNote, Video, Link2, BookMarked,
  Sparkles, Loader2, Download, ChevronDown, ChevronUp, Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useStudyMaterialStore } from '@/store'
import { getMaterialContent } from '@/services/supabase/repository'
import { isSupabaseConfigured } from '@/lib/env'
import { SUBJECT_META, STATUS_CONFIG } from '@/data/mockData'
import { cn } from '@/lib/utils'
import type { MaterialType, StudyMaterial } from '@/types'

const TYPE_ICONS: Record<MaterialType, typeof FileText> = {
  pdf:      FileText,
  note:     StickyNote,
  video:    Video,
  link:     Link2,
  textbook: BookMarked,
}

const TYPE_LABELS: Record<MaterialType, string> = {
  pdf:      'PDF',
  note:     'Note',
  video:    'Video',
  link:     'Link',
  textbook: 'Textbook',
}

export default function MaterialDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { materials, updateMaterial, deleteMaterial } = useStudyMaterialStore()

  const material: StudyMaterial | undefined = materials.find((m) => m.id === id)

  const [content, setContent] = useState<string | null>(material?.content ?? null)
  const [contentLoading, setContentLoading] = useState(false)
  const [showContent, setShowContent] = useState(true)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    if (!material || content !== null) return
    if (!isSupabaseConfigured()) return
    setContentLoading(true)
    getMaterialContent(id).then((c) => {
      setContent(c)
      setContentLoading(false)
    }).catch(() => setContentLoading(false))
  }, [id, material, content])

  if (!material) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <p className="text-muted-foreground text-sm mb-4">Material not found.</p>
        <Button variant="ghost" size="sm" onClick={() => router.push('/materials')}>
          <ArrowLeft size={14} className="mr-1" /> Back to materials
        </Button>
      </div>
    )
  }

  const meta = SUBJECT_META[material.subject]
  const IconComp = TYPE_ICONS[material.type] ?? FileText
  const status = STATUS_CONFIG[material.status]

  async function summarize() {
    if (!material) return
    setIsSummarizing(true)
    try {
      const body = content ?? material.description ?? material.title
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: body, title: material.title }),
      })
      const data = await res.json() as { summary?: string; keyPoints?: string[]; suggestedSubject?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      const updates: Record<string, unknown> = {
        status: 'summarized' as const,
        summary: data.summary,
        keyPoints: data.keyPoints?.length ? data.keyPoints : undefined,
      }
      if (data.suggestedSubject) {
        updates.subject = data.suggestedSubject
      }
      await updateMaterial(material.id, updates).catch(() => {})
    } catch {
      // silently ignore
    } finally {
      setIsSummarizing(false)
    }
  }

  function confirmDelete() {
    if (!material) return
    deleteMaterial(material.id)
    router.push('/materials')
  }

  return (
    <>
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={15} /> Back
      </button>

      {/* Header card */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', meta?.bg ?? 'bg-slate-500/20')}>
            <IconComp size={22} style={{ color: meta?.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h1 className="text-lg font-semibold text-foreground leading-tight">{material.title}</h1>
              <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium shrink-0', status.bg, status.color)}>
                {status.label}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-muted-foreground">{meta?.label ?? material.subject}</span>
              <span className="text-xs text-muted-foreground/40">·</span>
              <span className="text-xs text-muted-foreground">{TYPE_LABELS[material.type]}</span>
              {material.pages && (
                <>
                  <span className="text-xs text-muted-foreground/40">·</span>
                  <span className="text-xs text-muted-foreground">{material.pages}p</span>
                </>
              )}
              {material.wordCount && (
                <>
                  <span className="text-xs text-muted-foreground/40">·</span>
                  <span className="text-xs text-muted-foreground">{(material.wordCount / 1000).toFixed(1)}k words</span>
                </>
              )}
              <span className="text-xs text-muted-foreground/40">·</span>
              <span className="text-xs text-muted-foreground">{material.uploadDate}</span>
            </div>
            {material.tags && material.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {material.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 bg-accent border border-border rounded-full text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border">
          {material.status === 'pending' && (
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={summarize} disabled={isSummarizing}>
              {isSummarizing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {isSummarizing ? 'Summarizing…' : 'Summarize with AI'}
            </Button>
          )}
          {material.source && (
            <a
              href={material.source}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/10"
            >
              <Download size={12} /> Download original
            </a>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/10 ml-auto"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 size={12} />
            Delete
          </Button>
        </div>
      </Card>

      {/* Summary */}
      {material.summary && (
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">AI Summary</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{material.summary}</p>
        </Card>
      )}

      {/* Key Points */}
      {material.keyPoints && material.keyPoints.length > 0 && (
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Key Points</h2>
          <ul className="space-y-3">
            {material.keyPoints.map((kp, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5 font-semibold">
                  {i + 1}
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed">{kp}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Content */}
      {(content || contentLoading) && (
        <Card className="p-6">
          <button
            onClick={() => setShowContent(!showContent)}
            className="flex items-center justify-between w-full mb-4"
          >
            <h2 className="text-sm font-semibold text-foreground">Content</h2>
            {showContent ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
          </button>
          {showContent && (
            contentLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
                <Loader2 size={14} className="animate-spin" /> Loading content…
              </div>
            ) : (
              <div className="max-h-[480px] overflow-y-auto pr-1">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{content}</p>
              </div>
            )
          )}
        </Card>
      )}

      {/* Description fallback (when no content/summary yet) */}
      {!content && !contentLoading && !material.summary && material.description && (
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">Description</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{material.description}</p>
        </Card>
      )}
    </div>
    <ConfirmDialog
      open={deleteOpen}
      onOpenChange={setDeleteOpen}
      title="Delete material?"
      description={`Delete "${material.title}"? This cannot be undone.`}
      confirmLabel="Delete"
      onConfirm={confirmDelete}
    />
    </>
  )
}
