import type { Flashcard, FlashcardDifficulty } from '@/types'

/**
 * Spaced repetition scheduler — an SM-2 derivative simplified for a
 * two-button UI ("Got it" / "Still learning").
 *
 * Classic SM-2 takes a 0–5 quality grade and tracks a per-card ease factor.
 * Mnemo's viewer only produces a binary signal, so we collapse quality to
 * pass/fail and derive the interval from the card's own review history plus
 * its difficulty tier — which the AI generator already assigns per card.
 *
 * Rules:
 *   - Fail  → interval resets to 1 day, difficulty steps harder.
 *   - Pass  → interval grows geometrically from the repetition count,
 *             scaled by an ease factor read from the difficulty tier.
 *   - Every third consecutive pass promotes the card one tier easier, so a
 *     well-known card drifts toward long intervals on its own.
 *
 * All calculations are pure and date-only (`YYYY-MM-DD`), matching the
 * `date` columns on `public.flashcards`.
 */

/** Ease multiplier per difficulty tier — the SM-2 "EF", quantised to 3 values. */
const EASE: Record<FlashcardDifficulty, number> = {
  easy: 2.5,
  medium: 2.0,
  hard: 1.5,
}

/** Passing this many times in a row promotes the card one tier easier. */
const PROMOTE_AFTER = 3

const HARDER: Record<FlashcardDifficulty, FlashcardDifficulty> = {
  easy: 'medium',
  medium: 'hard',
  hard: 'hard',
}

const EASIER: Record<FlashcardDifficulty, FlashcardDifficulty> = {
  hard: 'medium',
  medium: 'easy',
  easy: 'easy',
}

export function toDateString(d: Date): string {
  return d.toISOString().split('T')[0]
}

export function addDays(from: Date, days: number): Date {
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  return d
}

/** Days until the next review, given how many times the card has been passed. */
export function computeInterval(repetitions: number, difficulty: FlashcardDifficulty): number {
  if (repetitions <= 1) return 1
  if (repetitions === 2) return 3
  // SM-2: I(n) = I(n-1) * EF — unrolled from the n=2 base of 3 days.
  const interval = 3 * Math.pow(EASE[difficulty], repetitions - 2)
  return Math.min(Math.round(interval), 365)
}

export interface ReviewOutcome {
  timesReviewed: number
  lastReviewed: string
  nextReview: string
  difficulty: FlashcardDifficulty
  intervalDays: number
}

/**
 * Grade a review and produce the fields to persist on the card.
 * `now` is injectable so this stays testable and SSR-safe.
 */
export function scheduleReview(card: Flashcard, knew: boolean, now = new Date()): ReviewOutcome {
  const timesReviewed = card.timesReviewed + 1

  if (!knew) {
    return {
      timesReviewed,
      lastReviewed: toDateString(now),
      nextReview: toDateString(addDays(now, 1)),
      difficulty: HARDER[card.difficulty],
      intervalDays: 1,
    }
  }

  const repetitions = timesReviewed
  const shouldPromote = repetitions > 0 && repetitions % PROMOTE_AFTER === 0
  const difficulty = shouldPromote ? EASIER[card.difficulty] : card.difficulty
  const intervalDays = computeInterval(repetitions, difficulty)

  return {
    timesReviewed,
    lastReviewed: toDateString(now),
    nextReview: toDateString(addDays(now, intervalDays)),
    difficulty,
    intervalDays,
  }
}

/** Cards scheduled for today or earlier. Never-reviewed cards are always due. */
export function isDue(card: Flashcard, now = new Date()): boolean {
  if (!card.nextReview) return true
  return card.nextReview <= toDateString(now)
}

/** Human label for an interval, e.g. "in 3 days" / "in 2 weeks". */
export function formatInterval(days: number): string {
  if (days <= 1) return 'tomorrow'
  if (days < 7) return `in ${days} days`
  if (days < 30) {
    const weeks = Math.round(days / 7)
    return `in ${weeks} week${weeks !== 1 ? 's' : ''}`
  }
  const months = Math.round(days / 30)
  return `in ${months} month${months !== 1 ? 's' : ''}`
}
