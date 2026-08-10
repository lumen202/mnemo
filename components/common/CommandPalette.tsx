'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, FileText, BookOpen, Layers, HelpCircle, CalendarDays,
  Sparkles, Upload, Clock, Target, Search, CornerDownLeft, type LucideIcon,
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useUIStore } from '@/store'
import { cn } from '@/lib/utils'

interface Command {
  id: string
  label: string
  hint: string
  icon: LucideIcon
  group: 'Go to' | 'Actions'
  run: () => void
}

/**
 * ⌘K palette — navigation plus the three global "create" actions.
 * Registered once in GlobalModals; the keyboard listener is global so the
 * palette opens from any dashboard page.
 */
export function CommandPalette() {
  const router = useRouter()
  const { commandPaletteOpen, setCommandPaletteOpen, setAddMaterialOpen, setLogSessionOpen, setAddGoalOpen } = useUIStore()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandPaletteOpen(!useUIStore.getState().commandPaletteOpen)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setCommandPaletteOpen])

  // Reset the query each time the palette opens — a stale filter is worse than
  // a blank one, since the list is short enough to scan.
  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('')
      setActiveIndex(0)
    }
  }, [commandPaletteOpen])

  const commands = useMemo<Command[]>(() => {
    const close = (fn: () => void) => () => {
      setCommandPaletteOpen(false)
      fn()
    }
    return [
      { id: 'dashboard',  label: 'Dashboard',       hint: 'Learning overview',      icon: LayoutDashboard, group: 'Go to',   run: close(() => router.push('/dashboard')) },
      { id: 'materials',  label: 'Study Materials', hint: 'Uploaded content',       icon: FileText,        group: 'Go to',   run: close(() => router.push('/materials')) },
      { id: 'subjects',   label: 'Subjects',        hint: 'Courses and topics',     icon: BookOpen,        group: 'Go to',   run: close(() => router.push('/subjects')) },
      { id: 'flashcards', label: 'Flashcards',      hint: 'Spaced repetition',      icon: Layers,          group: 'Go to',   run: close(() => router.push('/flashcards')) },
      { id: 'quizzes',    label: 'Quizzes',         hint: 'Test your knowledge',    icon: HelpCircle,      group: 'Go to',   run: close(() => router.push('/quizzes')) },
      { id: 'planner',    label: 'Study Planner',   hint: 'Goals and sessions',     icon: CalendarDays,    group: 'Go to',   run: close(() => router.push('/planner')) },
      { id: 'assistant',  label: 'AI Tutor',        hint: 'Ask anything',           icon: Sparkles,        group: 'Go to',   run: close(() => router.push('/assistant')) },
      { id: 'upload',     label: 'Upload material', hint: 'Add notes or a document', icon: Upload,         group: 'Actions', run: close(() => setAddMaterialOpen(true)) },
      { id: 'log',        label: 'Log a session',   hint: 'Record study time',      icon: Clock,           group: 'Actions', run: close(() => setLogSessionOpen(true)) },
      { id: 'goal',       label: 'New study goal',  hint: 'Set a target date',      icon: Target,          group: 'Actions', run: close(() => setAddGoalOpen(true)) },
    ]
  }, [router, setCommandPaletteOpen, setAddMaterialOpen, setLogSessionOpen, setAddGoalOpen])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => `${c.label} ${c.hint}`.toLowerCase().includes(q))
  }, [commands, query])

  // Grouped for display, but arrow keys walk the flat filtered order.
  const groups = useMemo(() => {
    const order: Command['group'][] = ['Go to', 'Actions']
    return order
      .map((group) => ({ group, items: filtered.filter((c) => c.group === group) }))
      .filter((g) => g.items.length > 0)
  }, [filtered])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (filtered.length === 0 ? 0 : (i + 1) % filtered.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (filtered.length === 0 ? 0 : (i - 1 + filtered.length) % filtered.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      filtered[activeIndex]?.run()
    }
  }

  return (
    <Dialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <DialogContent className="max-w-lg p-0 overflow-hidden top-[20%] translate-y-0">
        <DialogTitle className="sr-only">Command palette</DialogTitle>

        <div className="flex items-center gap-2.5 px-4 h-12 border-b border-border">
          <Search size={15} className="text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages and actions..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <kbd className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">esc</kbd>
        </div>

        <div ref={listRef} className="max-h-[340px] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">No matches for “{query}”</p>
          )}

          {groups.map(({ group, items }) => (
            <div key={group} className="px-2 pb-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground/70 font-semibold px-2 py-1.5">
                {group}
              </p>
              {items.map((cmd) => {
                const flatIndex = filtered.indexOf(cmd)
                const isActive = flatIndex === activeIndex
                const Icon = cmd.icon
                return (
                  <button
                    key={cmd.id}
                    onClick={cmd.run}
                    onMouseEnter={() => setActiveIndex(flatIndex)}
                    className={cn(
                      'w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors',
                      isActive ? 'bg-accent' : 'hover:bg-accent'
                    )}
                  >
                    <Icon size={15} className={isActive ? 'text-foreground' : 'text-muted-foreground'} />
                    <span className="text-sm text-foreground flex-1 min-w-0 truncate">{cmd.label}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[45%]">{cmd.hint}</span>
                    {isActive && <CornerDownLeft size={12} className="text-muted-foreground shrink-0" />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
