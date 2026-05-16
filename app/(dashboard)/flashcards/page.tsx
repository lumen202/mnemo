'use client'
import { useState } from 'react'
import { Sparkles, FlipHorizontal, ChevronLeft, ChevronRight, RotateCcw, Check, X, Filter, Loader2 } from 'lucide-react'
import { GlassCard } from '@/components/common/GlassCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useFlashcardStore } from '@/store'
import { SUBJECT_META } from '@/data/mockData'
import { cn } from '@/lib/utils'
import type { Flashcard, SubjectId } from '@/types'
import type { FlashcardResponse } from '@/services/ai/types'

const DIFFICULTY_CONFIG = {
  easy:   { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/25' },
  medium: { color: 'text-amber-400',   bg: 'bg-amber-500/15',   border: 'border-amber-500/25'   },
  hard:   { color: 'text-rose-400',    bg: 'bg-rose-500/15',    border: 'border-rose-500/25'     },
}

function FlashcardViewer({ cards }: { cards: Flashcard[] }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [results, setResults] = useState<Record<string, 'known' | 'unknown'>>({})

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-center">
        <FlipHorizontal className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground text-sm">No flashcards for this filter.</p>
      </div>
    )
  }

  const card = cards[index]
  const diff = DIFFICULTY_CONFIG[card.difficulty]
  const known = Object.values(results).filter((r) => r === 'known').length
  const progress = ((index) / cards.length) * 100

  const next = (result?: 'known' | 'unknown') => {
    if (result) setResults((r) => ({ ...r, [card.id]: result }))
    setFlipped(false)
    setTimeout(() => setIndex((i) => Math.min(i + 1, cards.length - 1)), 150)
  }
  const prev = () => {
    setFlipped(false)
    setTimeout(() => setIndex((i) => Math.max(i - 1, 0)), 150)
  }
  const reset = () => { setIndex(0); setFlipped(false); setResults({}) }

  const isComplete = index === cards.length - 1 && Object.keys(results).length === cards.length

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Progress bar */}
      <div className="w-full max-w-2xl">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>{index + 1} / {cards.length}</span>
          <span>{known} known · {Object.values(results).filter((r) => r === 'unknown').length} to review</span>
        </div>
        <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl flashcard-flip cursor-pointer" onClick={() => setFlipped(!flipped)}>
        <div className={cn('flashcard-inner relative h-56', flipped && 'flipped')}>
          {/* Front */}
          <div className="flashcard-face absolute inset-0 glass border border-white/[0.10] rounded-2xl p-8 flex flex-col items-center justify-center">
            <div className={cn('text-[10px] uppercase tracking-widest font-semibold mb-4', diff.color)}>
              {card.difficulty} · Click to reveal
            </div>
            <p className="text-lg font-semibold text-foreground text-center leading-relaxed">
              {card.front}
            </p>
            <div className="absolute bottom-4 right-4">
              <Badge variant="outline" className={cn('text-[10px]', diff.color)}>
                {SUBJECT_META[card.subjectId]?.label ?? card.subjectId}
              </Badge>
            </div>
          </div>
          {/* Back */}
          <div className="flashcard-face flashcard-back absolute inset-0 bg-indigo-500/10 border border-indigo-500/25 rounded-2xl p-8 flex flex-col items-center justify-center">
            <div className="text-[10px] text-indigo-400 uppercase tracking-widest font-semibold mb-4">Answer</div>
            <p className="text-sm text-foreground text-center leading-relaxed whitespace-pre-line">
              {card.back}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={prev} disabled={index === 0}>
          <ChevronLeft size={16} />
        </Button>
        {flipped && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => next('unknown')}
              className="gap-1.5 border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
            >
              <X size={14} />
              Still learning
            </Button>
            <Button
              size="sm"
              onClick={() => next('known')}
              className="gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
            >
              <Check size={14} />
              Got it
            </Button>
          </>
        )}
        {!flipped && (
          <Button variant="outline" size="sm" onClick={() => setFlipped(true)} className="gap-1.5">
            <FlipHorizontal size={14} />
            Reveal
          </Button>
        )}
        <Button variant="outline" size="icon" onClick={() => next()} disabled={index === cards.length - 1}>
          <ChevronRight size={16} />
        </Button>
        <Button variant="ghost" size="icon" onClick={reset} title="Restart">
          <RotateCcw size={14} />
        </Button>
      </div>

      {isComplete && (
        <GlassCard className="p-5 w-full max-w-2xl text-center bg-emerald-500/5 border border-emerald-500/20">
          <p className="text-sm font-semibold text-emerald-400 mb-1">Session complete! 🎉</p>
          <p className="text-xs text-muted-foreground">
            You knew {known} of {cards.length} cards ({Math.round((known / cards.length) * 100)}%).
            {known < cards.length && ' Review the remaining cards again for better retention.'}
          </p>
          <Button size="sm" className="mt-3 gap-1.5" onClick={reset}>
            <RotateCcw size={13} />
            Review again
          </Button>
        </GlassCard>
      )}
    </div>
  )
}

// ─── Generate Banner ──────────────────────────────────────────────────────────

function GenerateBanner({ onGenerated }: { onGenerated: (count: number) => void }) {
  const { addFlashcard } = useFlashcardStore()
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastCount, setLastCount] = useState<number | null>(null)

  const handleGenerate = async () => {
    setIsGenerating(true)
    setLastCount(null)

    try {
      const res = await fetch('/api/ai/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'computer-science',
          content: 'Data structures and algorithms: binary search, dynamic programming, trees, graphs, sorting algorithms, hash tables, recursion, complexity analysis.',
          count: 6,
        }),
      })

      if (!res.ok) throw new Error('Generation failed')

      const data: FlashcardResponse = await res.json()

      data.flashcards.forEach((fc) => {
        addFlashcard({
          subjectId: data.subject,
          front: fc.front,
          back: fc.back,
          difficulty: fc.difficulty,
          timesReviewed: 0,
        })
      })

      setLastCount(data.flashcards.length)
      onGenerated(data.flashcards.length)
    } catch {
      setLastCount(-1)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <GlassCard className="p-5" glow="indigo">
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-4.5 h-4.5 text-indigo-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">AI Flashcard Generator</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {lastCount === null
              ? 'Select a study material and Mnemo will automatically generate contextual flashcards using spaced repetition principles.'
              : lastCount === -1
                ? 'Generation failed. Please try again.'
                : `✓ Added ${lastCount} new flashcards to your deck.`}
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {isGenerating ? 'Generating...' : 'Generate'}
        </Button>
      </div>
    </GlassCard>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FlashcardsPage() {
  const { flashcards } = useFlashcardStore()
  const [subjectFilter, setSubjectFilter] = useState<SubjectId | 'all'>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all')

  const filtered = flashcards.filter((f) => {
    const matchSubject = subjectFilter === 'all' || f.subjectId === subjectFilter
    const matchDiff = difficultyFilter === 'all' || f.difficulty === difficultyFilter
    return matchSubject && matchDiff
  })

  const uniqueSubjects = [...new Set(flashcards.map((f) => f.subjectId))]
  const dueToday = flashcards.filter((f) => {
    if (!f.nextReview) return false
    return f.nextReview <= new Date().toISOString().split('T')[0]
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Cards', value: flashcards.length, color: 'text-indigo-400', bg: 'bg-indigo-500/15' },
          { label: 'Due Today',   value: dueToday.length,   color: 'text-amber-400',  bg: 'bg-amber-500/15'  },
          { label: 'Subjects',    value: uniqueSubjects.length, color: 'text-cyan-400', bg: 'bg-cyan-500/15'  },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={cn('rounded-xl p-4 border border-white/[0.06]', bg)}>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={cn('text-2xl font-bold tabular-nums', color)}>{value}</p>
          </div>
        ))}
      </div>

      <GenerateBanner onGenerated={() => {}} />

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter size={14} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">Filter:</span>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value as SubjectId | 'all')}
            className="h-7 text-xs bg-background border border-border rounded-lg px-3 text-foreground"
          >
            <option value="all">All subjects</option>
            {uniqueSubjects.map((s) => (
              <option key={s} value={s}>{SUBJECT_META[s]?.label ?? s}</option>
            ))}
          </select>
          {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficultyFilter(d)}
              className={cn(
                'text-xs px-3 py-1 rounded-full border transition-all capitalize',
                difficultyFilter === d
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                  : 'border-white/[0.07] text-muted-foreground hover:border-white/20'
              )}
            >
              {d}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} cards</span>
        </div>
      </GlassCard>

      {/* Flashcard viewer */}
      <GlassCard className="p-6">
        <FlashcardViewer cards={filtered} />
      </GlassCard>

      {/* Card list */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">All Flashcards</h2>
        <div className="space-y-2">
          {filtered.map((card) => {
            const diff = DIFFICULTY_CONFIG[card.difficulty]
            const meta = SUBJECT_META[card.subjectId]
            return (
              <GlassCard key={card.id} className="p-4 glass-hover">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground mb-1">{card.front}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{card.back}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium capitalize', diff.bg, diff.color)}>
                      {card.difficulty}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground">
                      {meta?.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{card.timesReviewed}× reviewed</span>
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>
      </div>
    </div>
  )
}
