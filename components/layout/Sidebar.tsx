'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, Layers, Brain, LogOut,
  GraduationCap, ChevronLeft, ChevronRight, Sparkles,
  FlipHorizontal, CircleHelp, CalendarDays, X, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore, useAuthStore } from '@/store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
  DialogClose,
  DialogPortal,
} from '@/components/ui/dialog'

// Grouped instead of one flat list: Dashboard + AI Tutor are the two obvious top-level
// destinations, everything else a student does day-to-day lives under "Study." Settings
// is deliberately not here — it lives next to sign-out in the user section below, where
// account-level actions conventionally live.
const NAV_GROUPS = [
  {
    label: null,
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/assistant', label: 'AI Tutor',  icon: Brain           },
    ],
  },
  {
    label: 'Study',
    items: [
      { href: '/materials',  label: 'Study Materials', icon: BookOpen       },
      { href: '/flashcards', label: 'Flashcards',      icon: FlipHorizontal },
      { href: '/quizzes',    label: 'Quizzes',         icon: CircleHelp     },
      { href: '/planner',    label: 'Planner',         icon: CalendarDays   },
      { href: '/subjects',   label: 'Subjects',        icon: Layers         },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarOpen, toggleSidebar, setSidebarOpen, isMobile } = useUIStore()
  const { user, signOut, isSigningOut } = useAuthStore()
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false)

  const handleSignOut = () => {
    setSignOutDialogOpen(true)
  }

  const confirmSignOut = async () => {
    await signOut()
    setSignOutDialogOpen(false)
    router.push('/auth/login')
  }

  const handleNavClick = () => {
    // Close drawer on nav item click on mobile
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  // Mobile drawer mode
  if (isMobile) {
    return (
      <>
      <Dialog open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <DialogPortal>
          <DialogOverlay className="z-40" />
          <div className="fixed inset-0 z-40 pointer-events-none" />
          <div
            className={cn(
              'fixed left-0 top-0 h-[100dvh] w-60 z-50',
              'bg-card border-r border-border',
              'data-[state=open]:slide-in-from-left-0 data-[state=closed]:slide-out-to-left-0',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:duration-200 data-[state=open]:duration-300',
              'overflow-hidden'
            )}
            data-state={sidebarOpen ? 'open' : 'closed'}
          >
            <div className="flex flex-col h-[100dvh]">
              {/* Header with close button */}
              <div className="flex items-center justify-between px-4 py-5">
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background animate-pulse-slow" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-base font-bold text-foreground tracking-tight block">Mnemo</span>
                    <span className="text-xs text-muted-foreground block -mt-0.5">AI Study Companion</span>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  <X size={18} />
                </button>
              </div>

              <Separator />

              {/* AI Badge */}
              <div className="mx-3 my-3 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs text-primary font-medium">AI Learning Mode Active</span>
              </div>

              {/* Nav */}
              <nav className="flex-1 px-2 pt-2 space-y-3 overflow-y-auto no-scrollbar">
                {NAV_GROUPS.map((group, i) => (
                  <div key={group.label ?? `group-${i}`} className="space-y-0.5">
                    {group.label && (
                      <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                        {group.label}
                      </p>
                    )}
                    {group.items.map(({ href, label, icon: Icon }) => {
                      const active = pathname === href || pathname.startsWith(href + '/')
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={handleNavClick}
                          className={cn(
                            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
                            'transition-all duration-200 group relative min-h-[44px]',
                            active
                              ? 'active-nav-item text-primary'
                              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                          )}
                        >
                          <Icon
                            className={cn(
                              'shrink-0 transition-colors',
                              active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                            )}
                            size={18}
                          />
                          <span className="truncate">{label}</span>
                        </Link>
                      )
                    })}
                  </div>
                ))}
              </nav>

              <Separator />

              {/* User section */}
              <div className="p-3">
                <div className="flex items-center gap-3 px-1 mb-2">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user?.name ?? 'Student'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <Link
                    href="/settings"
                    onClick={handleNavClick}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1.5 shrink-0"
                    title="Settings"
                  >
                    <Settings size={15} />
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleSignOut}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    title="Sign out"
                    disabled={isSigningOut}
                  >
                    {isSigningOut ? (
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
                    ) : (
                      <LogOut size={15} />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogPortal>
      </Dialog>

      {/* Sign Out Confirmation Dialog — mobile */}
      <Dialog open={signOutDialogOpen} onOpenChange={setSignOutDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign out of Mnemo?</DialogTitle>
            <DialogDescription>
              Your study data is saved and will be here when you return.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSignOutDialogOpen(false)}
              disabled={isSigningOut}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmSignOut}
              disabled={isSigningOut}
              className="gap-2"
            >
              {isSigningOut ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-destructive-foreground/30 border-t-destructive-foreground animate-spin" />
                  Signing out...
                </>
              ) : (
                'Sign out'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
    )
  }

  // Desktop sidebar mode
  return (
    <aside
      className={cn(
        'relative flex flex-col h-[100dvh] border-r border-border bg-card',
        'transition-all duration-300 ease-in-out hidden lg:flex',
        sidebarOpen ? 'w-60' : 'w-[72px]'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5', !sidebarOpen && 'justify-center')}>
        <div className="relative shrink-0">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background animate-pulse-slow" />
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <span className="text-base font-bold text-foreground tracking-tight block">Mnemo</span>
            <span className="text-xs text-muted-foreground block -mt-0.5">AI Study Companion</span>
          </div>
        )}
      </div>

      <Separator />

      {/* AI Badge */}
      {sidebarOpen && (
        <div className="mx-3 my-3 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-xs text-primary font-medium">AI Learning Mode Active</span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 pt-2 space-y-3 overflow-y-auto no-scrollbar">
        {NAV_GROUPS.map((group, i) => (
          <div key={group.label ?? `group-${i}`} className="space-y-0.5">
            {group.label && sidebarOpen && (
              <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </p>
            )}
            {group.label && !sidebarOpen && <Separator className="my-2" />}
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
                    'transition-all duration-200 group relative min-h-[44px]',
                    active
                      ? 'active-nav-item text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <Icon
                    className={cn(
                      'shrink-0 transition-colors',
                      active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    )}
                    size={18}
                  />
                  {sidebarOpen && <span className="truncate">{label}</span>}
                  {!sidebarOpen && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-popover border border-border rounded-md text-xs text-foreground whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                      {label}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
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
              <Link
                href="/settings"
                className={cn(
                  'p-1.5 rounded-lg transition-colors shrink-0',
                  pathname === '/settings'
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Settings"
              >
                <Settings size={15} />
              </Link>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-destructive shrink-0"
                title="Sign out"
                disabled={isSigningOut}
              >
                {isSigningOut ? (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
                ) : (
                  <LogOut size={15} />
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            <Avatar className="w-8 h-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <Link
              href="/settings"
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                pathname === '/settings'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Settings"
            >
              <Settings size={15} />
            </Link>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-destructive"
              disabled={isSigningOut}
            >
              {isSigningOut ? (
                <span className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
              ) : (
                <LogOut size={15} />
              )}
            </Button>
          </>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'absolute -right-3 top-20 z-10',
          'w-6 h-6 rounded-full bg-card border border-border',
          'flex items-center justify-center',
          'text-muted-foreground hover:text-foreground transition-colors',
          'shadow-sm'
        )}
      >
        {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>

      {/* Sign Out Confirmation Dialog */}
      <Dialog open={signOutDialogOpen} onOpenChange={setSignOutDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign out of Mnemo?</DialogTitle>
            <DialogDescription>
              Your study data is saved and will be here when you return.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSignOutDialogOpen(false)}
              disabled={isSigningOut}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmSignOut}
              disabled={isSigningOut}
              className="gap-2"
            >
              {isSigningOut ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-destructive-foreground/30 border-t-destructive-foreground animate-spin" />
                  Signing out...
                </>
              ) : (
                'Sign out'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
