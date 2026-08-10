import { cn } from '@/lib/utils'
import { computeSubjectProgress, getSubjectStatus } from '@/utils/analytics'

interface SubjectProgressBarProps {
  target: number
  completed: number
  color?: string
  className?: string
  showLabel?: boolean
}

export function SubjectProgressBar({
  target,
  completed,
  color,
  className,
  showLabel = false,
}: SubjectProgressBarProps) {
  const pct = computeSubjectProgress(target, completed)
  const rawStatus = getSubjectStatus(target, completed)
  const status = rawStatus === 'ahead' ? 'safe' : rawStatus === 'on-track' ? 'safe' : 'warning'

  const trackColor = {
    safe:    color ?? 'bg-primary',
    warning: 'bg-amber-500',
    danger:  'bg-rose-500',
  }[status]

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{Math.round(pct)}% complete</span>
          <span>{Math.round(100 - pct)}% remaining</span>
        </div>
      )}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', trackColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
