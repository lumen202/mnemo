'use client'

import Link from 'next/link'
import { CalendarClock, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useFlashcardStore } from '@/store'
import { buildForecast, describeLoad } from '@/utils/forecast'
import { cn } from '@/lib/utils'

/**
 * The next two weeks of review load.
 *
 * Spacing asks a student to trust that not studying something today is correct. That trust needs
 * evidence, and the evidence is the shape of the week ahead — a wall of bars on Thursday is a
 * reason to do a few extra today, and a flat week is permission to stop. Without this, the queue
 * appears from nowhere each morning and cramming feels safer than the schedule.
 *
 * Reads only from cards already in the store; no query, no endpoint.
 */
export function ReviewForecast() {
  const flashcards = useFlashcardStore((s) => s.flashcards)
  const forecast = buildForecast(flashcards, 14)

  if (flashcards.length === 0) return null

  const scale = Math.max(forecast.peak, 1)

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <CalendarClock className="w-4.5 h-4.5 text-primary mt-0.5" aria-hidden />
          <div>
            <h3 className="font-semibold text-sm">Review forecast</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{describeLoad(forecast)}</p>
          </div>
        </div>
        {forecast.dueToday > 0 && (
          <Link
            href="/flashcards"
            className="text-xs font-semibold text-primary hover:underline whitespace-nowrap"
          >
            Review now
          </Link>
        )}
      </div>

      <div className="flex items-end gap-1 h-24" role="img" aria-label={`Cards due over the next 14 days. ${describeLoad(forecast)}`}>
        {forecast.days.map((day) => {
          const height = day.count === 0 ? 2 : Math.max(6, Math.round((day.count / scale) * 88))
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <span
                className={cn(
                  'text-[10px] tabular-nums leading-none',
                  day.count === 0 ? 'text-transparent' : 'text-muted-foreground',
                )}
              >
                {day.count}
              </span>
              <div
                style={{ height: `${height}px` }}
                className={cn(
                  'w-full rounded-sm transition-colors',
                  day.isToday ? 'bg-primary' : day.count === 0 ? 'bg-border' : 'bg-primary/35',
                )}
                title={`${day.count} due on ${day.date}`}
              />
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Today</span>
        <span>In 2 weeks</span>
      </div>

      {forecast.leeches > 0 && (
        <div className="flex items-start gap-2 rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden />
          <span>
            {forecast.leeches} card{forecast.leeches === 1 ? ' has' : 's have'} been forgotten five
            or more times. Re-drilling isn&rsquo;t working — try rewriting {forecast.leeches === 1 ? 'it' : 'them'} as
            something smaller.
          </span>
        </div>
      )}
    </Card>
  )
}
