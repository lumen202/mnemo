'use client'
import { GlassCard } from '@/components/common/GlassCard'
import { TrendLineChart } from '@/components/charts/TrendLineChart'

export function StudyProgressChart() {
  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Study Activity</h3>
          <p className="text-xs text-muted-foreground mt-0.5">6-week trend</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-indigo-400" />
          <span className="text-xs text-muted-foreground mr-3">Hours</span>
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs text-muted-foreground mr-3">Flashcards</span>
          <div className="w-2 h-2 rounded-full bg-violet-400" />
          <span className="text-xs text-muted-foreground">Materials</span>
        </div>
      </div>
      <TrendLineChart height={200} />
    </GlassCard>
  )
}
