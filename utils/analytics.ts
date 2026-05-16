import type { StudyMaterial, StudySession, Subject, StudyAnalytics, SubjectStudy } from '@/types'
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
