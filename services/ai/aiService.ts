import { run as tutorRun } from './agents/tutorAgent'
import { run as summaryRun } from './agents/summaryAgent'
import { run as flashcardRun } from './agents/flashcardAgent'
import { run as quizRun } from './agents/quizAgent'
import { run as insightsRun } from './agents/studyCoachAgent'
import type { SubjectId } from '@/types'

// ─── Re-exports (types + registry) ────────────────────────────────────────────

export { MODEL_IDS, getDefaultModel, getModelConfig, MODEL_REGISTRY } from './modelRegistry'
export type { ModelId, TaskType, ModelConfig } from './modelRegistry'
export type { TutorResponse, SummaryResponse, FlashcardResponse, QuizResponse, StudyInsightResponse } from './types'
export { isConfigured } from './aiClient'

// ─── Facade ───────────────────────────────────────────────────────────────────
// Server-side convenience wrapper. API routes and server components import this.
// Client components must use fetch('/api/ai/*') — never import this file directly.

export const aiService = {
  chat: (message: string, context?: string) =>
    tutorRun({ message, context }),

  summarize: (content: string, title: string) =>
    summaryRun({ content, title }),

  generateFlashcards: (content: string, subject: SubjectId, count?: number) =>
    flashcardRun({ content, subject, count }),

  generateQuiz: (content: string, subject: SubjectId, questionCount?: number) =>
    quizRun({ content, subject, questionCount }),

  generateInsights: (studyContext: string) =>
    insightsRun({ studyContext }),
}
