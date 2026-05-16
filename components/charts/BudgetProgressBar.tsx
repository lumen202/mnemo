import { cn } from '@/lib/utils'
import { computeSubjectProgress, getSubjectStatus } from '@/utils/analytics'

interface BudgetProgressBarProps {
  budgeted: number
  spent: number
  color?: string
  className?: string
  showLabel?: boolean
}

export function BudgetProgressBar({
  budgeted,
  spent,
  color,
  className,
  showLabel = false,
}: BudgetProgressBarProps) {
  const pct = computeSubjectProgress(budgeted, spent)
  const rawStatus = getSubjectStatus(budgeted, spent)
  const status = rawStatus === 'ahead' ? 'safe' : rawStatus === 'on-track' ? 'safe' : 'warning'

  const trackColor = {
    safe:    color ?? 'bg-indigo-500',
    warning: 'bg-amber-500',
    danger:  'bg-rose-500',
  }[status]

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{Math.round(pct)}% used</span>
          <span>{Math.round(100 - pct)}% left</span>
        </div>
      )}
      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', trackColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
