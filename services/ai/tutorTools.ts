import { SUBJECT_META } from '@/data/mockData'
import { computeStudyAnalytics, computeLearningScore } from '@/utils/analytics'
import { isDue } from '@/utils/srs'
import type { StudyMaterial, Subject, StudySession, Flashcard, Quiz } from '@/types'

/**
 * Scripted tutor tools — the "AI explains, math computes" invariant applied to
 * chat. A handful of questions ("what's my streak", "how am I doing", "what's
 * due today") have one correct, fully-computable answer sitting in the local
 * stores already. Routing those to plain code instead of an LLM call means:
 * the answer can never be wrong or hallucinated, it's instant, and it costs
 * nothing against the OpenRouter free-tier rate limit. The model is reserved
 * for what it's actually needed for — open-ended explanation and reasoning.
 */

export interface TutorToolContext {
  materials: StudyMaterial[]
  subjects: Subject[]
  sessions: StudySession[]
  flashcards: Flashcard[]
  quizzes: Quiz[]
}

interface TutorTool {
  id: string
  match: (message: string) => boolean
  run: (ctx: TutorToolContext) => string
}

function pct(n: number, d: number): number {
  return d > 0 ? Math.round((n / d) * 100) : 0
}

const TOOLS: TutorTool[] = [
  {
    id: 'streak',
    match: (m) => /\b(my |what'?s my )?(study )?streak\b|how many days.*(studied|streak|row)/i.test(m),
    run: ({ materials, sessions, subjects }) => {
      const { studyStreak } = computeStudyAnalytics(materials, sessions, subjects)
      if (studyStreak === 0) {
        return `You don't have an active streak right now. Log a study session today to start one.\n\n[→ Log a session](/planner)`
      }
      return `🔥 You're on a **${studyStreak}-day streak**. ${
        studyStreak >= 7 ? "That's a real habit — keep it going." : 'Log today\'s session to keep it alive.'
      }`
    },
  },
  {
    id: 'due-flashcards',
    match: (m) => /(flashcards?|cards?)\b.*(due|review)|what('?s| is) due( today)?|what should i review/i.test(m),
    run: ({ flashcards }) => {
      if (flashcards.length === 0) {
        return `You don't have any flashcards yet.\n\n[→ Generate a deck](/flashcards)`
      }
      const due = flashcards.filter((f) => isDue(f))
      if (due.length === 0) {
        return `Nothing due right now — all **${flashcards.length}** of your flashcards are scheduled ahead. Nice work staying on top of reviews.`
      }
      const bySubject = new Map<string, number>()
      due.forEach((f) => bySubject.set(f.subjectId, (bySubject.get(f.subjectId) ?? 0) + 1))
      const breakdown = [...bySubject.entries()]
        .map(([id, n]) => `${SUBJECT_META[id]?.label ?? id} (${n})`)
        .join(', ')
      return `You have **${due.length} flashcard${due.length !== 1 ? 's' : ''} due** for review: ${breakdown}.\n\n[→ Review now](/flashcards)`
    },
  },
  {
    id: 'progress-summary',
    match: (m) => /how am i doing|my progress|study summary|progress summary|summarize my (progress|studying)/i.test(m),
    run: ({ materials, sessions, subjects, flashcards, quizzes }) => {
      const analytics = computeStudyAnalytics(materials, sessions, subjects)
      const score = computeLearningScore(analytics, flashcards, subjects)
      const completedQuizzes = quizzes.filter((q) => q.score !== undefined)
      const avgQuiz =
        completedQuizzes.length > 0
          ? Math.round(completedQuizzes.reduce((s, q) => s + (q.score ?? 0), 0) / completedQuizzes.length)
          : null

      const lines = [
        `## Your Study Summary`,
        ``,
        `- **${analytics.totalStudyHours}h** studied total, **${analytics.studyStreak}-day** streak`,
        `- **${analytics.completedMaterials}/${analytics.totalMaterials}** materials reviewed`,
        `- Learning health score: **${score.overall}/100** (${score.trend})`,
      ]
      if (avgQuiz !== null) {
        lines.push(`- Average quiz score: **${avgQuiz}%** across ${completedQuizzes.length} quiz${completedQuizzes.length !== 1 ? 'zes' : ''}`)
      }
      lines.push(``, score.explanation)
      return lines.join('\n')
    },
  },
  {
    id: 'weak-subject',
    match: (m) => /what should i (study|focus|review|work on)( next)?|what am i (behind|weak) (on|in)|weakest subject|(furthest |most )?behind on/i.test(m),
    run: ({ subjects }) => {
      const behind = [...subjects]
        .filter((s) => s.targetHours > 0)
        .sort((a, b) => a.completedHours / a.targetHours - b.completedHours / b.targetHours)[0]
      if (!behind) {
        return `You don't have any subjects with a target set yet.\n\n[→ Add one](/subjects)`
      }
      const label = SUBJECT_META[behind.slug]?.label ?? behind.name
      return `**${label}** is furthest behind — you're at ${behind.completedHours}h of your ${behind.targetHours}h target (${pct(behind.completedHours, behind.targetHours)}%). That's where a focused session would help most.\n\n[→ View subjects](/subjects)`
    },
  },
  {
    id: 'quiz-average',
    match: (m) => /(my )?quiz(zes)? (average|score|performance)|how (am i|did i) do(ing)? on (my )?quiz/i.test(m),
    run: ({ quizzes }) => {
      const completed = quizzes.filter((q) => q.score !== undefined)
      if (completed.length === 0) {
        return `You haven't completed any quizzes yet.\n\n[→ Take a quiz](/quizzes)`
      }
      const avg = Math.round(completed.reduce((s, q) => s + (q.score ?? 0), 0) / completed.length)
      const best = [...completed].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0]
      return `Your average quiz score is **${avg}%** across ${completed.length} completed quiz${completed.length !== 1 ? 'zes' : ''}. Best so far: *${best.title}* at ${best.score}%.\n\n[→ View quizzes](/quizzes)`
    },
  },
  {
    id: 'materials-status',
    match: (m) => /how many materials|materials (pending|left|not (summarized|reviewed))|what('?s| is) (still )?pending/i.test(m),
    run: ({ materials }) => {
      if (materials.length === 0) {
        return `You haven't uploaded any materials yet.\n\n[→ Upload one](/materials)`
      }
      const pending = materials.filter((m) => m.status === 'pending').length
      const mastered = materials.filter((m) => m.status === 'mastered').length
      if (pending === 0) {
        return `All **${materials.length}** of your materials have been summarized. **${mastered}** are marked mastered.`
      }
      return `You have **${pending}** material${pending !== 1 ? 's' : ''} not yet summarized out of **${materials.length}** total.\n\n[→ Review materials](/materials)`
    },
  },
]

/** Tries every scripted tool; the first match wins. Returns null if nothing local can answer this. */
export function runTutorTool(message: string, ctx: TutorToolContext): string | null {
  for (const tool of TOOLS) {
    if (tool.match(message)) return tool.run(ctx)
  }
  return null
}

/**
 * Factual/biographical lookups route to the Wikipedia tool instead of the
 * model — a cited encyclopedia summary beats an LLM guessing from parametric
 * memory, and costs zero tokens. Deliberately NOT matching bare "what is X" —
 * that phrasing covers pedagogical concept questions ("what is a derivative",
 * "what is backpropagation") the tutor already handles well via the knowledge
 * vault or the model, with teaching depth (analogies, examples) a raw
 * encyclopedia extract doesn't have. Only route phrasings that are asking for
 * a factual overview, not a lesson.
 */
export function detectWikiTopic(message: string): string | null {
  const m = message.trim()
  const patterns = [
    /^who\s+(?:is|was|are|were)\s+(.+?)\??$/i,
    /^tell me about\s+(.+?)\??$/i,
  ]
  for (const re of patterns) {
    const match = m.match(re)
    if (match?.[1]) return match[1].trim()
  }
  return null
}

export interface WikiResult {
  title: string
  extract: string
  url: string
}

export function formatWikiResult(result: WikiResult): string {
  return `## ${result.title}\n\n${result.extract}\n\n*Source: [Wikipedia](${result.url})*`
}

/**
 * "Define X" tries the Wiktionary dictionary tool first (see the /define
 * flow in ChatInterface) — a real dictionary entry for a plain word. It falls
 * back to Wikipedia for terms Wiktionary has no entry for (most technical
 * concepts, e.g. "define photosynthesis", are really topic lookups).
 */
export function detectDefineTopic(message: string): string | null {
  const match = message.trim().match(/^define\s+(.+?)\??$/i)
  return match?.[1]?.trim() ?? null
}

export interface DictionaryResult {
  word: string
  partOfSpeech: string
  definition: string
}

export function formatDictionaryResult(result: DictionaryResult): string {
  return `**${result.word}** *(${result.partOfSpeech})*\n\n${result.definition}\n\n*Source: [Wiktionary](https://en.wiktionary.org/wiki/${encodeURIComponent(result.word)})*`
}

/**
 * "Find papers on X" — arXiv is free/keyless and returns real published
 * research, a better fit for a STEM study companion than an LLM inventing
 * plausible-sounding citations.
 */
export function detectPaperSearchTopic(message: string): string | null {
  const patterns = [
    /(?:find|search for|look up)\s+(?:research\s+)?papers?\s+(?:on|about)\s+(.+?)\??$/i,
    /papers?\s+(?:on|about)\s+(.+?)\??$/i,
    /research\s+(?:papers?\s+)?(?:on|about)\s+(.+?)\??$/i,
  ]
  for (const re of patterns) {
    const match = message.trim().match(re)
    if (match?.[1]) return match[1].trim()
  }
  return null
}

export interface ArxivPaper {
  title: string
  authors: string[]
  summary: string
  url: string
  published: string
}

export function formatArxivResults(query: string, papers: ArxivPaper[]): string {
  if (papers.length === 0) {
    return `I couldn't find any arXiv papers on *${query}*. Try a more specific search term.`
  }
  const list = papers
    .map((p, i) => {
      const summary = p.summary.length > 220 ? `${p.summary.slice(0, 220)}…` : p.summary
      const authors = p.authors.slice(0, 3).join(', ') + (p.authors.length > 3 ? ' et al.' : '')
      return `**${i + 1}. [${p.title}](${p.url})**\n${authors}${p.published ? ` · ${p.published}` : ''}\n${summary}`
    })
    .join('\n\n')
  return `## Papers on ${query}\n\n${list}\n\n*Source: [arXiv.org](https://arxiv.org)*`
}
