import { SUBJECT_META } from '@/data/mockData'
import type { StudyAnalytics, Subject, StudyMaterial, ChatMessage } from '@/types'

/**
 * A compact, single-line summary of the student's real study state, injected
 * as the AI Tutor's `context` field so replies are personalized instead of
 * generic. Every figure here comes from computeStudyAnalytics() and live
 * store data — nothing is invented, matching the rest of the app's "verify
 * every claim from the repo" standard.
 *
 * Kept short (~aim for well under 500 chars) since it's resent on every chat
 * turn — personalization shouldn't come at the cost of doubling token spend.
 */
export function buildStudyContext(
  analytics: StudyAnalytics,
  subjects: Subject[],
  materials: StudyMaterial[],
  dueFlashcards: number
): string {
  if (analytics.totalStudyHours === 0 && subjects.length === 0 && materials.length === 0) {
    return ''
  }

  const parts: string[] = []

  if (analytics.totalStudyHours > 0 || analytics.studyStreak > 0) {
    parts.push(`${analytics.totalStudyHours}h studied, ${analytics.studyStreak}-day streak`)
  }

  const topSubject = analytics.subjectBreakdown[0]
  if (topSubject) {
    parts.push(`most active in ${topSubject.subjectName}`)
  }

  const behind = [...subjects]
    .filter((s) => s.targetHours > 0 && s.completedHours < s.targetHours)
    .sort((a, b) => a.completedHours / a.targetHours - b.completedHours / b.targetHours)[0]
  if (behind) {
    const label = SUBJECT_META[behind.slug]?.label ?? behind.name
    parts.push(`furthest behind target in ${label} (${behind.completedHours}/${behind.targetHours}h)`)
  }

  const pendingMaterials = materials.filter((m) => m.status === 'pending').length
  if (pendingMaterials > 0) {
    parts.push(`${pendingMaterials} material${pendingMaterials !== 1 ? 's' : ''} not yet summarized`)
  }

  if (dueFlashcards > 0) {
    parts.push(`${dueFlashcards} flashcard${dueFlashcards !== 1 ? 's' : ''} due for review`)
  }

  return parts.join('; ')
}

/**
 * Only questions actually about the student's own progress need their real
 * context injected. Gating on this — rather than sending context on every
 * turn — keeps generic questions ("explain backprop") eligible for the free
 * static knowledge vault and the LRU cache, both zero-cost. Personalizing
 * every turn would force every single message through a live, uncached
 * OpenRouter call, which is the wrong tradeoff on a free-tier key with real
 * rate limits.
 */
export function isPersonalQuery(message: string): boolean {
  return /\b(my|i'?m|am i)\b.*(progress|doing|behind|streak|weak)|how am i (doing|progressing)|what should i (study|review|focus|do)( next)?/i.test(
    message
  )
}

const HISTORY_MAX_MESSAGES = 20
/** Roughly 4 chars/token — keeps the resent history under ~1000 tokens regardless of message length. */
const HISTORY_CHAR_BUDGET = 4000

/**
 * Trim conversation history for the API request by both message count and a
 * character budget. A fixed 20-message slice is fine for short chat turns but
 * lets a few long explanations balloon the request — every turn resends the
 * whole window, so cost compounds fast in a long conversation.
 */
export function buildHistoryWindow(
  sessionMessages: ChatMessage[]
): { role: 'user' | 'assistant'; content: string }[] {
  // Drop the message that was just added (the one this request is answering) —
  // it goes in the request body's `message` field, not `history`.
  const candidates = sessionMessages.slice(0, -1).slice(-HISTORY_MAX_MESSAGES)

  let budget = HISTORY_CHAR_BUDGET
  const window: { role: 'user' | 'assistant'; content: string }[] = []
  for (let i = candidates.length - 1; i >= 0; i--) {
    const m = candidates[i]
    budget -= m.content.length
    if (budget < 0 && window.length > 0) break
    window.unshift({ role: m.role, content: m.content })
  }
  return window
}
