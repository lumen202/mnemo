'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, ArrowUpDown, FileText, StickyNote, Video, Link2, BookMarked, Upload, Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/common/GlassCard'
import { Input } from '@/components/ui/input'
import { useStudyMaterialStore, useUIStore } from '@/store'
import { SUBJECT_META } from '@/data/mockData'
import { StatCard } from '@/components/common/StatCard'
import { cn } from '@/lib/utils'
import type { MaterialType, MaterialStatus, StudyMaterial } from '@/types'
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

const STATUS_CONFIG: Record<MaterialStatus, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Pending',    color: 'text-muted-foreground', bg: 'bg-muted/40'          },
  summarized: { label: 'Summarized', color: 'text-amber-400',        bg: 'bg-amber-500/15'       },
  reviewed:   { label: 'Reviewed',   color: 'text-indigo-400',       bg: 'bg-indigo-500/15'      },
  mastered:   { label: 'Mastered',   color: 'text-emerald-400',      bg: 'bg-emerald-500/15'     },
}

function MaterialCard({ material }: { material: StudyMaterial }) {
  const meta = SUBJECT_META[material.subject]
  const IconComp = TYPE_ICONS[material.type] ?? FileText
  const status = STATUS_CONFIG[material.status]
  const { updateMaterial } = useStudyMaterialStore()
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [showKeyPoints, setShowKeyPoints] = useState(false)

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
    <Link
      href={`/materials/${material.id}`}
      className="flex items-start gap-4 px-4 py-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/[0.06] group cursor-pointer"
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5', meta?.bg ?? 'bg-slate-500/20')}>
        <IconComp className="w-4.5 h-4.5" style={{ color: meta?.color }} size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-semibold text-foreground leading-tight">{material.title}</p>
          <div className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0', status.bg, status.color)}>
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
              onClick={(e) => { e.preventDefault(); setShowKeyPoints(!showKeyPoints) }}
              className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {showKeyPoints ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              {showKeyPoints ? 'Hide' : 'Key Points'} ({material.keyPoints.length})
            </button>
            {showKeyPoints && (
              <ul className="mt-2 space-y-1.5">
                {material.keyPoints.map((kp, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[9px] flex items-center justify-center shrink-0 mt-0.5 font-medium">
                      {i + 1}
                    </span>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{kp}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {material.tags && material.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {material.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/[0.06] rounded-full text-muted-foreground">
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
            className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Download
          </a>
        )}
        {material.status === 'pending' && (
          <Button
            size="sm"
            variant="outline"
            className="text-xs gap-1 h-7 px-2"
            onClick={(e) => { e.preventDefault(); summarize() }}
            disabled={isSummarizing}
          >
            {isSummarizing ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
            {isSummarizing ? 'Working…' : 'Summarize'}
          </Button>
        )}
      </div>
    </Link>
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
          iconBg="bg-indigo-500/15"
          accentColor="text-indigo-400"
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

      {/* Upload banner */}
      <GlassCard className="p-5" glow="indigo">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Upload Study Materials</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Upload PDFs, lecture notes, or paste text — Mnemo AI will instantly summarize, generate flashcards, and extract key concepts.
              </p>
            </div>
          </div>
          <Button onClick={() => setAddMaterialOpen(true)} size="sm" className="shrink-0 gap-1.5">
            <Plus size={14} />
            Upload
          </Button>
        </div>
      </GlassCard>

      {/* Materials table */}
      <GlassCard className="p-6">
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
            <Button size="sm" onClick={() => setAddMaterialOpen(true)} className="gap-1.5">
              <Plus size={14} />
              Upload
            </Button>
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
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="h-8 text-xs bg-background border border-border rounded-lg px-3 text-foreground"
          >
            <option value="all">All subjects</option>
            {uniqueSubjects.map((s) => (
              <option key={s} value={s}>{SUBJECT_META[s]?.label ?? s}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 text-xs bg-background border border-border rounded-lg px-3 text-foreground"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="summarized">Summarized</option>
            <option value="reviewed">Reviewed</option>
            <option value="mastered">Mastered</option>
          </select>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {filtered.length > 0 ? (
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
      </GlassCard>
    </div>
  )
}
