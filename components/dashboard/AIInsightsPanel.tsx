'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, Lightbulb, Trophy, TrendingUp,
  ArrowRight, Sparkles, ChevronRight,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAIStore } from '@/store'
import type { AIInsight } from '@/types'
import { cn } from '@/lib/utils'

const INSIGHT_CONFIG = {
  warning:     { icon: AlertTriangle, color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/25',  badge: 'warning'     as const },
  tip:         { icon: Lightbulb,    color: 'text-sky-400',   bg: 'bg-sky-500/15',    border: 'border-sky-500/25',    badge: 'default'     as const },
  achievement: { icon: Trophy,       color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/25', badge: 'success'   as const },
  prediction:  { icon: TrendingUp,   color: 'text-rose-400',   bg: 'bg-rose-500/15',   border: 'border-rose-500/25',   badge: 'destructive' as const },
}

function InsightItem({ insight }: { insight: AIInsight }) {
  const [expanded, setExpanded] = useState(false)
  const config = INSIGHT_CONFIG[insight.type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'rounded-xl border p-3.5 cursor-pointer transition-all duration-200',
        config.bg, config.border,
        'hover:brightness-110'
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5', config.bg)}>
          <Icon className={cn('w-3.5 h-3.5', config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-semibold text-foreground leading-tight">{insight.title}</p>
            {insight.priority === 'high' && (
              <Badge variant={config.badge} className="text-xs py-0 px-1.5 h-4">
                {insight.priority}
              </Badge>
            )}
          </div>
          <p className={cn('text-xs text-muted-foreground leading-relaxed transition-all', !expanded && 'line-clamp-2')}>
            {insight.description}
          </p>
          {expanded && insight.actionable && (
            <div className="mt-2 pt-2 border-t border-border">
              <p className="text-xs font-medium text-foreground/80">
                💡 {insight.actionable}
              </p>
            </div>
          )}
        </div>
        <ChevronRight
          className={cn('w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5 transition-transform', expanded && 'rotate-90')}
        />
      </div>
    </div>
  )
}

export function LearningInsightsPanel() {
  const { insights } = useAIStore()
  const prioritized = [...insights].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return order[a.priority] - order[b.priority]
  })

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">AI Insights</h3>
          <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">
            {insights.length} new
          </span>
        </div>
        <Link
          href="/assistant"
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
        >
          Ask AI <ArrowRight size={12} />
        </Link>
      </div>

      <div className="space-y-2">
        {prioritized.slice(0, 4).map((insight) => (
          <InsightItem key={insight.id} insight={insight} />
        ))}
      </div>
    </Card>
  )
}
