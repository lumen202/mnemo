// ─── Subject ──────────────────────────────────────────────────────────────────

export type SubjectId =
  | 'mathematics'
  | 'computer-science'
  | 'physics'
  | 'literature'
  | 'machine-learning'
  | 'history'
  | 'biology'
  | 'chemistry'
  | 'economics'
  | 'philosophy'
  | 'other'

export interface Subject {
  id: string
  userId: string
  name: string
  slug: SubjectId
  description?: string
  color: string
  icon: string
  targetHours: number
  completedHours: number
  materialCount: number
  period: 'weekly' | 'monthly'
  aiRecommended?: boolean
  createdAt: string
}

// ─── Study Material ───────────────────────────────────────────────────────────

export type MaterialType = 'pdf' | 'note' | 'video' | 'link' | 'textbook'
export type MaterialStatus = 'pending' | 'summarized' | 'reviewed' | 'mastered'

export interface StudyMaterial {
  id: string
  userId: string
  title: string
  subject: SubjectId
  type: MaterialType
  status: MaterialStatus
  uploadDate: string
  description?: string
  summary?: string
  keyPoints?: string[]
  content?: string
  tags?: string[]
  pages?: number
  wordCount?: number
  source?: string
}

// ─── Flashcard ────────────────────────────────────────────────────────────────

export type FlashcardDifficulty = 'easy' | 'medium' | 'hard'

export interface Flashcard {
  id: string
  userId: string
  materialId?: string
  subjectId: SubjectId
  front: string
  back: string
  difficulty: FlashcardDifficulty
  timesReviewed: number
  lastReviewed?: string
  nextReview?: string
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

export interface Quiz {
  id: string
  userId: string
  subjectId: SubjectId
  materialId?: string
  title: string
  questions: QuizQuestion[]
  score?: number
  totalQuestions: number
  completedAt?: string
  createdAt: string
}

// ─── Study Session ────────────────────────────────────────────────────────────

export interface StudySession {
  id: string
  userId: string
  subjectId: SubjectId
  date: string
  durationMinutes: number
  notes?: string
  materialsReviewed?: string[]
}

// ─── Study Goal ───────────────────────────────────────────────────────────────

export interface StudyGoal {
  id: string
  userId: string
  title: string
  description?: string
  targetDate: string
  completed: boolean
  subjectId?: SubjectId
  progress: number
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export type InsightType = 'warning' | 'tip' | 'achievement' | 'prediction'
export type InsightPriority = 'low' | 'medium' | 'high'

export interface AIInsight {
  id: string
  type: InsightType
  title: string
  description: string
  subject?: SubjectId
  actionable?: string
  priority: InsightPriority
  createdAt: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  isLoading?: boolean
}

export interface ChatSession {
  id: string
  title: string
  createdAt: string
  messages: ChatMessage[]
  /** True when a background reply landed here while another session was active. */
  unread?: boolean
}

// ─── Study Analytics ──────────────────────────────────────────────────────────

export interface SubjectStudy {
  subjectId: SubjectId
  subjectName: string
  hoursStudied: number
  percentage: number
  color: string
}

export interface WeeklyStudyTrend {
  week: string
  hoursStudied: number
  flashcardsReviewed: number
  materialsCompleted: number
}

export interface StudyAnalytics {
  totalStudyHours: number
  studyStreak: number
  activeSubjects: number
  completedMaterials: number
  totalMaterials: number
  subjectBreakdown: SubjectStudy[]
  weeklyTrend: WeeklyStudyTrend[]
}

// ─── Learning Health Score ────────────────────────────────────────────────────

export interface LearningDimension {
  label: string
  score: number
  description: string
}

export interface LearningHealthScore {
  overall: number
  dimensions: LearningDimension[]
  trend: 'up' | 'down' | 'stable'
  explanation: string
  tips: string[]
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: string
}

// ─── UI State ─────────────────────────────────────────────────────────────────

export interface ToastMessage {
  id: string
  title: string
  description?: string
  variant: 'default' | 'success' | 'error' | 'warning'
}
