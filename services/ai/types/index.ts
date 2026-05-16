import type { AIInsight, SubjectId, FlashcardDifficulty } from '@/types'

// ─── Core Response Types ────────────────────────────────────────────────────────

export interface TutorResponse {
  content: string
  model: string
  tokensUsed?: number
}

export interface SummaryResponse {
  summary: string
  keyPoints: string[]
  suggestedSubject?: import('@/types').SubjectId
  model: string
  tokensUsed?: number
}

// ─── Flashcard Generation ─────────────────────────────────────────────────────

export interface GeneratedFlashcard {
  front: string
  back: string
  difficulty: FlashcardDifficulty
}

export interface FlashcardResponse {
  flashcards: GeneratedFlashcard[]
  subject: SubjectId
  model: string
  tokensUsed?: number
}

// ─── Quiz Generation ──────────────────────────────────────────────────────────

export interface GeneratedQuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

export interface QuizResponse {
  questions: GeneratedQuizQuestion[]
  title: string
  subject: SubjectId
  model: string
  tokensUsed?: number
}

// ─── Study Insights ───────────────────────────────────────────────────────────

export interface StudyInsightResponse {
  insights: AIInsight[]
  model: string
  tokensUsed?: number
}

// ─── Shared ───────────────────────────────────────────────────────────────────

export type GenerateType = 'summary' | 'flashcards' | 'quiz'
