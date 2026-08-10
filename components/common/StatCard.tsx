import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  subValue?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  icon?: React.ReactNode
  iconBg?: string
  accentColor?: string
  className?: string
  animate?: boolean
}

export function StatCard({
  label,
  value,
  subValue,
  trend,
  trendValue,
  icon,
  iconBg = 'bg-primary/15',
  accentColor = 'text-primary',
  className,
  animate = true,
}: StatCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-muted-foreground'

  return (
    <Card
      className={cn(
        'p-5 hover:border-foreground/20',
        animate && 'animate-fade-in',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {icon && (
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
            <span className={cn('w-5 h-5', accentColor)}>{icon}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-0.5 leading-tight tabular-nums">{value}</p>
          {subValue && <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>}
        </div>
      </div>
      {trendValue && trend && (
        <div className={cn('flex items-center gap-1 mt-3 text-xs font-medium', trendColor)}>
          <TrendIcon size={12} />
          <span>{trendValue}</span>
        </div>
      )}
    </Card>
  )
}
