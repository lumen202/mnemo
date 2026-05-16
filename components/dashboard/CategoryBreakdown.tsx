'use client'
import { GlassCard } from '@/components/common/GlassCard'
import { CategoryPieChart } from '@/components/charts/CategoryPieChart'
import { MOCK_SUBJECT_STUDY } from '@/data/mockData'

export function SubjectBreakdown() {
  const data = MOCK_SUBJECT_STUDY

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Subject Breakdown</h3>
        <span className="text-xs text-muted-foreground">May 2026</span>
      </div>

      <CategoryPieChart data={data} size={160} />

      <div className="mt-4 space-y-2">
        {data.slice(0, 5).map((item) => (
          <div key={item.subjectId} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
            <span className="text-xs text-muted-foreground flex-1 truncate">
              {item.subjectName}
            </span>
            <span className="text-xs font-semibold text-foreground tabular-nums">
              {item.hoursStudied}h
            </span>
            <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
              {item.percentage.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
