'use client'
import { usePathname } from 'next/navigation'
import { Bell, Plus, Search } from 'lucide-react'
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
  const { setAddMaterialOpen } = useUIStore()

  const page = PAGE_TITLES[pathname] ?? { title: 'Mnemo', subtitle: '' }

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/[0.06] glass shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-foreground leading-tight">{page.title}</h1>
        <p className="text-xs text-muted-foreground">{page.subtitle}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Search size={18} />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-400" />
        </Button>
        <Button
          size="sm"
          className="gap-1.5 ml-1"
          onClick={() => setAddMaterialOpen(true)}
        >
          <Plus size={15} />
          Upload Material
        </Button>
      </div>
    </header>
  )
}
