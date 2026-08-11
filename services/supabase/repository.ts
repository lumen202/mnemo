import { supabase } from './client'
import { todayString } from '@/utils/date'
import type {
  Subject,
  StudyMaterial,
  Flashcard,
  Quiz,
  QuizQuestion,
  StudySession,
  StudyGoal,
  AIInsight,
} from '@/types'

// ─── Row types (snake_case from DB) ───────────────────────────────────────────

interface SubjectRow {
  id: string
  user_id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  icon: string | null
  target_hours: number
  completed_hours: number
  material_count: number
  period: string
  ai_recommended: boolean | null
  created_at: string
}

interface MaterialRow {
  id: string
  user_id: string
  title: string
  subject: string
  type: string
  status: string
  upload_date: string
  description: string | null
  summary: string | null
  key_points: string[] | null
  content?: string | null
  tags: string[] | null
  pages: number | null
  word_count: number | null
  source: string | null
  created_at: string
}

interface FlashcardRow {
  id: string
  user_id: string
  material_id: string | null
  subject_id: string
  front: string
  back: string
  difficulty: string
  times_reviewed: number
  repetitions: number | null
  lapses: number | null
  ease: number | null
  last_reviewed: string | null
  next_review: string | null
  created_at: string
}

interface QuizRow {
  id: string
  user_id: string
  subject_id: string
  material_id: string | null
  title: string
  questions: any
  score: number | null
  total_questions: number
  completed_at: string | null
  created_at: string
}

interface SessionRow {
  id: string
  user_id: string
  subject_id: string
  date: string
  duration_minutes: number
  notes: string | null
  materials_reviewed: string[] | null
  created_at: string
}

interface GoalRow {
  id: string
  user_id: string
  title: string
  description: string | null
  target_date: string
  completed: boolean
  subject_id: string | null
  progress: number
  created_at: string
}

interface InsightRow {
  id: string
  user_id: string
  type: string
  title: string
  description: string
  subject: string | null
  actionable: string | null
  priority: string
  created_at: string
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function toSubject(row: SubjectRow): Subject {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    slug: row.slug as Subject['slug'],
    description: row.description ?? undefined,
    color: row.color ?? '',
    icon: row.icon ?? '',
    targetHours: row.target_hours,
    completedHours: row.completed_hours,
    materialCount: row.material_count,
    period: row.period as Subject['period'],
    aiRecommended: row.ai_recommended ?? undefined,
    createdAt: row.created_at,
  }
}

function toMaterial(row: MaterialRow): StudyMaterial {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    subject: row.subject as StudyMaterial['subject'],
    type: row.type as StudyMaterial['type'],
    status: row.status as StudyMaterial['status'],
    uploadDate: row.upload_date,
    description: row.description ?? undefined,
    summary: row.summary ?? undefined,
    keyPoints: row.key_points ?? undefined,
    // content is intentionally omitted from list queries — fetched on demand to keep the store lean
    tags: row.tags ?? undefined,
    pages: row.pages ?? undefined,
    wordCount: row.word_count ?? undefined,
    source: row.source ?? undefined,
  }
}

function toFlashcard(row: FlashcardRow): Flashcard {
  return {
    id: row.id,
    userId: row.user_id,
    materialId: row.material_id ?? undefined,
    subjectId: row.subject_id as Flashcard['subjectId'],
    front: row.front,
    back: row.back,
    difficulty: row.difficulty as Flashcard['difficulty'],
    timesReviewed: row.times_reviewed,
    repetitions: row.repetitions ?? 0,
    lapses: row.lapses ?? 0,
    ease: row.ease ?? undefined,
    lastReviewed: row.last_reviewed ?? undefined,
    nextReview: row.next_review ?? undefined,
  }
}

function toQuiz(row: QuizRow): Quiz {
  return {
    id: row.id,
    userId: row.user_id,
    subjectId: row.subject_id as Quiz['subjectId'],
    materialId: row.material_id ?? undefined,
    title: row.title,
    questions: (row.questions ?? []) as QuizQuestion[],
    score: row.score ?? undefined,
    totalQuestions: row.total_questions,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
  }
}

function toSession(row: SessionRow): StudySession {
  return {
    id: row.id,
    userId: row.user_id,
    subjectId: row.subject_id as StudySession['subjectId'],
    date: row.date,
    durationMinutes: row.duration_minutes,
    notes: row.notes ?? undefined,
    materialsReviewed: row.materials_reviewed ?? undefined,
  }
}

function toGoal(row: GoalRow): StudyGoal {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? undefined,
    targetDate: row.target_date,
    completed: row.completed,
    subjectId: (row.subject_id ?? undefined) as StudyGoal['subjectId'],
    progress: row.progress,
  }
}

function toInsight(row: InsightRow): AIInsight {
  return {
    id: row.id,
    type: row.type as AIInsight['type'],
    title: row.title,
    description: row.description,
    subject: (row.subject ?? undefined) as AIInsight['subject'],
    actionable: row.actionable ?? undefined,
    priority: row.priority as AIInsight['priority'],
    createdAt: row.created_at,
  }
}

// ─── Subjects ─────────────────────────────────────────────────────────────────

export async function getSubjects(userId: string, page?: PageOptions): Promise<Subject[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(page?.offset ?? 0, (page?.offset ?? 0) + (page?.limit ?? DEFAULT_PAGE_SIZE) - 1)

  if (error) throw error
  return (data ?? []).map(toSubject)
}

export async function upsertSubject(userId: string, subject: Partial<Subject> & { name: string; slug: string }): Promise<Subject> {
  const { data, error } = await supabase
    .from('subjects')
    .upsert({
      user_id: userId,
      name: subject.name,
      slug: subject.slug,
      description: subject.description ?? null,
      color: subject.color ?? null,
      icon: subject.icon ?? null,
      target_hours: subject.targetHours ?? 10,
      completed_hours: subject.completedHours ?? 0,
      material_count: subject.materialCount ?? 0,
      period: subject.period ?? 'monthly',
      ai_recommended: subject.aiRecommended ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return toSubject(data)
}

export async function deleteSubject(id: string): Promise<void> {
  const { error } = await supabase.from('subjects').delete().eq('id', id)
  if (error) throw error
}

// ─── Study Materials ──────────────────────────────────────────────────────────

const MATERIAL_LIST_COLUMNS =
  'id,user_id,title,subject,type,status,upload_date,description,summary,key_points,tags,pages,word_count,source,created_at'

export async function getMaterials(userId: string, page?: PageOptions): Promise<StudyMaterial[]> {
  const { data, error } = await supabase
    .from('study_materials')
    .select(MATERIAL_LIST_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(page?.offset ?? 0, (page?.offset ?? 0) + (page?.limit ?? DEFAULT_PAGE_SIZE) - 1)

  if (error) throw error
  return (data ?? []).map(toMaterial)
}

export async function getMaterialContent(id: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('study_materials')
    .select('content')
    .eq('id', id)
    .single()

  if (error) throw error
  return (data as { content: string | null }).content
}

export async function createMaterial(
  userId: string,
  material: Omit<StudyMaterial, 'id' | 'userId'>
): Promise<StudyMaterial> {
  const { data, error } = await supabase
    .from('study_materials')
    .insert({
      user_id: userId,
      title: material.title,
      subject: material.subject,
      type: material.type,
      status: material.status ?? 'pending',
      upload_date: material.uploadDate ?? todayString(),
      description: material.description ?? null,
      summary: material.summary ?? null,
      key_points: material.keyPoints ?? null,
      content: material.content ?? null,
      tags: material.tags ?? null,
      pages: material.pages ?? null,
      word_count: material.wordCount ?? null,
      source: material.source ?? null,
    })
    .select(MATERIAL_LIST_COLUMNS)
    .single()

  if (error) throw error
  return toMaterial(data)
}

export async function updateMaterial(id: string, updates: Partial<StudyMaterial>): Promise<StudyMaterial> {
  const db: Record<string, unknown> = {}
  if (updates.title !== undefined) db.title = updates.title
  if (updates.subject !== undefined) db.subject = updates.subject
  if (updates.type !== undefined) db.type = updates.type
  if (updates.status !== undefined) db.status = updates.status
  if (updates.uploadDate !== undefined) db.upload_date = updates.uploadDate
  if (updates.description !== undefined) db.description = updates.description
  if (updates.summary !== undefined) db.summary = updates.summary
  if (updates.keyPoints !== undefined) db.key_points = updates.keyPoints
  if (updates.content !== undefined) db.content = updates.content
  if (updates.tags !== undefined) db.tags = updates.tags
  if (updates.pages !== undefined) db.pages = updates.pages
  if (updates.wordCount !== undefined) db.word_count = updates.wordCount
  if (updates.source !== undefined) db.source = updates.source

  const { data, error } = await supabase
    .from('study_materials')
    .update(db)
    .eq('id', id)
    .select(MATERIAL_LIST_COLUMNS)
    .single()

  if (error) throw error
  return toMaterial(data)
}

export async function deleteMaterial(id: string): Promise<void> {
  const { error } = await supabase.from('study_materials').delete().eq('id', id)
  if (error) throw error
}


// ─── Pagination ───────────────────────────────────────────────────────────────
/**
 * Every list read is bounded. Unbounded `select('*')` is invisible at a dozen rows and becomes
 * the entire experience at several hundred — the payload, the parse, and the render all grow
 * together. Callers that genuinely want everything must now say so by paging.
 */
export interface PageOptions {
  limit?: number
  offset?: number
}

/** Generous enough that no current screen notices, small enough to bound the worst case. */
export const DEFAULT_PAGE_SIZE = 200


// ─── Flashcards ───────────────────────────────────────────────────────────────

export async function getFlashcards(userId: string, page?: PageOptions): Promise<Flashcard[]> {
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(page?.offset ?? 0, (page?.offset ?? 0) + (page?.limit ?? DEFAULT_PAGE_SIZE) - 1)

  if (error) throw error
  return (data ?? []).map(toFlashcard)
}

export async function getFlashcardsDue(userId: string, beforeDate: string, page?: PageOptions): Promise<Flashcard[]> {
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('user_id', userId)
    .lte('next_review', beforeDate)
    .order('next_review', { ascending: true })
    .range(page?.offset ?? 0, (page?.offset ?? 0) + (page?.limit ?? DEFAULT_PAGE_SIZE) - 1)

  if (error) throw error
  return (data ?? []).map(toFlashcard)
}

export async function createFlashcard(
  userId: string,
  card: Omit<Flashcard, 'id' | 'userId'>
): Promise<Flashcard> {
  const { data, error } = await supabase
    .from('flashcards')
    .insert({
      user_id: userId,
      material_id: card.materialId ?? null,
      subject_id: card.subjectId,
      front: card.front,
      back: card.back,
      difficulty: card.difficulty ?? 'medium',
      times_reviewed: card.timesReviewed ?? 0,
      last_reviewed: card.lastReviewed ?? null,
      next_review: card.nextReview ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return toFlashcard(data)
}

export async function updateFlashcard(id: string, updates: Partial<Flashcard>): Promise<Flashcard> {
  const db: Record<string, unknown> = {}
  if (updates.front !== undefined) db.front = updates.front
  if (updates.back !== undefined) db.back = updates.back
  if (updates.difficulty !== undefined) db.difficulty = updates.difficulty
  if (updates.timesReviewed !== undefined) db.times_reviewed = updates.timesReviewed
  if (updates.repetitions !== undefined) db.repetitions = updates.repetitions
  if (updates.lapses !== undefined) db.lapses = updates.lapses
  if (updates.ease !== undefined) db.ease = updates.ease
  if (updates.lastReviewed !== undefined) db.last_reviewed = updates.lastReviewed
  if (updates.nextReview !== undefined) db.next_review = updates.nextReview
  if (updates.materialId !== undefined) db.material_id = updates.materialId

  const { data, error } = await supabase
    .from('flashcards')
    .update(db)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return toFlashcard(data)
}

export async function deleteFlashcard(id: string): Promise<void> {
  const { error } = await supabase.from('flashcards').delete().eq('id', id)
  if (error) throw error
}

// ─── Quizzes ──────────────────────────────────────────────────────────────────

export async function getQuizzes(userId: string, page?: PageOptions): Promise<Quiz[]> {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(page?.offset ?? 0, (page?.offset ?? 0) + (page?.limit ?? DEFAULT_PAGE_SIZE) - 1)

  if (error) throw error
  return (data ?? []).map(toQuiz)
}

export async function createQuiz(
  userId: string,
  quiz: { subjectId: string; title: string; questions: QuizQuestion[]; totalQuestions: number; materialId?: string }
): Promise<Quiz> {
  const { data, error } = await supabase
    .from('quizzes')
    .insert({
      user_id: userId,
      subject_id: quiz.subjectId,
      title: quiz.title,
      questions: quiz.questions,
      total_questions: quiz.totalQuestions,
      material_id: quiz.materialId ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return toQuiz(data)
}

export async function updateQuizScore(id: string, score: number, completedAt: string): Promise<Quiz> {
  const { data, error } = await supabase
    .from('quizzes')
    .update({ score, completed_at: completedAt })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return toQuiz(data)
}

// ─── Study Sessions ───────────────────────────────────────────────────────────

export async function getSessions(userId: string, page?: PageOptions): Promise<StudySession[]> {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .range(page?.offset ?? 0, (page?.offset ?? 0) + (page?.limit ?? DEFAULT_PAGE_SIZE) - 1)

  if (error) throw error
  return (data ?? []).map(toSession)
}

export async function createSession(
  userId: string,
  session: Omit<StudySession, 'id' | 'userId'>
): Promise<StudySession> {
  const { data, error } = await supabase
    .from('study_sessions')
    .insert({
      user_id: userId,
      subject_id: session.subjectId,
      date: session.date,
      duration_minutes: session.durationMinutes,
      notes: session.notes ?? null,
      materials_reviewed: session.materialsReviewed ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return toSession(data)
}

// ─── Study Goals ──────────────────────────────────────────────────────────────

export async function getGoals(userId: string, page?: PageOptions): Promise<StudyGoal[]> {
  const { data, error } = await supabase
    .from('study_goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(page?.offset ?? 0, (page?.offset ?? 0) + (page?.limit ?? DEFAULT_PAGE_SIZE) - 1)

  if (error) throw error
  return (data ?? []).map(toGoal)
}

export async function upsertGoal(
  userId: string,
  goal: { title: string; targetDate: string; description?: string; subjectId?: string; completed?: boolean; progress?: number }
): Promise<StudyGoal> {
  const { data, error } = await supabase
    .from('study_goals')
    .upsert({
      user_id: userId,
      title: goal.title,
      target_date: goal.targetDate,
      description: goal.description ?? null,
      subject_id: goal.subjectId ?? null,
      completed: goal.completed ?? false,
      progress: goal.progress ?? 0,
    })
    .select()
    .single()

  if (error) throw error
  return toGoal(data)
}

export async function updateGoal(id: string, updates: Partial<StudyGoal>): Promise<StudyGoal> {
  const db: Record<string, unknown> = {}
  if (updates.title !== undefined) db.title = updates.title
  if (updates.description !== undefined) db.description = updates.description
  if (updates.targetDate !== undefined) db.target_date = updates.targetDate
  if (updates.completed !== undefined) db.completed = updates.completed
  if (updates.progress !== undefined) db.progress = updates.progress
  if (updates.subjectId !== undefined) db.subject_id = updates.subjectId

  const { data, error } = await supabase
    .from('study_goals')
    .update(db)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return toGoal(data)
}

// ─── AI Insights ──────────────────────────────────────────────────────────────

export async function getInsights(userId: string, page?: PageOptions): Promise<AIInsight[]> {
  const { data, error } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(page?.offset ?? 0, (page?.offset ?? 0) + (page?.limit ?? DEFAULT_PAGE_SIZE) - 1)

  if (error) throw error
  return (data ?? []).map(toInsight)
}

export async function createInsight(
  userId: string,
  insight: { type: string; title: string; description: string; subject?: string; actionable?: string; priority?: string }
): Promise<AIInsight> {
  const { data, error } = await supabase
    .from('ai_insights')
    .insert({
      user_id: userId,
      type: insight.type,
      title: insight.title,
      description: insight.description,
      subject: insight.subject ?? null,
      actionable: insight.actionable ?? null,
      priority: insight.priority ?? 'medium',
    })
    .select()
    .single()

  if (error) throw error
  return toInsight(data)
}
