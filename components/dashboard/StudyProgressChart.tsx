'use client'
import { GlassCard } from '@/components/common/GlassCard'
import { TrendLineChart } from '@/components/charts/TrendLineChart'
import { useStudySessionStore, useFlashcardStore } from '@/store'
import { computeWeeklyTrend } from '@/utils/analytics'

export function StudyProgressChart() {
  const { sessions } = useStudySessionStore()
  const { flashcards } = useFlashcardStore()
  const trend = computeWeeklyTrend(sessions, flashcards)

  return (
    <GlassCard className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-5 gap-3 sm:gap-0">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">Study Activity</h3>
          <p className="text-xs text-muted-foreground mt-0.5">6-week trend</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
            <span className="text-xs text-muted-foreground">Hours</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-xs text-muted-foreground">Flashcards</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
            <span className="text-xs text-muted-foreground">Materials</span>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <TrendLineChart data={trend} height={200} />
      </div>
    </GlassCard>
  )
}
