'use client'
import { useState, useEffect } from 'react'
import {
  Brain, PanelRightOpen, PanelRightClose, ChevronRight, ChevronLeft,
  MessageSquare, Target, Sparkles, X,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ChatInterface } from '@/components/ai/ChatInterface'
import { TutorPanel } from '@/components/ai/TutorPanel'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useUIStore } from '@/store'
import { cn } from '@/lib/utils'

const STRIP_ICONS = [
  { icon: MessageSquare, label: 'Chat History'  },
  { icon: Target,        label: 'Quick Actions' },
  { icon: Sparkles,      label: 'Insights'      },
  { icon: Brain,         label: 'About Tutor'   },
]

export function AssistantLayout() {
  const { isMobile } = useUIStore()
  const [panelCollapsed, setPanelCollapsed] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    if (isMobile) setPanelCollapsed(false)
  }, [isMobile])

  const handleHeaderToggle = () => {
    if (isMobile) setSheetOpen((o) => !o)
    else setPanelCollapsed((c) => !c)
  }

  const headerPanelOpen = isMobile ? sheetOpen : !panelCollapsed

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* Chat */}
      <Card className="flex-1 flex flex-col overflow-hidden min-w-0 p-0">
        <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-border shrink-0">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center border border-border shrink-0">
            <Brain className="w-4 h-4 text-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-foreground">Mnemo AI Tutor</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
              <span className="text-xs text-muted-foreground">Online · Ready to help you learn</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleHeaderToggle}
            className="text-muted-foreground hover:text-foreground shrink-0"
            title={headerPanelOpen ? 'Collapse tutor panel' : 'Open tutor panel'}
          >
            {headerPanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatInterface />
        </div>
      </Card>

      {/* Desktop panel — animates between w-72 (expanded) and w-12 (collapsed strip) */}
      <Card
        className={cn(
          'hidden lg:flex flex-col overflow-hidden shrink-0 p-0',
          'transition-all duration-300 ease-in-out',
          panelCollapsed ? 'w-12' : 'w-72'
        )}
      >
        {panelCollapsed ? (
          /* Collapsed: icon strip */
          <div className="flex flex-col items-center py-3 gap-1">
            <button
              onClick={() => setPanelCollapsed(false)}
              title="Expand panel"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            <Separator className="my-1 w-6" />
            {STRIP_ICONS.map(({ icon: Icon, label }) => (
              <button
                key={label}
                onClick={() => setPanelCollapsed(false)}
                title={label}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
        ) : (
          /* Expanded: full panel */
          <>
            <div className="px-4 py-3 border-b border-border shrink-0 flex items-center gap-2">
              <Brain className="w-3.5 h-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex-1">Tutor Panel</h3>
              <button
                onClick={() => setPanelCollapsed(true)}
                title="Collapse panel"
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-accent"
              >
                <ChevronRight size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <TutorPanel />
            </div>
          </>
        )}
      </Card>

      {/* Mobile bottom sheet */}
      {isMobile && sheetOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSheetOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[72vh] lg:hidden flex flex-col bg-card border border-border border-t shadow-sm rounded-t-2xl overflow-hidden">
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-muted" />
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border shrink-0">
              <Brain className="w-3.5 h-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex-1">Tutor Panel</h3>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setSheetOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <TutorPanel />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
