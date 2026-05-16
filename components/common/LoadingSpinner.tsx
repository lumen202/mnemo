import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClass = {
    sm: 'w-4 h-4 border-2',
    md: 'w-7 h-7 border-2',
    lg: 'w-10 h-10 border-[3px]',
  }[size]

  return (
    <div
      className={cn(
        'rounded-full border-white/10 border-t-indigo-400 animate-spin',
        sizeClass,
        className
      )}
    />
  )
}

export function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground animate-pulse-slow">Loading...</p>
      </div>
    </div>
  )
}
