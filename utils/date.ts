/**
 * Calendar-day helpers, in the user's own timezone.
 *
 * One implementation, because there were eleven. `new Date().toISOString().split('T')[0]` is the
 * UTC calendar day, which differs from the user's for part of every single day — before 08:00
 * at UTC+8, after 16:00 at UTC-8. Spread across the scheduler, the streak counter, the activity
 * heatmap and four modals, that produced a family of off-by-one-day bugs that each looked
 * unrelated: empty due queues in the morning, streaks breaking overnight, sessions logged
 * against yesterday.
 *
 * Every date in this app is a *calendar day* (`YYYY-MM-DD`), not an instant. Instants are for
 * ordering and durations; days are what a student plans in.
 */

/** The local calendar day for a given instant. */
export function toDateString(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Today, locally. */
export function todayString(now = new Date()): string {
  return toDateString(now)
}

/** A new Date `days` from `from`, without mutating it. */
export function addDays(from: Date, days: number): Date {
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  return d
}

/**
 * Parse a `YYYY-MM-DD` day into a local Date at midnight.
 *
 * `new Date('2026-08-11')` parses as UTC midnight, which in a positive-offset zone is already
 * the 11th at 08:00 and in a negative one is still the 10th. This parses as local midnight, so
 * a round trip through `toDateString` is stable.
 */
export function fromDateString(day: string): Date {
  const [year, month, date] = day.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, date ?? 1)
}
