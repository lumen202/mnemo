'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, Layers, Brain, LogOut,
  GraduationCap, ChevronLeft, ChevronRight, Sparkles,
  FlipHorizontal, CircleHelp, CalendarDays,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore, useAuthStore } from '@/store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/materials',  label: 'Study Materials', icon: BookOpen        },
  { href: '/subjects',   label: 'Subjects',        icon: Layers          },
  { href: '/flashcards', label: 'Flashcards',      icon: FlipHorizontal  },
  { href: '/quizzes',    label: 'Quizzes',         icon: CircleHelp      },
  { href: '/planner',    label: 'Planner',         icon: CalendarDays    },
  { href: '/assistant',  label: 'AI Tutor',        icon: Brain           },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { user, signOut } = useAuthStore()

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen border-r border-white/[0.06] sidebar-gradient',
        'transition-all duration-300 ease-in-out',
        sidebarOpen ? 'w-60' : 'w-[72px]'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5', !sidebarOpen && 'justify-center')}>
        <div className="relative shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background animate-pulse-slow" />
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <span className="text-base font-bold gradient-text-study tracking-tight block">Mnemo</span>
            <span className="text-[10px] text-muted-foreground block -mt-0.5">AI Study Companion</span>
          </div>
        )}
      </div>

      <Separator />

      {/* AI Badge */}
      {sidebarOpen && (
        <div className="mx-3 my-3 px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="text-xs text-indigo-300 font-medium">AI Learning Mode Active</span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 pt-2 space-y-0.5 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
                'transition-all duration-200 group relative',
                active
                  ? 'active-nav-item text-indigo-300'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              )}
            >
              <Icon
                className={cn(
                  'shrink-0 transition-colors',
                  active ? 'text-indigo-400' : 'text-muted-foreground group-hover:text-foreground'
                )}
                size={18}
              />
              {sidebarOpen && <span className="truncate">{label}</span>}
              {!sidebarOpen && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover border border-white/10 rounded-md text-xs text-foreground whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                  {label}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* User section */}
      <div className={cn('p-3', !sidebarOpen && 'flex flex-col items-center gap-2')}>
        {sidebarOpen ? (
          <>
            <div className="flex items-center gap-3 px-1 mb-2">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user?.name ?? 'Student'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={signOut}
                className="text-muted-foreground hover:text-destructive shrink-0"
                title="Sign out"
              >
                <LogOut size={15} />
              </Button>
            </div>
            <ThemeToggle showLabel className="w-full justify-start" />
          </>
        ) : (
          <>
            <Avatar className="w-8 h-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={signOut}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut size={15} />
            </Button>
          </>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'absolute -right-3 top-20 z-10',
          'w-6 h-6 rounded-full glass border border-white/10',
          'flex items-center justify-center',
          'text-muted-foreground hover:text-foreground transition-colors',
          'shadow-lg'
        )}
      >
        {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>
    </aside>
  )
}
