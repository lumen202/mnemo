'use client'
import { usePathname } from 'next/navigation'
import { Bell, Plus, Search, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  const { setAddMaterialOpen } = useUIStore()

  const page = PAGE_TITLES[pathname] ?? { title: 'Mnemo', subtitle: '' }

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-white/[0.06] glass shrink-0">
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
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground min-h-[44px]">
          <Search size={18} />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative min-h-[44px]">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-400" />
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
      </div>
    </header>
  )
}
