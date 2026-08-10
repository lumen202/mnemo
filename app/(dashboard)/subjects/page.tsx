'use client'
import { Sparkles, BookOpen, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useSubjectStore } from '@/store'
import { computeSubjectProgress, getSubjectStatus } from '@/utils/analytics'
import { cn } from '@/lib/utils'
import type { Subject } from '@/types'

function SubjectCard({ subject }: { subject: Subject }) {
  const progress = computeSubjectProgress(subject.targetHours, subject.completedHours)
  const status = getSubjectStatus(subject.targetHours, subject.completedHours)

  const statusConfig = {
    ahead:    { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/25', icon: CheckCircle, label: 'Ahead' },
    'on-track': { color: 'text-primary', bg: 'bg-primary/15', border: 'border-primary/25', icon: TrendingUp, label: 'On Track' },
    behind:   { color: 'text-amber-400',   bg: 'bg-amber-500/15',   border: 'border-amber-500/25',   icon: AlertCircle, label: 'Behind' },
  }

  const cfg = statusConfig[status]
  const StatusIcon = cfg.icon

  return (
    <Card className="p-5 flex flex-col gap-4 hover:bg-accent transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
            style={{ background: subject.color + '25', color: subject.color }}
          >
            <BookOpen size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{subject.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{subject.description}</p>
          </div>
        </div>
        <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', cfg.bg, cfg.color)}>
          <StatusIcon size={10} />
          {cfg.label}
        </div>
      </div>

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground font-medium">Progress</span>
          <span className="text-foreground font-semibold tabular-nums">
            {subject.completedHours}h / {subject.targetHours}h
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${subject.color}90, ${subject.color})`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{progress.toFixed(0)}% complete</span>
          <span>{Math.max(0, subject.targetHours - subject.completedHours).toFixed(1)}h remaining</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 pt-1 border-t border-border">
        <div className="flex items-center gap-1.5">
          <BookOpen size={12} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{subject.materialCount} materials</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{subject.period}</span>
        </div>
        {subject.aiRecommended && (
          <div className="flex items-center gap-1 ml-auto">
            <Sparkles size={10} className="text-primary" />
            <span className="text-xs text-primary font-medium">AI plan</span>
          </div>
        )}
      </div>
    </Card>
  )
}

export default function SubjectsPage() {
  const { subjects } = useSubjectStore()

  const totalHours = subjects.reduce((s, sub) => s + sub.targetHours, 0)
  const completedHours = subjects.reduce((s, sub) => s + sub.completedHours, 0)
  const aiRecommended = subjects.filter((s) => s.aiRecommended)
  const onTrack = subjects.filter((s) => {
    const st = getSubjectStatus(s.targetHours, s.completedHours)
    return st === 'on-track' || st === 'ahead'
  })

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* AI banner */}
      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground mb-1">AI-Powered Study Plans</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mnemo analyzed your schedule and learning patterns to suggest optimal study hour targets.{' '}
              <span className="text-primary font-medium">{aiRecommended.length} of {subjects.length} subjects</span>{' '}
              have AI-recommended plans based on your goals and available time.
            </p>
          </div>
        </div>
      </Card>

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Subjects',   value: `${subjects.length}`,                 color: 'text-primary',  bg: 'bg-primary/15' },
          { label: 'Hours Targeted',   value: `${totalHours}h`,                     color: 'text-foreground',  bg: 'bg-accent'        },
          { label: 'Hours Completed',  value: `${completedHours.toFixed(1)}h`,       color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
          { label: 'On Track',         value: `${onTrack.length} subjects`,          color: 'text-cyan-400',    bg: 'bg-cyan-500/15'    },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={cn('rounded-xl p-4 border border-border', bg)}>
            <p className="text-xs text-muted-foreground mb-2">{label}</p>
            <p className={cn('text-lg font-bold tabular-nums', color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Overall Study Progress</h3>
          <span className="text-xs text-muted-foreground tabular-nums">
            {completedHours.toFixed(1)}h / {totalHours}h
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${Math.min((completedHours / totalHours) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {(totalHours - completedHours).toFixed(1)}h remaining across all subjects this month
        </p>
      </Card>

      {/* Subject grid */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-4">Your Subjects</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} />
          ))}
        </div>
      </div>
    </div>
  )
}
