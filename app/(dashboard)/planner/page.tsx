'use client'
import { Flame, CalendarDays, CheckCircle, Circle, Target, Clock, TrendingUp, Sparkles } from 'lucide-react'
import { GlassCard } from '@/components/common/GlassCard'
import { Button } from '@/components/ui/button'
import { useStudySessionStore, useSubjectStore } from '@/store'
import { SUBJECT_META } from '@/data/mockData'
import { cn } from '@/lib/utils'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HEATMAP_DATA = [7, 6, 5, 4, 3, 2, 1, 0].map((weeksAgo) =>
  DAYS.map((day, dayIndex) => {
    const baseHours = Math.random() * 3
    const recentBoost = weeksAgo < 2 ? 1.2 : 1
    const hours = +(baseHours * recentBoost).toFixed(1)
    return { day, weeksAgo, hours }
  })
)

export default function PlannerPage() {
  const { sessions, goals, updateGoal } = useStudySessionStore()
  const { subjects } = useSubjectStore()

  const totalHoursThisMonth = sessions.reduce((s, sess) => s + sess.durationMinutes / 60, 0)
  const todaySessions = sessions.filter((s) => s.date === new Date().toISOString().split('T')[0])
  const todayHours = todaySessions.reduce((s, sess) => s + sess.durationMinutes / 60, 0)
  const activeDays = new Set(sessions.map((s) => s.date)).size

  // Streak
  const sessionDates = new Set(sessions.map((s) => s.date))
  let streak = 0
  const cursor = new Date()
  while (sessionDates.has(cursor.toISOString().split('T')[0])) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  const pendingGoals = goals.filter((g) => !g.completed)
  const completedGoals = goals.filter((g) => g.completed)

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Study Streak', value: `${streak} days`, icon: Flame, color: 'text-amber-400', bg: 'bg-amber-500/15' },
          { label: 'Today',        value: `${todayHours.toFixed(1)}h`, icon: Clock, color: 'text-indigo-400', bg: 'bg-indigo-500/15' },
          { label: 'This Month',   value: `${totalHoursThisMonth.toFixed(1)}h`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
          { label: 'Active Days',  value: `${activeDays}`, icon: CalendarDays, color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={cn('rounded-xl p-4 border border-white/[0.06]', bg)}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} className={color} />
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
            <p className={cn('text-xl font-bold tabular-nums', color)}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Goals */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-indigo-400" />
                <h3 className="text-sm font-semibold text-foreground">Study Goals</h3>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-medium">
                  {pendingGoals.length} active
                </span>
              </div>
              <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs">
                <Sparkles size={11} />
                AI Suggest
              </Button>
            </div>

            <div className="space-y-3">
              {[...pendingGoals, ...completedGoals].map((goal) => {
                const subjectMeta = goal.subjectId ? SUBJECT_META[goal.subjectId] : null
                return (
                  <div
                    key={goal.id}
                    className={cn(
                      'rounded-xl p-4 border transition-all',
                      goal.completed
                        ? 'border-emerald-500/20 bg-emerald-500/5'
                        : 'border-white/[0.06] bg-white/[0.02]'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => updateGoal(goal.id, { completed: !goal.completed })}
                        className="mt-0.5 shrink-0"
                      >
                        {goal.completed ? (
                          <CheckCircle size={16} className="text-emerald-400" />
                        ) : (
                          <Circle size={16} className="text-muted-foreground hover:text-indigo-400 transition-colors" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={cn('text-sm font-medium', goal.completed ? 'text-muted-foreground line-through' : 'text-foreground')}>
                            {goal.title}
                          </p>
                          {subjectMeta && (
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                              style={{ color: subjectMeta.color, background: subjectMeta.color + '20' }}
                            >
                              {subjectMeta.label}
                            </span>
                          )}
                        </div>
                        {goal.description && (
                          <p className="text-xs text-muted-foreground mb-2">{goal.description}</p>
                        )}
                        {!goal.completed && (
                          <div>
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>{goal.progress}% complete</span>
                              <span>Due {new Date(goal.targetDate).toLocaleDateString()}</span>
                            </div>
                            <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500"
                                style={{ width: `${goal.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </GlassCard>

          {/* Recent sessions */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} className="text-indigo-400" />
              <h3 className="text-sm font-semibold text-foreground">Recent Sessions</h3>
            </div>
            <div className="space-y-2">
              {sessions.slice(0, 6).map((session) => {
                const meta = SUBJECT_META[session.subjectId]
                const hours = (session.durationMinutes / 60).toFixed(1)
                return (
                  <div key={session.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{ background: (meta?.color ?? '#6366f1') + '25', color: meta?.color ?? '#6366f1' }}
                    >
                      {hours}h
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{meta?.label ?? session.subjectId}</p>
                      {session.notes && (
                        <p className="text-xs text-muted-foreground truncate">{session.notes}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{session.date}</span>
                  </div>
                )
              })}
            </div>
          </GlassCard>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Activity heatmap */}
          <GlassCard className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Activity Heatmap</h3>
            <div className="flex gap-1">
              {HEATMAP_DATA.slice(0, 6).map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1 flex-1">
                  {week.map(({ hours }, di) => (
                    <div
                      key={di}
                      title={`${hours}h`}
                      className="w-full aspect-square rounded-sm transition-colors"
                      style={{
                        background: hours === 0
                          ? 'rgba(255,255,255,0.05)'
                          : hours < 1
                          ? 'rgba(99,102,241,0.2)'
                          : hours < 2
                          ? 'rgba(99,102,241,0.45)'
                          : 'rgba(99,102,241,0.75)',
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-1.5 mt-2">
              {[0, 0.2, 0.45, 0.75].map((opacity, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-sm"
                  style={{ background: opacity === 0 ? 'rgba(255,255,255,0.05)' : `rgba(99,102,241,${opacity})` }}
                />
              ))}
              <span className="text-[10px] text-muted-foreground ml-1">Less → More</span>
            </div>
          </GlassCard>

          {/* Subject targets */}
          <GlassCard className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Subject Targets</h3>
            <div className="space-y-3">
              {subjects.slice(0, 5).map((subject) => {
                const progress = Math.min((subject.completedHours / subject.targetHours) * 100, 100)
                return (
                  <div key={subject.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground font-medium truncate pr-2">{subject.name}</span>
                      <span className="text-foreground font-semibold tabular-nums shrink-0">
                        {subject.completedHours}h
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${progress}%`,
                          background: subject.color,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </GlassCard>

          {/* AI tip */}
          <GlassCard className="p-4 bg-indigo-500/5 border border-indigo-500/20">
            <div className="flex items-start gap-2.5">
              <Sparkles size={14} className="text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground mb-1">AI Study Tip</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Based on your patterns, you study best between 7–9 PM. Schedule your hardest topics during this window for maximum retention.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
