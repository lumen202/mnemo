'use client'
import { TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useStudyMaterialStore, useStudySessionStore, useSubjectStore, useFlashcardStore } from '@/store'
import { computeStudyAnalytics, computeLearningScore } from '@/utils/analytics'
import { cn } from '@/lib/utils'

function ScoreRing({ score }: { score: number }) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#f43f5e'

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" className="stroke-muted" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground tabular-nums">{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  )
}

export function LearningScore() {
  const { materials } = useStudyMaterialStore()
  const { sessions } = useStudySessionStore()
  const { subjects } = useSubjectStore()
  const { flashcards } = useFlashcardStore()

  const analytics = computeStudyAnalytics(materials, sessions, subjects)
  const { overall, dimensions, trend, explanation } = computeLearningScore(analytics, flashcards, subjects)

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-muted-foreground'
  const trendText = trend === 'up' ? '+5 from last week' : trend === 'down' ? '-2 from last week' : 'Stable'

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-5">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Learning Score</h3>
      </div>

      <ScoreRing score={overall} />

      <div className={cn('flex items-center justify-center gap-1.5 mt-3 text-xs font-medium', trendColor)}>
        <TrendIcon size={12} />
        <span>{trendText}</span>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-3 leading-relaxed px-2">
        {explanation}
      </p>

      <div className="space-y-3 mt-5">
        {dimensions.map((dim) => {
          const color =
            dim.score >= 80 ? 'bg-emerald-500' :
            dim.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
          return (
            <div key={dim.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground font-medium">{dim.label}</span>
                <span className="text-foreground font-semibold tabular-nums">{dim.score}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-700 ease-out', color)}
                  style={{ width: `${dim.score}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
