import { cn } from '@/lib/utils'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: 'indigo' | 'emerald' | 'rose' | 'none'
  hover?: boolean
  shine?: boolean
}

export function GlassCard({
  className,
  children,
  glow = 'none',
  hover = true,
  shine = false,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl glass border border-white/[0.07]',
        hover && 'glass-hover',
        shine && 'card-shine',
        glow === 'indigo' && 'glow-indigo',
        glow === 'emerald' && 'glow-emerald',
        glow === 'rose' && 'glow-rose',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
