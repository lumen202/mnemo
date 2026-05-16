'use client'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useUIStore, type Theme } from '@/store'
import { cn } from '@/lib/utils'

const CYCLE: Theme[] = ['dark', 'light', 'system']

const ICONS: Record<Theme, React.ElementType> = {
  dark: Moon,
  light: Sun,
  system: Monitor,
}

const LABELS: Record<Theme, string> = {
  dark: 'Dark',
  light: 'Light',
  system: 'System',
}

interface ThemeToggleProps {
  showLabel?: boolean
  className?: string
}

export function ThemeToggle({ showLabel = false, className }: ThemeToggleProps) {
  const { theme, setTheme } = useUIStore()

  function cycle() {
    const next = CYCLE[(CYCLE.indexOf(theme) + 1) % CYCLE.length]
    setTheme(next)
  }

  const Icon = ICONS[theme]

  return (
    <button
      onClick={cycle}
      title={`Theme: ${LABELS[theme]} — click to switch`}
      className={cn(
        'flex items-center gap-1.5 rounded-lg px-2 py-1.5',
        'text-muted-foreground hover:text-foreground hover:bg-accent/50',
        'transition-colors duration-150 text-sm',
        className
      )}
    >
      <Icon size={15} />
      {showLabel && <span className="text-xs font-medium">{LABELS[theme]}</span>}
    </button>
  )
}
