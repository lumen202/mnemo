'use client'
import { Flame, Clock, BookOpen, Target, Trophy, Zap } from 'lucide-react'
import { GlassCard } from '@/components/common/GlassCard'
import { useStudyMaterialStore, useStudySessionStore, useSubjectStore } from '@/store'
import { computeStudyAnalytics } from '@/utils/analytics'
import { cn } from '@/lib/utils'

export function StudyStatsCard() {
  const { materials } = useStudyMaterialStore()
  const { sessions, goals } = useStudySessionStore()
  const { subjects } = useSubjectStore()

  const analytics = computeStudyAnalytics(materials, sessions, subjects)
  const completedGoals = goals.filter((g) => g.completed).length

  const stats = [
    {
      label: 'Study Hours',
      value: `${analytics.totalStudyHours}h`,
      sublabel: 'this month',
      icon: Clock,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/15',
      border: 'border-indigo-500/20',
    },
    {
      label: 'Materials',
      value: `${analytics.completedMaterials}/${analytics.totalMaterials}`,
      sublabel: 'reviewed',
      icon: BookOpen,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/15',
      border: 'border-cyan-500/20',
    },
    {
      label: 'Active Subjects',
      value: `${analytics.activeSubjects}`,
      sublabel: `of ${subjects.length} enrolled`,
      icon: Target,
      color: 'text-violet-400',
      bg: 'bg-violet-500/15',
      border: 'border-violet-500/20',
    },
  ]

  return (
    <GlassCard className="p-6 col-span-full" glow="indigo" shine>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
            May 2026 · Study Overview
          </p>
          <h2 className="text-3xl font-bold gradient-text-study tabular-nums">
            {analytics.totalStudyHours}h studied
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Across {analytics.activeSubjects} active subjects this month
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5">
            <Flame className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-xs text-muted-foreground">Study Streak</p>
              <p className="text-lg font-bold text-amber-400 tabular-nums">
                {analytics.studyStreak} day{analytics.studyStreak !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-xs text-muted-foreground">Goals Done</p>
              <p className="text-lg font-bold text-emerald-400 tabular-nums">
                {completedGoals}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ label, value, sublabel, icon: Icon, color, bg, border }) => (
          <div
            key={label}
            className={cn('rounded-xl p-4 border', bg, border)}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', bg)}>
                <Icon className={cn('w-3.5 h-3.5', color)} />
              </div>
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
            </div>
            <p className={cn('text-xl font-bold tabular-nums', color)}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
