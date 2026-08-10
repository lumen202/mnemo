'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  BookOpen, Target, Flame, FlipHorizontal, Sparkles, Brain,
  AlertTriangle, Trophy, TrendingUp, MessageSquare, Plus, X,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAIStore } from '@/store'

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

const QUICK_ACTIONS = [
  { icon: BookOpen,       label: 'Summarize material',  href: '/materials',  color: 'text-cyan-400',    bg: 'bg-cyan-500/15'    },
  { icon: FlipHorizontal, label: 'Generate flashcards', href: '/flashcards', color: 'text-violet-400',  bg: 'bg-violet-500/15'  },
  { icon: Target,         label: 'Create a quiz',       href: '/quizzes',    color: 'text-amber-400',   bg: 'bg-amber-500/15'   },
  { icon: Flame,          label: 'View study plan',     href: '/planner',    color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
]

const INSIGHT_ICONS = {
  warning:     { icon: AlertTriangle, color: 'text-amber-400',   bg: 'bg-amber-500/15'   },
  tip:         { icon: Sparkles,      color: 'text-indigo-400',  bg: 'bg-indigo-500/15'  },
  achievement: { icon: Trophy,        color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  prediction:  { icon: TrendingUp,    color: 'text-rose-400',    bg: 'bg-rose-500/15'    },
}

function PanelSection({
  label,
  icon: Icon,
  iconClass = 'text-indigo-400',
  defaultOpen = true,
  children,
}: {
  label: string
  icon: React.ElementType
  iconClass?: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="border-b border-white/[0.06] last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full px-4 py-3 hover:bg-white/[0.03] transition-colors"
      >
        <Icon className={cn('w-3.5 h-3.5 shrink-0', iconClass)} />
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider flex-1 text-left">
          {label}
        </span>
        <ChevronDown
          size={13}
          className={cn(
            'text-muted-foreground transition-transform duration-200 shrink-0',
            open ? 'rotate-0' : '-rotate-90'
          )}
        />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </section>
  )
}

export function TutorPanel() {
  const { sessions, activeSessionId, newSession, switchSession, deleteSession, typingSessionIds, insights } = useAIStore()
  // Most-recent first
  const sorted = [...sessions].reverse()

  return (
    <div>
      {/* Chat sessions */}
      <PanelSection label="Chat History" icon={MessageSquare}>
        {/* New chat button */}
        <button
          onClick={newSession}
          className="flex items-center gap-2 w-full rounded-xl px-3 py-2 mb-2 border border-dashed border-indigo-500/30 hover:border-indigo-500/60 hover:bg-indigo-500/5 transition-all text-indigo-400 hover:text-indigo-300"
        >
          <Plus size={13} />
          <span className="text-xs font-medium">New Chat</span>
        </button>

        {/* Session list */}
        <div className="space-y-1">
          {sorted.map((session) => {
            const active = session.id === activeSessionId
            const isGenerating = typingSessionIds.includes(session.id)
            return (
              <div
                key={session.id}
                className={cn(
                  'group flex items-center gap-2 rounded-xl px-2.5 py-2 cursor-pointer transition-all border',
                  active
                    ? 'bg-indigo-500/10 border-indigo-500/25'
                    : 'border-transparent hover:bg-white/[0.04] hover:border-white/[0.06]'
                )}
                onClick={() => switchSession(session.id)}
              >
                {session.unread && !active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" title="New reply" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={cn('text-xs font-medium truncate', active ? 'text-indigo-300' : 'text-foreground')}>
                    {session.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1" suppressHydrationWarning>
                    {isGenerating ? (
                      <span className="text-indigo-400">Generating…</span>
                    ) : (
                      <>{session.messages.length} msg{session.messages.length !== 1 ? 's' : ''} · {relativeTime(session.createdAt)}</>
                    )}
                  </p>
                </div>
                {sessions.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSession(session.id) }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </PanelSection>

      {/* Quick actions */}
      <PanelSection label="Quick Actions" icon={Target} iconClass="text-amber-400">
        <div className="space-y-1.5">
          {QUICK_ACTIONS.map(({ icon: Icon, label, href, color, bg }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-2.5 rounded-xl p-2.5 border border-white/[0.06] hover:border-white/[0.12] transition-all glass-hover"
            >
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', bg)}>
                <Icon size={13} className={color} />
              </div>
              <span className="text-xs text-muted-foreground">{label}</span>
            </Link>
          ))}
        </div>
      </PanelSection>

      {/* Active insights */}
      <PanelSection label="Insights" icon={Sparkles}>
        {insights.length === 0 ? (
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Log some study sessions and upload materials — insights show up here once there's enough activity to learn from.
          </p>
        ) : (
          <div className="space-y-2">
            {insights.slice(0, 3).map((insight) => {
              const cfg = INSIGHT_ICONS[insight.type]
              const Icon = cfg.icon
              return (
                <div key={insight.id} className={cn('rounded-xl p-3 border border-white/[0.06]', cfg.bg)}>
                  <div className="flex items-start gap-2">
                    <Icon size={12} className={cn('shrink-0 mt-0.5', cfg.color)} />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-foreground leading-tight mb-0.5">{insight.title}</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{insight.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </PanelSection>

      {/* About tutor */}
      <PanelSection label="About Your Tutor" icon={Brain} defaultOpen={false}>
        <div className="space-y-2 mb-3">
          {[
            { icon: Brain,    desc: 'Powered by OpenRouter free models' },
            { icon: Sparkles, desc: 'Adapts to your study materials'    },
            { icon: Target,   desc: 'Goal-oriented learning guidance'   },
            { icon: BookOpen, desc: 'Ask about any uploaded material'   },
            { icon: MessageSquare, desc: 'Stats & facts answered instantly — streaks, due cards, and Wikipedia lookups skip the AI entirely' },
          ].map(({ icon: Icon, desc }) => (
            <div key={desc} className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/15 flex items-center justify-center shrink-0">
                <Icon size={11} className="text-indigo-400" />
              </div>
              <p className="text-[11px] text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
        <div className="p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            <span className="text-indigo-300 font-medium">Note:</span> Always verify AI-generated content with authoritative sources.
          </p>
        </div>
      </PanelSection>
    </div>
  )
}
