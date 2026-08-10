'use client'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  /** Primary call to action. Omit for a purely informational state. */
  action?: { label: string; onClick: () => void; icon?: LucideIcon }
  /** Secondary, lower-emphasis action. */
  secondaryAction?: { label: string; onClick: () => void }
  className?: string
}

/**
 * The one empty state used everywhere — a first-run screen should read as an
 * invitation, not a failure. Every list surface renders this instead of a blank
 * grid so a fresh account still explains what to do next.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const ActionIcon = action?.icon

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-6 py-14 rounded-2xl',
        'border border-dashed border-white/[0.10] bg-white/[0.015]',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-indigo-400" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">{description}</p>

      {(action || secondaryAction) && (
        <div className="flex items-center gap-2 mt-5">
          {action && (
            <Button size="sm" className="gap-1.5" onClick={action.onClick}>
              {ActionIcon && <ActionIcon size={13} />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button size="sm" variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
