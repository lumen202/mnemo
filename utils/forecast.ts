import type { Flashcard } from '@/types'
import { toDateString, addDays, isDue, isLeech } from './srs'

/**
 * Review workload ahead.
 *
 * Every interval is already stored; nothing here queries anything. The point is that a student
 * who cannot see next week's load has no reason to trust the schedule, and a student who does
 * not trust the schedule crams instead. "34 cards due Thursday" is what makes the spacing feel
 * like a plan rather than a queue that appears from nowhere.
 */

export interface ForecastDay {
  /** Local calendar day, `YYYY-MM-DD`. */
  date: string
  /** Weekday label for the axis, e.g. "Thu". */
  label: string
  /** Cards scheduled for this day. */
  count: number
  /** True for the first entry — which also absorbs everything overdue. */
  isToday: boolean
}

export interface ForecastSummary {
  days: ForecastDay[]
  /** Due now, including anything overdue. */
  dueToday: number
  /** Total scheduled across the window. */
  upcoming: number
  /** Busiest day in the window, for scaling a chart. */
  peak: number
  /** Cards failed enough times that re-drilling them is not working. */
  leeches: number
}

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Bucket cards by the local day they come due, over the next `days` days.
 *
 * Overdue cards collapse into today rather than forming a growing tail of empty past days —
 * a student cannot act on "this was due last Tuesday" as a separate number, only on "these are
 * waiting for you now".
 */
export function buildForecast(cards: Flashcard[], days = 14, now = new Date()): ForecastSummary {
  const buckets = new Map<string, number>()
  const window: ForecastDay[] = []

  for (let offset = 0; offset < days; offset++) {
    const date = toDateString(addDays(now, offset))
    buckets.set(date, 0)
    window.push({
      date,
      label: WEEKDAY[addDays(now, offset).getDay()],
      count: 0,
      isToday: offset === 0,
    })
  }

  const today = toDateString(now)
  let leeches = 0

  for (const card of cards) {
    if (isLeech(card)) leeches++

    // Never-reviewed and overdue cards are both "now".
    const key = isDue(card, now) ? today : card.nextReview
    if (!key) continue
    if (!buckets.has(key)) continue // beyond the window
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }

  for (const day of window) {
    day.count = buckets.get(day.date) ?? 0
  }

  const dueToday = window[0]?.count ?? 0
  const upcoming = window.reduce((sum, d) => sum + d.count, 0)
  const peak = window.reduce((max, d) => Math.max(max, d.count), 0)

  return { days: window, dueToday, upcoming, peak, leeches }
}

/** One-line summary for a card or a reminder email. */
export function describeLoad(summary: ForecastSummary): string {
  if (summary.dueToday === 0 && summary.upcoming === 0) {
    return 'Nothing scheduled — generate some cards to get started.'
  }
  if (summary.dueToday === 0) {
    const next = summary.days.find((d) => d.count > 0)
    return next
      ? `Nothing due today. Next up: ${next.count} card${next.count === 1 ? '' : 's'} on ${next.label}.`
      : 'Nothing due today.'
  }
  return `${summary.dueToday} card${summary.dueToday === 1 ? '' : 's'} due today.`
}
