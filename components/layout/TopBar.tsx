'use client'
import { usePathname } from 'next/navigation'
import { Plus, Search, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useUIStore } from '@/store'

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':  { title: 'Dashboard',       subtitle: 'Your learning overview'          },
  '/materials':  { title: 'Study Materials', subtitle: 'Manage your uploaded content'    },
  '/subjects':   { title: 'Subjects',        subtitle: 'Courses and topic organization'  },
  '/flashcards': { title: 'Flashcards',      subtitle: 'AI-generated review cards'       },
  '/quizzes':    { title: 'Quizzes',         subtitle: 'Test your knowledge'             },
  '/planner':    { title: 'Study Planner',   subtitle: 'Goals, sessions, and schedule'   },
  '/assistant':  { title: 'AI Tutor',        subtitle: 'Your personal learning assistant'},
}

export function TopBar() {
  const pathname = usePathname()
  const { setSidebarOpen, isMobile } = useUIStore()
  const { setAddMaterialOpen, setCommandPaletteOpen } = useUIStore()

  const page = PAGE_TITLES[pathname] ?? { title: 'Mnemo', subtitle: '' }

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-border bg-background shrink-0">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground hover:text-foreground shrink-0 lg:hidden min-h-[44px]"
            title="Open menu"
          >
            <Menu size={20} />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold text-foreground leading-tight truncate">{page.title}</h1>
          <p className="text-xs text-muted-foreground truncate">{page.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Desktop: a real search affordance that shows the shortcut. */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden md:flex items-center gap-2 h-9 pl-3 pr-2 rounded-lg border border-border bg-muted text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
          title="Search pages and actions"
        >
          <Search size={15} />
          <span className="text-xs">Search</span>
          <kbd className="text-xs border border-border rounded px-1.5 py-0.5 ml-2">⌘K</kbd>
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-muted-foreground hover:text-foreground min-h-[44px]"
          onClick={() => setCommandPaletteOpen(true)}
          title="Search"
        >
          <Search size={18} />
        </Button>
        {isMobile ? (
          <Button
            size="icon"
            className="min-h-[44px] w-10"
            onClick={() => setAddMaterialOpen(true)}
            title="Upload Material"
          >
            <Plus size={18} />
          </Button>
        ) : (
          <Button
            size="sm"
            className="gap-1.5 ml-1 min-h-[44px]"
            onClick={() => setAddMaterialOpen(true)}
          >
            <Plus size={15} />
            Upload Material
          </Button>
        )}
        <ThemeToggle className="text-muted-foreground hover:text-foreground hover:bg-muted min-h-[44px] ml-1" />
      </div>
    </header>
  )
}
