'use client'
import { useState } from 'react'
import { Sparkles, FlipHorizontal, ChevronLeft, ChevronRight, RotateCcw, Check, X, Filter, Loader2, CalendarClock, Layers } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { SkeletonCard, SkeletonStats } from '@/components/common/Skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFlashcardStore, useStudyMaterialStore } from '@/store'
import { SUBJECT_META } from '@/data/mockData'
import { cn } from '@/lib/utils'
import { isDue, formatInterval } from '@/utils/srs'
import type { Flashcard, SubjectId, StudyMaterial } from '@/types'
import type { FlashcardResponse } from '@/services/ai/types'

const DIFFICULTY_CONFIG = {
  easy:   { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/25' },
  medium: { color: 'text-amber-400',   bg: 'bg-amber-500/15',   border: 'border-amber-500/25'   },
  hard:   { color: 'text-rose-400',    bg: 'bg-rose-500/15',    border: 'border-rose-500/25'     },
}

function FlashcardViewer({ cards, emptyLabel }: { cards: Flashcard[]; emptyLabel?: string }) {
  const { reviewFlashcard } = useFlashcardStore()
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [results, setResults] = useState<Record<string, 'known' | 'unknown'>>({})
  const [lastSchedule, setLastSchedule] = useState<string | null>(null)

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-center">
        <FlipHorizontal className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground text-sm">{emptyLabel ?? 'No flashcards for this filter.'}</p>
      </div>
    )
  }

  const card = cards[index]
  const diff = DIFFICULTY_CONFIG[card.difficulty]
  const known = Object.values(results).filter((r) => r === 'known').length
  const progress = ((index) / cards.length) * 100

  const next = (result?: 'known' | 'unknown') => {
    if (result) {
      setResults((r) => ({ ...r, [card.id]: result }))
      // Persist the SM-2 interval. `card` is captured before the index
      // advances, so the outcome always describes the card just graded.
      reviewFlashcard(card.id, result === 'known').then((outcome) => {
        if (outcome) setLastSchedule(formatInterval(outcome.intervalDays))
      })
    }
    setFlipped(false)
    setTimeout(() => setIndex((i) => Math.min(i + 1, cards.length - 1)), 150)
  }
  const prev = () => {
    setFlipped(false)
    setTimeout(() => setIndex((i) => Math.max(i - 1, 0)), 150)
  }
  const reset = () => { setIndex(0); setFlipped(false); setResults({}); setLastSchedule(null) }

  const isComplete = index === cards.length - 1 && Object.keys(results).length === cards.length

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Progress bar */}
      <div className="w-full max-w-2xl">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>{index + 1} / {cards.length}</span>
          <span>{known} known · {Object.values(results).filter((r) => r === 'unknown').length} to review</span>
        </div>
        <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl flashcard-flip cursor-pointer" onClick={() => setFlipped(!flipped)}>
        <div className={cn('flashcard-inner relative h-56', flipped && 'flipped')}>
          {/* Front */}
          <div className="flashcard-face absolute inset-0 bg-card border border-border rounded-2xl p-8 flex flex-col items-center justify-center">
            <div className={cn('text-xs uppercase tracking-widest font-semibold mb-4', diff.color)}>
              {card.difficulty} · Click to reveal
            </div>
            <p className="text-lg font-semibold text-foreground text-center leading-relaxed">
              {card.front}
            </p>
            <div className="absolute bottom-4 right-4">
              <Badge variant="outline" className={cn('text-xs', diff.color)}>
                {SUBJECT_META[card.subjectId]?.label ?? card.subjectId}
              </Badge>
            </div>
          </div>
          {/* Back */}
          <div className="flashcard-face flashcard-back absolute inset-0 bg-primary/10 border border-primary/25 rounded-2xl p-8 flex flex-col items-center justify-center">
            <div className="text-xs text-primary uppercase tracking-widest font-semibold mb-4">Answer</div>
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

      {lastSchedule && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 -mt-2">
          <CalendarClock size={11} className="text-primary" />
          Scheduled for review {lastSchedule}
        </p>
      )}

      {isComplete && (
        <Card className="p-5 w-full max-w-2xl text-center bg-emerald-500/5 border border-emerald-500/20">
          <p className="text-sm font-semibold text-emerald-400 mb-1">Session complete!</p>
          <p className="text-xs text-muted-foreground">
            You knew {known} of {cards.length} cards ({Math.round((known / cards.length) * 100)}%).
            {known < cards.length && ' Review the remaining cards again for better retention.'}
          </p>
          <Button size="sm" className="mt-3 gap-1.5" onClick={reset}>
            <RotateCcw size={13} />
            Review again
          </Button>
        </Card>
      )}
    </div>
  )
}

// ─── Generate Banner ──────────────────────────────────────────────────────────

const SUBJECT_OPTIONS: SubjectId[] = [
  'mathematics', 'computer-science', 'physics', 'machine-learning',
  'biology', 'chemistry', 'history', 'economics', 'philosophy', 'literature', 'other',
]

function GenerateBanner({ onGenerated }: { onGenerated: (count: number) => void }) {
  const { addFlashcard } = useFlashcardStore()
  const { materials } = useStudyMaterialStore()
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null)
  const [subject, setSubject] = useState<SubjectId>('computer-science')
  const [topic, setTopic] = useState('')
  const [count, setCount] = useState(6)
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastCount, setLastCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  function pickMaterial(id: string) {
    if (id === '__none__') { setSelectedMaterial(null); return }
    const mat = materials.find((m) => m.id === id) ?? null
    setSelectedMaterial(mat)
    if (mat) { setSubject(mat.subject); setTopic(mat.title) }
  }

  const handleGenerate = async () => {
    if (!topic.trim() && !selectedMaterial) return
    setIsGenerating(true)
    setLastCount(null)
    setError(null)

    try {
      const content = selectedMaterial
        ? (selectedMaterial.content ?? selectedMaterial.summary ?? selectedMaterial.title)
        : topic.trim()

      const res = await fetch('/api/ai/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, content, count }),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: 'Generation failed' }))
        throw new Error(errBody.error ?? `HTTP ${res.status}`)
      }

      const data: FlashcardResponse = await res.json()
      const cards = data.flashcards ?? []

      cards.forEach((fc) => {
        addFlashcard({
          subjectId: data.subject,
          front: fc.front,
          back: fc.back,
          difficulty: fc.difficulty,
          timesReviewed: 0,
          materialId: selectedMaterial?.id,
        })
      })

      setLastCount(cards.length)
      onGenerated(cards.length)
      setTopic('')
      setSelectedMaterial(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed'
      setLastCount(-1)
      setError(msg)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">AI Flashcard Generator</h3>
          <p className="text-xs text-muted-foreground">Generate from an uploaded material or describe a topic below.</p>
        </div>
      </div>

      <div className="space-y-3">
        {materials.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">From study material (optional)</label>
            <Select value={selectedMaterial?.id ?? '__none__'} onValueChange={pickMaterial}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="None — enter topic below" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None — enter topic below</SelectItem>
                {materials.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.title}
                    <span className="ml-2 text-muted-foreground text-xs">{SUBJECT_META[m.subject]?.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Subject</label>
            <Select value={subject} onValueChange={(v) => setSubject(v as SubjectId)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBJECT_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{SUBJECT_META[s]?.label ?? s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Number of cards</label>
            <Select
              value={String(count)}
              onValueChange={(v) => setCount(Number(v))}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[3, 4, 5, 6, 8, 10].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} cards</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            {selectedMaterial ? 'Topic (from material)' : 'Topic / content to study'}
          </label>
          <Textarea
            value={topic}
            onChange={(e) => { setTopic(e.target.value); if (selectedMaterial) setSelectedMaterial(null) }}
            placeholder="e.g. Integration by parts, Binary search trees, Wave-particle duality..."
            className="h-20 text-sm resize-none"
            disabled={isGenerating}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                handleGenerate()
              }
            }}
          />
          {selectedMaterial && (
            <p className="text-xs text-primary/80">
              Using full content of &ldquo;{selectedMaterial.title}&rdquo; — edit above to override
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            className="gap-1.5"
            onClick={handleGenerate}
            disabled={isGenerating || (!topic.trim() && !selectedMaterial)}
          >
            {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {isGenerating ? 'Generating...' : 'Generate Flashcards'}
          </Button>

          {lastCount !== null && lastCount > 0 && (
            <span className="text-xs text-emerald-400">+{lastCount} cards added to your deck</span>
          )}
          {error && (
            <span className="text-xs text-rose-400">{error}</span>
          )}
        </div>
      </div>
    </Card>
  )
}

// ─── Decks ────────────────────────────────────────────────────────────────────

interface Deck {
  subjectId: SubjectId
  label: string
  color: string
  cards: Flashcard[]
  dueCount: number
}

/** Group the flat card set into one deck per subject, busiest deck first. */
function buildDecks(cards: Flashcard[]): Deck[] {
  const bySubject = new Map<SubjectId, Flashcard[]>()
  cards.forEach((c) => {
    const list = bySubject.get(c.subjectId)
    if (list) list.push(c)
    else bySubject.set(c.subjectId, [c])
  })

  return [...bySubject.entries()]
    .map(([subjectId, deckCards]) => ({
      subjectId,
      label: SUBJECT_META[subjectId]?.label ?? subjectId,
      color: SUBJECT_META[subjectId]?.color ?? '#6366f1',
      cards: deckCards,
      dueCount: deckCards.filter((c) => isDue(c)).length,
    }))
    .sort((a, b) => b.dueCount - a.dueCount || b.cards.length - a.cards.length)
}

function DeckCard({ deck, onStudy }: { deck: Deck; onStudy: () => void }) {
  // Difficulty mix drives a 3-segment bar — a quick read of how hard a deck is.
  const mix = (['easy', 'medium', 'hard'] as const).map((d) => ({
    difficulty: d,
    count: deck.cards.filter((c) => c.difficulty === d).length,
  }))

  return (
    <button
      onClick={onStudy}
      className="group text-left rounded-2xl bg-card border border-border p-4 transition-all hover:border-foreground/20 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: deck.color + '25' }}
          >
            <Layers size={14} style={{ color: deck.color }} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{deck.label}</p>
            <p className="text-xs text-muted-foreground">{deck.cards.length} cards</p>
          </div>
        </div>
        {deck.dueCount > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-500/15 text-amber-400 shrink-0">
            {deck.dueCount} due
          </span>
        )}
      </div>

      <div className="flex h-1 rounded-full overflow-hidden bg-muted mb-3">
        {mix.map(({ difficulty, count }) => (
          count > 0 && (
            <div
              key={difficulty}
              className={cn(
                difficulty === 'easy' ? 'bg-emerald-500/70'
                  : difficulty === 'medium' ? 'bg-amber-500/70'
                  : 'bg-rose-500/70'
              )}
              style={{ width: `${(count / deck.cards.length) * 100}%` }}
              title={`${count} ${difficulty}`}
            />
          )
        ))}
      </div>

      <span className="text-xs font-medium text-primary flex items-center gap-1">
        {deck.dueCount > 0 ? 'Study due cards' : 'Review deck'}
        <ChevronRight size={12} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FlashcardsPage() {
  const { flashcards, isLoading } = useFlashcardStore()
  const [activeDeck, setActiveDeck] = useState<SubjectId | 'all' | null>(null)
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all')
  const [dueOnly, setDueOnly] = useState(false)

  const decks = buildDecks(flashcards)
  const deckCards = activeDeck && activeDeck !== 'all'
    ? flashcards.filter((f) => f.subjectId === activeDeck)
    : flashcards

  const filtered = deckCards.filter((f) => {
    const matchDiff = difficultyFilter === 'all' || f.difficulty === difficultyFilter
    const matchDue = !dueOnly || isDue(f)
    return matchDiff && matchDue
  })

  // A card with no schedule has never been reviewed — it is due now.
  const dueToday = flashcards.filter((f) => isDue(f))
  const scheduled = flashcards.length - dueToday.length

  const openDeck = (deck: SubjectId | 'all') => {
    setActiveDeck(deck)
    setDifficultyFilter('all')
    // Opening a deck that has due cards starts in review mode — that's the
    // point of the deck. A fully-scheduled deck opens as a plain browse.
    const cards = deck === 'all' ? flashcards : flashcards.filter((f) => f.subjectId === deck)
    setDueOnly(cards.some((c) => isDue(c)))
  }

  const activeLabel = activeDeck === 'all'
    ? 'All cards'
    : SUBJECT_META[activeDeck ?? '']?.label ?? activeDeck

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <SkeletonStats />
        <SkeletonCard lines={5} />
        <SkeletonCard lines={4} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Cards', value: flashcards.length, color: 'text-primary', bg: 'bg-primary/15' },
          { label: 'Due Today',   value: dueToday.length,   color: 'text-amber-400',  bg: 'bg-amber-500/15'  },
          { label: 'Scheduled',   value: scheduled,         color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
          { label: 'Decks',       value: decks.length,      color: 'text-cyan-400',   bg: 'bg-cyan-500/15'   },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={cn('rounded-xl p-4 border border-border', bg)}>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={cn('text-2xl font-bold tabular-nums', color)}>{value}</p>
          </div>
        ))}
      </div>

      <GenerateBanner onGenerated={() => {}} />

      {flashcards.length === 0 && (
        <EmptyState
          icon={Layers}
          title="No flashcards yet"
          description="Generate a deck from a topic or one of your uploaded materials using the panel above. Every card you review gets scheduled with spaced repetition, so the ones you struggle with come back sooner."
        />
      )}

      {/* Deck grid — the browse view */}
      {flashcards.length > 0 && activeDeck === null && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Your Decks</h2>
            <button
              onClick={() => openDeck('all')}
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              Study all {dueToday.length > 0 && `(${dueToday.length} due)`}
              <ChevronRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {decks.map((deck) => (
              <DeckCard key={deck.subjectId} deck={deck} onStudy={() => openDeck(deck.subjectId)} />
            ))}
          </div>
        </div>
      )}

      {/* Focused deck — study + browse a single subject */}
      {flashcards.length > 0 && activeDeck !== null && (
      <>
      {/* Deck header + filters */}
      <Card className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setActiveDeck(null)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={13} />
            Decks
          </button>
          <span className="text-sm font-semibold text-foreground">{activeLabel}</span>
          <Filter size={14} className="text-muted-foreground ml-2" />
          <button
            onClick={() => setDueOnly((v) => !v)}
            className={cn(
              'text-xs px-3 py-1 rounded-full border transition-all flex items-center gap-1.5',
              dueOnly
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'border-border text-muted-foreground hover:border-foreground/20'
            )}
            title="Show only cards scheduled for review today"
          >
            <CalendarClock size={11} />
            Due only
          </button>
          {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficultyFilter(d)}
              className={cn(
                'text-xs px-3 py-1 rounded-full border transition-all capitalize',
                difficultyFilter === d
                  ? 'bg-primary/20 border-primary/40 text-primary'
                  : 'border-border text-muted-foreground hover:border-foreground/20'
              )}
            >
              {d}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} cards</span>
        </div>
      </Card>

      {/* Flashcard viewer */}
      <Card className="p-6">
        <FlashcardViewer
          cards={filtered}
          emptyLabel={dueOnly ? 'Nothing due right now — every card is scheduled ahead.' : undefined}
        />
      </Card>

      {/* Cards in this deck */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Cards in {activeLabel}
        </h2>
        <div className="space-y-2">
          {filtered.map((card) => {
            const diff = DIFFICULTY_CONFIG[card.difficulty]
            return (
              <Card key={card.id} className="p-4 hover:bg-accent transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground mb-1">{card.front}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{card.back}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize', diff.bg, diff.color)}>
                      {card.difficulty}
                    </span>
                    {activeDeck === 'all' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-muted-foreground">
                        {SUBJECT_META[card.subjectId]?.label}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{card.timesReviewed}× reviewed</span>
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        isDue(card) ? 'bg-amber-500/15 text-amber-400' : 'bg-accent text-muted-foreground'
                      )}
                      title={card.nextReview ? `Next review ${card.nextReview}` : 'Never reviewed'}
                    >
                      {isDue(card) ? 'Due' : `Next ${card.nextReview}`}
                    </span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
      </>
      )}
    </div>
  )
}
