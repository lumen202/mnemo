'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ArrowUpDown, FileText, StickyNote, Video, Link2, BookMarked, Upload, Sparkles, Loader2, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useStudyMaterialStore, useUIStore } from '@/store'
import { SUBJECT_META, STATUS_CONFIG } from '@/data/mockData'
import { StatCard } from '@/components/common/StatCard'
import { cn } from '@/lib/utils'
import type { MaterialType, StudyMaterial } from '@/types'
import { BookOpen, CheckCircle } from 'lucide-react'

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

function MaterialCard({ material }: { material: StudyMaterial }) {
  const router = useRouter()
  const meta = SUBJECT_META[material.subject]
  const IconComp = TYPE_ICONS[material.type] ?? FileText
  const status = STATUS_CONFIG[material.status]
  const { updateMaterial, deleteMaterial } = useStudyMaterialStore()
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [showKeyPoints, setShowKeyPoints] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  async function summarize() {
    setIsSummarizing(true)
    try {
      const content = material.description ?? material.title
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, title: material.title }),
      })
      const data = await res.json() as { summary?: string; keyPoints?: string[]; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      await updateMaterial(material.id, {
        status: 'summarized',
        summary: data.summary,
        keyPoints: data.keyPoints?.length ? data.keyPoints : undefined,
      }).catch(() => {})
    } catch {
      // silently ignore — button will re-enable
    } finally {
      setIsSummarizing(false)
    }
  }

  return (
    <>
    <div
      onClick={() => router.push(`/materials/${material.id}`)}
      className="flex items-start gap-4 px-4 py-4 rounded-xl hover:bg-accent transition-colors border border-transparent hover:border-border group cursor-pointer"
      role="link"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/materials/${material.id}`) }}
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5', meta?.bg ?? 'bg-slate-500/20')}>
        <IconComp className="w-5 h-5" style={{ color: meta?.color }} size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-semibold text-foreground leading-tight">{material.title}</p>
          <div className={cn('text-xs px-2 py-0.5 rounded-full font-medium shrink-0', status.bg, status.color)}>
            {status.label}
          </div>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs text-muted-foreground">{meta?.label}</span>
          <span className="text-xs text-muted-foreground/50">·</span>
          <span className="text-xs text-muted-foreground">{TYPE_LABELS[material.type]}</span>
          {material.pages && (
            <>
              <span className="text-xs text-muted-foreground/50">·</span>
              <span className="text-xs text-muted-foreground">{material.pages}p</span>
            </>
          )}
          {material.wordCount && (
            <>
              <span className="text-xs text-muted-foreground/50">·</span>
              <span className="text-xs text-muted-foreground">{(material.wordCount / 1000).toFixed(1)}k words</span>
            </>
          )}
        </div>
        {material.summary && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{material.summary}</p>
        )}
        {material.keyPoints && material.keyPoints.length > 0 && (
          <div className="mt-2">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowKeyPoints(!showKeyPoints) }}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {showKeyPoints ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              {showKeyPoints ? 'Hide' : 'Key Points'} ({material.keyPoints.length})
            </button>
            {showKeyPoints && (
              <ul className="mt-2 space-y-1.5">
                {material.keyPoints.map((kp, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">
                      {i + 1}
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed">{kp}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {material.tags && material.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {material.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 bg-accent border border-border rounded-full text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="shrink-0 flex flex-col items-end gap-2">
        <p className="text-xs text-muted-foreground">{material.uploadDate}</p>
        {material.source && (
          <a
            href={material.source}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Download
          </a>
        )}
        {material.status === 'pending' && (
          <Button
            size="sm"
            variant="outline"
            className="text-xs gap-1 h-7 px-2"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); summarize() }}
            disabled={isSummarizing}
          >
            {isSummarizing ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
            {isSummarizing ? 'Working…' : 'Summarize'}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="text-xs gap-1 h-7 px-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDeleteOpen(true)
          }}
        >
          <Trash2 size={11} />
          Delete
        </Button>
      </div>
    </div>
    <ConfirmDialog
      open={deleteOpen}
      onOpenChange={setDeleteOpen}
      title="Delete material?"
      description={`Delete "${material.title}"? This cannot be undone.`}
      confirmLabel="Delete"
      onConfirm={() => deleteMaterial(material.id)}
    />
    </>
  )
}

export default function MaterialsPage() {
  const { materials } = useStudyMaterialStore()
  const { setAddMaterialOpen } = useUIStore()
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortDesc, setSortDesc] = useState(true)

  const summarized = materials.filter((m) => m.status !== 'pending').length
  const pending = materials.filter((m) => m.status === 'pending').length
  const mastered = materials.filter((m) => m.status === 'mastered').length

  const filtered = useMemo(() => {
    return materials
      .filter((m) => {
        const matchSearch =
          !search ||
          m.title.toLowerCase().includes(search.toLowerCase()) ||
          (m.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
          (m.tags ?? []).some((t) => t.toLowerCase().includes(search.toLowerCase()))
        const matchSubject = subjectFilter === 'all' || m.subject === subjectFilter
        const matchStatus = statusFilter === 'all' || m.status === statusFilter
        return matchSearch && matchSubject && matchStatus
      })
      .sort((a, b) => {
        const dateA = new Date(a.uploadDate).getTime()
        const dateB = new Date(b.uploadDate).getTime()
        return sortDesc ? dateB - dateA : dateA - dateB
      })
  }, [materials, search, subjectFilter, statusFilter, sortDesc])

  const uniqueSubjects = [...new Set(materials.map((m) => m.subject))]

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard
          label="Total Materials"
          value={`${materials.length}`}
          trend="up"
          trendValue="3 added this week"
          icon={<BookOpen />}
          iconBg="bg-primary/15"
          accentColor="text-primary"
        />
        <StatCard
          label="AI Summarized"
          value={`${summarized}`}
          trend="up"
          trendValue={`${pending} pending`}
          icon={<Sparkles />}
          iconBg="bg-amber-500/15"
          accentColor="text-amber-400"
        />
        <StatCard
          label="Mastered"
          value={`${mastered}`}
          trend="up"
          trendValue="Keep reviewing!"
          icon={<CheckCircle />}
          iconBg="bg-emerald-500/15"
          accentColor="text-emerald-400"
        />
      </div>

      {/* Materials table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
          <div>
            <h2 className="text-base font-semibold text-foreground">All Materials</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filtered.length} of {materials.length} materials
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortDesc(!sortDesc)}
              className="gap-1.5"
            >
              <ArrowUpDown size={13} />
              {sortDesc ? 'Newest first' : 'Oldest first'}
            </Button>
            {materials.length > 0 && (
              <Button size="sm" onClick={() => setAddMaterialOpen(true)} className="gap-1.5">
                <Plus size={14} />
                Upload
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <Input
            placeholder="Search materials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs h-8 text-sm"
          />
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="h-8 w-auto text-xs px-3">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subjects</SelectItem>
              {uniqueSubjects.map((s) => (
                <SelectItem key={s} value={s}>{SUBJECT_META[s]?.label ?? s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-auto text-xs px-3">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="summarized">Summarized</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="mastered">Mastered</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="divide-y divide-border">
          {materials.length === 0 ? (
            <EmptyState
              icon={Upload}
              title="No materials yet"
              description="Upload notes, a document, or paste text. Mnemo categorizes it, summarizes it, and can turn it into flashcards and quizzes."
              action={{ label: 'Upload material', onClick: () => setAddMaterialOpen(true), icon: Upload }}
              className="border-0 bg-transparent"
            />
          ) : filtered.length > 0 ? (
            filtered.map((mat) => (
              <MaterialCard key={mat.id} material={mat} />
            ))
          ) : (
            <div className="py-12 text-center">
              <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No materials match your filters.</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => { setSearch(''); setSubjectFilter('all'); setStatusFilter('all') }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
