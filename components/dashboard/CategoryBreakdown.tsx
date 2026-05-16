'use client'
import { GlassCard } from '@/components/common/GlassCard'
import { CategoryPieChart } from '@/components/charts/CategoryPieChart'
import { MOCK_SUBJECT_STUDY } from '@/data/mockData'

export function SubjectBreakdown() {
  const data = MOCK_SUBJECT_STUDY

  return (
    <GlassCard className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
        <h3 className="text-sm font-semibold text-foreground">Subject Breakdown</h3>
        <span className="text-xs text-muted-foreground">May 2026</span>
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
    </GlassCard>
  )
}
