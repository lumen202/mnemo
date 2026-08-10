'use client'
import { Card } from '@/components/ui/card'
import { CategoryPieChart } from '@/components/charts/CategoryPieChart'
import { useStudyMaterialStore, useStudySessionStore, useSubjectStore } from '@/store'
import { computeStudyAnalytics } from '@/utils/analytics'
import { SUBJECT_META } from '@/data/mockData'

export function SubjectBreakdown() {
  const { materials } = useStudyMaterialStore()
  const { sessions } = useStudySessionStore()
  const { subjects } = useSubjectStore()

  const analytics = computeStudyAnalytics(materials, sessions, subjects)
  const data =
    analytics.subjectBreakdown.length > 0
      ? analytics.subjectBreakdown
      : subjects.map((s) => ({
          subjectId: s.slug as import('@/types').SubjectId,
          subjectName: SUBJECT_META[s.slug]?.label ?? s.name,
          hoursStudied: s.completedHours,
          percentage: 0,
          color: SUBJECT_META[s.slug]?.color ?? s.color ?? '#64748b',
        }))

  const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
        <h3 className="text-sm font-semibold text-foreground">Subject Breakdown</h3>
        <span className="text-xs text-muted-foreground">{month}</span>
      </div>

      <div className="flex justify-center mb-4">
        <CategoryPieChart data={data} size={140} />
      </div>

      <div className="space-y-2">
        {data.slice(0, 5).map((item) => (
          <div key={item.subjectId} className="flex items-center gap-2 sm:gap-3">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
            <span className="text-xs text-muted-foreground flex-1 truncate">
              {item.subjectName}
            </span>
            <span className="text-xs font-semibold text-foreground tabular-nums shrink-0">
              {item.hoursStudied}h
            </span>
            <span className="text-xs text-muted-foreground tabular-nums w-8 sm:w-10 text-right shrink-0">
              {item.percentage.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
