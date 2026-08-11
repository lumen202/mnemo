import type { Flashcard, FlashcardDifficulty } from '@/types'
import { toDateString, addDays } from './date'

/**
 * Spaced repetition scheduler — an SM-2 derivative simplified for a
 * two-button UI ("Got it" / "Still learning").
 *
 * Classic SM-2 takes a 0–5 quality grade and tracks a per-card ease factor.
 * Mnemo's viewer only produces a binary signal, so we collapse quality to
 * pass/fail and grow the interval from consecutive successes, scaled by the
 * card's own ease.
 *
 * Rules:
 *   - Fail  → interval resets to 1 day, ease drops, difficulty steps harder,
 *             and the consecutive-success streak resets to zero.
 *   - Pass  → the streak advances and the interval grows geometrically from it,
 *             scaled by this student's ease for this card.
 *   - Every third consecutive pass promotes the card one tier easier, so a
 *     well-known card drifts toward long intervals on its own.
 *
 * Two counters that look alike and are not: `timesReviewed` is every review ever
 * and is display-only; `repetitions` is consecutive successes and is the sole
 * scheduling input. Conflating them made failing a card lengthen its interval.
 *
 * All calculations are pure and date-only (`YYYY-MM-DD`) in the student's local
 * timezone, matching the `date` columns on `public.flashcards`.
 */

/**
 * Starting ease per difficulty tier.
 *
 * `difficulty` is the *generator's* opinion about the card, written once when the AI authors it.
 * Ease is the *student's* measured experience of it, and moves on every review. They used to be
 * the same field, so a card the model called "easy" that a particular student always failed had
 * nowhere to record that — the two opinions overwrote each other. This map is now only a seed
 * for a card's first ease value.
 */
const STARTING_EASE: Record<FlashcardDifficulty, number> = {
  easy: 2.5,
  medium: 2.0,
  hard: 1.5,
}

/** SM-2 keeps ease in a bounded range; below ~1.3 intervals stop growing usefully. */
const MIN_EASE = 1.3
const MAX_EASE = 2.8
/** How far a single review can move a card's ease. */
const EASE_ON_FAIL = -0.2
const EASE_ON_PASS = 0.1

export function startingEase(difficulty: FlashcardDifficulty): number {
  return STARTING_EASE[difficulty]
}

function clampEase(value: number): number {
  return Math.min(MAX_EASE, Math.max(MIN_EASE, Math.round(value * 100) / 100))
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

// Calendar-day helpers live in utils/date.ts — one implementation for the whole app.
// Re-exported because every existing caller of the scheduler imports them from this module.
export { toDateString, addDays }

/**
 * Days until the next review.
 *
 * Accepts either a card's own ease (a number) or a difficulty tier, so existing callers that
 * only know the tier keep working while the scheduler uses the per-student value.
 */
export function computeInterval(
  repetitions: number,
  easeOrDifficulty: number | FlashcardDifficulty,
): number {
  const ease =
    typeof easeOrDifficulty === 'number' ? easeOrDifficulty : STARTING_EASE[easeOrDifficulty]

  if (repetitions <= 1) return 1
  if (repetitions === 2) return 3
  // SM-2: I(n) = I(n-1) * EF — unrolled from the n=2 base of 3 days.
  const interval = 3 * Math.pow(ease, repetitions - 2)
  return Math.min(Math.round(interval), 365)
}

export interface ReviewOutcome {
  /** Every review ever, pass or fail — a lifetime counter for display. */
  timesReviewed: number
  /** Consecutive successful recalls. Drives the interval. Reset to 0 by any failure. */
  repetitions: number
  /** Lifetime failures. A card with many of these is a leech worth surfacing. */
  lapses: number
  /** This student's ease for this card, after the review. */
  ease: number
  lastReviewed: string
  nextReview: string
  difficulty: FlashcardDifficulty
  intervalDays: number
}

/** True when a card has failed enough times to be worth rewriting rather than re-drilling. */
export const LEECH_THRESHOLD = 5
export function isLeech(card: Pick<Flashcard, 'lapses'>): boolean {
  return (card.lapses ?? 0) >= LEECH_THRESHOLD
}

/**
 * Grade a review and produce the fields to persist on the card.
 * `now` is injectable so this stays testable and SSR-safe.
 *
 * `repetitions` is deliberately separate from `timesReviewed`. SM-2's repetition number means
 * *consecutive successes*; feeding it a counter that also increments on failure made forgetting
 * a card advance its schedule, so a card failed four times and passed once came back in ten
 * days. The cards a student knows least were pushed furthest away — the exact inverse of what
 * spaced repetition is for.
 */
export function scheduleReview(card: Flashcard, knew: boolean, now = new Date()): ReviewOutcome {
  const timesReviewed = card.timesReviewed + 1
  const priorRepetitions = card.repetitions ?? 0
  const priorLapses = card.lapses ?? 0
  const priorEase = card.ease ?? STARTING_EASE[card.difficulty]

  if (!knew) {
    return {
      timesReviewed,
      repetitions: 0,
      lapses: priorLapses + 1,
      ease: clampEase(priorEase + EASE_ON_FAIL),
      lastReviewed: toDateString(now),
      nextReview: toDateString(addDays(now, 1)),
      difficulty: HARDER[card.difficulty],
      intervalDays: 1,
    }
  }

  const repetitions = priorRepetitions + 1
  const ease = clampEase(priorEase + EASE_ON_PASS)
  const shouldPromote = repetitions % PROMOTE_AFTER === 0
  const difficulty = shouldPromote ? EASIER[card.difficulty] : card.difficulty
  const intervalDays = computeInterval(repetitions, ease)

  return {
    timesReviewed,
    repetitions,
    lapses: priorLapses,
    ease,
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
