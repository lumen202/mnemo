'use client'
import { Flame, CalendarDays, CheckCircle, Circle, Target, Clock, TrendingUp, BarChart3, Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { useStudySessionStore, useSubjectStore, useUIStore } from '@/store'
import { SUBJECT_META } from '@/data/mockData'
import { cn } from '@/lib/utils'
import { computeActivityHeatmap, computeStudyPattern } from '@/utils/analytics'
import { todayString, toDateString } from '@/utils/date'

export default function PlannerPage() {
  const { sessions, goals, updateGoal } = useStudySessionStore()
  const { subjects } = useSubjectStore()
  const { addToast, setLogSessionOpen, setAddGoalOpen } = useUIStore()
  const heatmap = computeActivityHeatmap(sessions)
  const pattern = computeStudyPattern(sessions)

  const toggleGoal = (goal: (typeof goals)[number]) => {
    updateGoal(goal.id, { completed: !goal.completed })
    if (!goal.completed) {
      addToast({ title: 'Goal completed', description: `"${goal.title}" — nice work.`, variant: 'success' })
    }
  }

  const totalHoursThisMonth = sessions.reduce((s, sess) => s + sess.durationMinutes / 60, 0)
  const todaySessions = sessions.filter((s) => s.date === todayString())
  const todayHours = todaySessions.reduce((s, sess) => s + sess.durationMinutes / 60, 0)
  const activeDays = new Set(sessions.map((s) => s.date)).size

  // Streak
  const sessionDates = new Set(sessions.map((s) => s.date))
  let streak = 0
  const cursor = new Date()
  while (sessionDates.has(toDateString(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  const pendingGoals = goals.filter((g) => !g.completed)
  const completedGoals = goals.filter((g) => g.completed)

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Study Streak', value: `${streak} days`, icon: Flame, color: 'text-amber-400', bg: 'bg-amber-500/15' },
          { label: 'Today',        value: `${todayHours.toFixed(1)}h`, icon: Clock, color: 'text-primary', bg: 'bg-primary/15' },
          { label: 'This Month',   value: `${totalHoursThisMonth.toFixed(1)}h`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
          { label: 'Active Days',  value: `${activeDays}`, icon: CalendarDays, color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={cn('rounded-xl p-4 border border-border', bg)}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} className={color} />
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
            <p className={cn('text-xl font-bold tabular-nums', color)}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Goals */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Study Goals</h3>
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                  {pendingGoals.length} active
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-7 text-xs"
                onClick={() => setAddGoalOpen(true)}
              >
                <Plus size={11} />
                New goal
              </Button>
            </div>

            {goals.length === 0 && (
              <EmptyState
                icon={Target}
                title="No goals yet"
                description="Set a goal with a target date to give your study sessions something to aim at."
                action={{ label: 'Add your first goal', onClick: () => setAddGoalOpen(true), icon: Plus }}
                className="py-10"
              />
            )}

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
                        : 'border-border bg-accent/40'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleGoal(goal)}
                        className="mt-0.5 shrink-0"
                      >
                        {goal.completed ? (
                          <CheckCircle size={16} className="text-emerald-400" />
                        ) : (
                          <Circle size={16} className="text-muted-foreground hover:text-primary transition-colors" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={cn('text-sm font-medium', goal.completed ? 'text-muted-foreground line-through' : 'text-foreground')}>
                            {goal.title}
                          </p>
                          {subjectMeta && (
            <span
                              className="text-xs px-2 py-0.5 rounded-full font-medium"
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
                            <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all duration-500"
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
          </Card>

          {/* Recent sessions */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Recent Sessions</h3>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-7 text-xs"
                onClick={() => setLogSessionOpen(true)}
              >
                <Plus size={11} />
                Log session
              </Button>
            </div>

            {sessions.length === 0 && (
              <EmptyState
                icon={Clock}
                title="No sessions logged"
                description="Log study time to build your streak, activity heatmap, and weekly trend."
                action={{ label: 'Log a session', onClick: () => setLogSessionOpen(true), icon: Plus }}
                className="py-10"
              />
            )}

            <div className="space-y-2">
              {sessions.slice(0, 6).map((session) => {
                const meta = SUBJECT_META[session.subjectId]
                const hours = (session.durationMinutes / 60).toFixed(1)
                return (
                  <div key={session.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent transition-colors">
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
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Activity heatmap */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Activity Heatmap</h3>
            <div className="flex gap-1">
              {heatmap.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1 flex-1">
                  {week.map(({ hours }, di) => (
                    <div
                      key={di}
                      title={`${hours}h`}
                      className="w-full aspect-square rounded-sm transition-colors bg-muted"
                      style={{
                        background: hours === 0
                          ? undefined
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
                  className="w-3 h-3 rounded-sm bg-muted"
                  style={{ background: opacity === 0 ? undefined : `rgba(99,102,241,${opacity})` }}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-1">Less → More</span>
            </div>
          </Card>

          {/* Subject targets */}
          <Card className="p-5">
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
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
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
          </Card>

          {/* Study pattern — computed from logged sessions, not predicted */}
          <Card className="p-4 bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-2.5">
              <BarChart3 size={14} className="text-primary shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground mb-2">Your Study Pattern</p>
                {pattern.bestDay ? (
                  <dl className="space-y-1.5 text-xs">
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Most productive day</dt>
                      <dd className="text-foreground font-medium">{pattern.bestDay}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Average session</dt>
                      <dd className="text-foreground font-medium tabular-nums">{pattern.averageSessionMinutes} min</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Most studied</dt>
                      <dd className="text-foreground font-medium truncate">{pattern.topSubject}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Sessions this week</dt>
                      <dd className="text-foreground font-medium tabular-nums">{pattern.sessionsThisWeek}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Log a few sessions and your patterns will show up here.
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
