import { cn } from '@/lib/utils'

/** A single pulsing placeholder block. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-white/[0.06]', className)} />
}

/**
 * Card-shaped placeholder matching the glass surfaces used across the app —
 * a header line plus `lines` body rows of decreasing width.
 */
export function SkeletonCard({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('rounded-2xl glass border border-white/[0.07] p-5', className)}>
      <Skeleton className="h-4 w-1/3 mb-4" />
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')} />
        ))}
      </div>
    </div>
  )
}

/** Row of stat-tile placeholders — mirrors the 4-up stat grids. */
export function SkeletonStats({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl p-4 border border-white/[0.06] bg-white/[0.02]">
          <Skeleton className="h-3 w-20 mb-2.5" />
          <Skeleton className="h-6 w-12" />
        </div>
      ))}
    </div>
  )
}
