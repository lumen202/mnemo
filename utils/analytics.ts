import type { StudyMaterial, StudySession, Subject, StudyAnalytics, SubjectStudy, WeeklyStudyTrend, Flashcard, LearningHealthScore } from '@/types'
import { SUBJECT_META } from '@/data/mockData'

export function computeStudyAnalytics(
  materials: StudyMaterial[],
  sessions: StudySession[],
  subjects: Subject[]
): StudyAnalytics {
  const totalStudyHours = sessions.reduce((sum, s) => sum + s.durationMinutes / 60, 0)
  const completedMaterials = materials.filter(
    (m) => m.status === 'mastered' || m.status === 'reviewed'
  ).length

  // Streak: consecutive days from today backwards
  const today = new Date().toISOString().split('T')[0]
  const sessionDates = new Set(sessions.map((s) => s.date))
  let streak = 0
  const cursor = new Date(today)
  while (sessionDates.has(cursor.toISOString().split('T')[0])) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  // Subject breakdown from sessions
  const subjectHoursMap = new Map<string, number>()
  sessions.forEach((s) => {
    const current = subjectHoursMap.get(s.subjectId) ?? 0
    subjectHoursMap.set(s.subjectId, current + s.durationMinutes / 60)
  })

  const subjectBreakdown: SubjectStudy[] = Array.from(subjectHoursMap.entries())
    .map(([subjectId, hoursStudied]) => ({
      subjectId: subjectId as SubjectStudy['subjectId'],
      subjectName: SUBJECT_META[subjectId]?.label ?? subjectId,
      hoursStudied,
      percentage: totalStudyHours > 0 ? (hoursStudied / totalStudyHours) * 100 : 0,
      color: SUBJECT_META[subjectId]?.color ?? '#64748b',
    }))
    .sort((a, b) => b.hoursStudied - a.hoursStudied)
    .slice(0, 6)

  return {
    totalStudyHours: Math.round(totalStudyHours * 10) / 10,
    studyStreak: streak,
    activeSubjects: subjects.filter((s) => s.completedHours > 0).length,
    completedMaterials,
    totalMaterials: materials.length,
    subjectBreakdown,
    weeklyTrend: [],
  }
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export interface HeatmapDay {
  day: string
  weeksAgo: number
  hours: number
}

export function computeActivityHeatmap(sessions: StudySession[], weeks = 6): HeatmapDay[][] {
  const hoursByDate = new Map<string, number>()
  sessions.forEach((s) => {
    hoursByDate.set(s.date, (hoursByDate.get(s.date) ?? 0) + s.durationMinutes / 60)
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const totalDays = weeks * 7
  const days: HeatmapDay[] = []
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    days.push({
      day: DAY_LABELS[d.getDay()],
      weeksAgo: Math.floor(i / 7),
      hours: +(hoursByDate.get(dateStr) ?? 0).toFixed(1),
    })
  }

  const result: HeatmapDay[][] = []
  for (let w = 0; w < weeks; w++) {
    result.push(days.slice(w * 7, w * 7 + 7))
  }
  return result
}

export function computeWeeklyTrend(
  sessions: StudySession[],
  flashcards: Flashcard[],
): WeeklyStudyTrend[] {
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  const weeks = Array.from({ length: 6 }, (_, i) => {
    const end = new Date(today)
    end.setDate(today.getDate() - i * 7)
    const start = new Date(end)
    start.setDate(end.getDate() - 6)
    start.setHours(0, 0, 0, 0)
    const month = end.toLocaleDateString('en-US', { month: 'short' })
    const weekOfMonth = Math.ceil(end.getDate() / 7)
    return { label: `${month} W${weekOfMonth}`, start, end }
  }).reverse()

  return weeks.map(({ label, start, end }) => {
    const weekSessions = sessions.filter((s) => {
      const d = new Date(s.date)
      return d >= start && d <= end
    })
    const hoursStudied =
      Math.round((weekSessions.reduce((sum, s) => sum + s.durationMinutes / 60, 0)) * 10) / 10
    const reviewedMaterials = new Set<string>()
    weekSessions.forEach((s) => s.materialsReviewed?.forEach((m) => reviewedMaterials.add(m)))
    const flashcardsReviewed = flashcards.filter((f) => {
      if (!f.lastReviewed) return false
      const d = new Date(f.lastReviewed)
      return d >= start && d <= end
    }).length
    return { week: label, hoursStudied, flashcardsReviewed, materialsCompleted: reviewedMaterials.size }
  })
}

export function computeLearningScore(
  analytics: StudyAnalytics,
  flashcards: Flashcard[],
  subjects: Subject[],
): LearningHealthScore {
  const consistencyScore = Math.min(Math.round((analytics.studyStreak / 30) * 100), 100)

  const reviewedCards = flashcards.filter((f) => f.timesReviewed > 0)
  let retentionScore = 50
  if (reviewedCards.length > 0) {
    const weighted = reviewedCards.reduce((sum, f) => {
      const w = f.difficulty === 'easy' ? 1 : f.difficulty === 'medium' ? 0.7 : 0.4
      return sum + w
    }, 0)
    retentionScore = Math.round((weighted / reviewedCards.length) * 100)
  }

  const hours = subjects.map((s) => s.completedHours)
  let balanceScore = 100
  if (subjects.length > 1) {
    const avg = hours.reduce((a, b) => a + b, 0) / subjects.length
    const variance = hours.reduce((sum, h) => sum + Math.pow(h - avg, 2), 0) / subjects.length
    const cv = avg > 0 ? Math.sqrt(variance) / avg : 0
    balanceScore = Math.max(0, Math.round(100 - cv * 50))
  }

  const coverageScore =
    analytics.totalMaterials > 0
      ? Math.round((analytics.completedMaterials / analytics.totalMaterials) * 100)
      : 0

  const overall = Math.round(
    consistencyScore * 0.3 + retentionScore * 0.3 + balanceScore * 0.2 + coverageScore * 0.2
  )

  const dimensions = [
    {
      label: 'Study Consistency',
      score: consistencyScore,
      description:
        analytics.studyStreak > 0 ? `${analytics.studyStreak}-day streak` : 'No recent sessions',
    },
    {
      label: 'Retention Rate',
      score: retentionScore,
      description:
        reviewedCards.length > 0
          ? `${reviewedCards.length} flashcard${reviewedCards.length !== 1 ? 's' : ''} reviewed`
          : 'No flashcards reviewed yet',
    },
    {
      label: 'Subject Balance',
      score: balanceScore,
      description: `${analytics.activeSubjects} active subject${analytics.activeSubjects !== 1 ? 's' : ''}`,
    },
    {
      label: 'Material Coverage',
      score: coverageScore,
      description: `${analytics.completedMaterials} of ${analytics.totalMaterials} materials reviewed`,
    },
  ]

  const strongest = [...dimensions].sort((a, b) => b.score - a.score)[0]
  const weakest = [...dimensions].sort((a, b) => a.score - b.score)[0]
  const trend: 'up' | 'down' | 'stable' =
    overall >= 70 ? 'up' : overall >= 45 ? 'stable' : 'down'
  const explanation =
    overall >= 70
      ? `Your learning health is strong. ${strongest.label} is your best area — keep it up. Focus on ${weakest.label} to improve further.`
      : overall >= 45
      ? `You're making progress. Improving ${weakest.label} will boost your overall score the most.`
      : `Getting started! Building ${strongest.label} consistently will put you on track.`

  return { overall, dimensions, trend, explanation, tips: [] }
}

export function computeSubjectProgress(target: number, completed: number): number {
  if (target <= 0) return 0
  return Math.min((completed / target) * 100, 100)
}

export function getSubjectStatus(
  target: number,
  completed: number
): 'on-track' | 'behind' | 'ahead' {
  const pct = computeSubjectProgress(target, completed)
  if (pct >= 90) return 'ahead'
  if (pct >= 60) return 'on-track'
  return 'behind'
}

export function getMaterialStatusColor(status: StudyMaterial['status']): string {
  switch (status) {
    case 'mastered':   return 'text-emerald-400'
    case 'reviewed':   return 'text-indigo-400'
    case 'summarized': return 'text-amber-400'
    case 'pending':    return 'text-muted-foreground'
  }
}
