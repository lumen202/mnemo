import { createClient } from '@supabase/supabase-js'
import {
  MOCK_SUBJECTS,
  MOCK_MATERIALS,
  MOCK_FLASHCARDS,
  MOCK_QUIZZES,
  MOCK_SESSIONS,
  MOCK_GOALS,
  MOCK_INSIGHTS,
} from '../data/mockData'
import type { Subject, StudyMaterial, Flashcard, QuizQuestion } from '../types/index'

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const DEMO_EMAIL = 'demo@mnemo.test'
const DEMO_PASSWORD = 'demo123456'
const TEST_EMAIL = 'test@mnemo.test'
const TEST_PASSWORD = 'test123456'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function requireEnv(key: string, val?: string): string {
  if (!val) throw new Error(`Missing env var: ${key}`)
  return val
}

function uuid(): string {
  return crypto.randomUUID()
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL', SUPABASE_URL)
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY', SERVICE_ROLE_KEY)

  // admin client bypasses RLS
  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 1. Create or fetch users
  const [demoResult, testResult] = await Promise.all([
    admin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { name: 'Demo User' },
    }),
    admin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { name: 'Test User' },
    }),
  ])

  const demoUserId = demoResult.data?.user?.id
  const testUserId = testResult.data?.user?.id

  if (!demoUserId || !testUserId) {
    throw new Error('Failed to create users')
  }

  console.log(`✓ Demo user  → ${DEMO_EMAIL}  (${demoUserId})`)
  console.log(`✓ Test user  → ${TEST_EMAIL}   (${testUserId})`)
  console.log('')

  // 2. Reset demo user data
  const tables = ['ai_insights', 'study_goals', 'study_sessions', 'quizzes', 'flashcards', 'study_materials', 'subjects']
  for (const table of tables) {
    await admin.from(table).delete().eq('user_id', demoUserId)
  }

  // 3. Seed subjects
  const subjectIdMap = new Map<string, string>()
  for (const s of MOCK_SUBJECTS) {
    const newId = uuid()
    subjectIdMap.set(s.id, newId)
  }

  for (const s of MOCK_SUBJECTS) {
    await admin.from('subjects').insert({
      id: subjectIdMap.get(s.id),
      user_id: demoUserId,
      name: s.name,
      slug: s.slug,
      description: s.description ?? null,
      color: s.color,
      icon: s.icon,
      target_hours: s.targetHours,
      completed_hours: s.completedHours,
      material_count: s.materialCount,
      period: s.period,
      ai_recommended: s.aiRecommended ?? null,
      created_at: s.createdAt,
    })
  }
  console.log(`✓ Seeded ${MOCK_SUBJECTS.length} subjects`)

  // 4. Seed study materials
  const materialIdMap = new Map<string, string>()
  for (const m of MOCK_MATERIALS) {
    const newId = uuid()
    materialIdMap.set(m.id, newId)
  }

  for (const m of MOCK_MATERIALS) {
    await admin.from('study_materials').insert({
      id: materialIdMap.get(m.id),
      user_id: demoUserId,
      title: m.title,
      subject: m.subject,
      type: m.type,
      status: m.status,
      upload_date: m.uploadDate,
      description: m.description ?? null,
      summary: m.summary ?? null,
      tags: m.tags ?? null,
      pages: m.pages ?? null,
      word_count: m.wordCount ?? null,
      source: m.source ?? null,
    })
  }
  console.log(`✓ Seeded ${MOCK_MATERIALS.length} study materials`)

  // 5. Seed flashcards (map materialId references)
  for (const f of MOCK_FLASHCARDS) {
    await admin.from('flashcards').insert({
      user_id: demoUserId,
      material_id: f.materialId ? (materialIdMap.get(f.materialId) ?? null) : null,
      subject_id: f.subjectId,
      front: f.front,
      back: f.back,
      difficulty: f.difficulty,
      times_reviewed: f.timesReviewed,
      last_reviewed: f.lastReviewed ?? null,
      next_review: f.nextReview ?? null,
    })
  }
  console.log(`✓ Seeded ${MOCK_FLASHCARDS.length} flashcards`)

  // 6. Seed quizzes (map materialId references)
  for (const q of MOCK_QUIZZES) {
    await admin.from('quizzes').insert({
      user_id: demoUserId,
      subject_id: q.subjectId,
      material_id: q.materialId ? (materialIdMap.get(q.materialId) ?? null) : null,
      title: q.title,
      questions: JSON.stringify(q.questions),
      score: q.score ?? null,
      total_questions: q.totalQuestions,
      completed_at: q.completedAt ?? null,
      created_at: q.createdAt,
    })
  }
  console.log(`✓ Seeded ${MOCK_QUIZZES.length} quizzes`)

  // 7. Seed study sessions
  for (const s of MOCK_SESSIONS) {
    await admin.from('study_sessions').insert({
      user_id: demoUserId,
      subject_id: s.subjectId,
      date: s.date,
      duration_minutes: s.durationMinutes,
      notes: s.notes ?? null,
      materials_reviewed: s.materialsReviewed ?? null,
    })
  }
  console.log(`✓ Seeded ${MOCK_SESSIONS.length} study sessions`)

  // 8. Seed study goals
  for (const g of MOCK_GOALS) {
    await admin.from('study_goals').insert({
      user_id: demoUserId,
      title: g.title,
      description: g.description ?? null,
      target_date: g.targetDate,
      completed: g.completed,
      subject_id: g.subjectId ?? null,
      progress: g.progress,
    })
  }
  console.log(`✓ Seeded ${MOCK_GOALS.length} study goals`)

  // 9. Seed AI insights
  for (const i of MOCK_INSIGHTS) {
    await admin.from('ai_insights').insert({
      user_id: demoUserId,
      type: i.type,
      title: i.title,
      description: i.description,
      subject: i.subject ?? null,
      actionable: i.actionable ?? null,
      priority: i.priority,
      created_at: i.createdAt,
    })
  }
  console.log(`✓ Seeded ${MOCK_INSIGHTS.length} AI insights`)

  console.log('')
  console.log('┌──────────────────────────────────────────────────────────┐')
  console.log('│                      Seed Complete                       │')
  console.log('├────────────────────────────┬─────────────────────────────┤')
  console.log(`│ Demo (seeded)              │ ${DEMO_EMAIL.padEnd(27)}│`)
  console.log(`│                            │ ${DEMO_PASSWORD.padEnd(27)}│`)
  console.log(`├────────────────────────────┼─────────────────────────────┤`)
  console.log(`│ Test (empty)               │ ${TEST_EMAIL.padEnd(27)}│`)
  console.log(`│                            │ ${TEST_PASSWORD.padEnd(27)}│`)
  console.log('└────────────────────────────┴─────────────────────────────┘')
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
