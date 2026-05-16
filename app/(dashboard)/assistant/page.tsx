import { ChatInterface } from '@/components/ai/ChatInterface'
import { GlassCard } from '@/components/common/GlassCard'
import { Sparkles, Brain, BookOpen, Target, Flame, FlipHorizontal } from 'lucide-react'
import { MOCK_INSIGHTS } from '@/data/mockData'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { AlertTriangle, Trophy, TrendingUp, Lightbulb } from 'lucide-react'

const INSIGHT_ICONS = {
  warning:     { icon: AlertTriangle, color: 'text-amber-400',   bg: 'bg-amber-500/15'  },
  tip:         { icon: Sparkles,      color: 'text-indigo-400',  bg: 'bg-indigo-500/15' },
  achievement: { icon: Trophy,        color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  prediction:  { icon: TrendingUp,    color: 'text-rose-400',    bg: 'bg-rose-500/15'   },
}

const QUICK_ACTIONS = [
  { icon: BookOpen,       label: 'Summarize material', href: '/materials',  color: 'text-cyan-400',    bg: 'bg-cyan-500/15'    },
  { icon: FlipHorizontal, label: 'Generate flashcards', href: '/flashcards', color: 'text-violet-400',  bg: 'bg-violet-500/15'  },
  { icon: Target,         label: 'Create a quiz',       href: '/quizzes',   color: 'text-amber-400',   bg: 'bg-amber-500/15'   },
  { icon: Flame,          label: 'View study plan',     href: '/planner',   color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
]

export default function AssistantPage() {
  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-full">
        {/* Chat — takes up 2/3 */}
        <GlassCard className="lg:col-span-2 flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06] shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/40 to-cyan-500/40 flex items-center justify-center border border-indigo-500/30">
              <Brain className="w-4 h-4 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Mnemo AI Tutor</h2>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
                <span className="text-xs text-muted-foreground">Online · Ready to help you learn</span>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatInterface />
          </div>
        </GlassCard>

        {/* Sidebar — insights + quick actions */}
        <div className="flex flex-col gap-4 overflow-y-auto no-scrollbar">
          {/* Quick actions */}
          <GlassCard className="p-4">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map(({ icon: Icon, label, href, color, bg }) => (
                <Link
                  key={label}
                  href={href}
                  className="rounded-xl p-3 border border-white/[0.06] hover:border-white/[0.12] transition-all glass-hover flex flex-col items-center gap-2 text-center"
                >
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', bg)}>
                    <Icon size={15} className={color} />
                  </div>
                  <span className="text-[11px] text-muted-foreground leading-tight">{label}</span>
                </Link>
              ))}
            </div>
          </GlassCard>

          {/* Active insights */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Active Insights</h3>
            </div>
            <div className="space-y-2">
              {MOCK_INSIGHTS.slice(0, 4).map((insight) => {
                const cfg = INSIGHT_ICONS[insight.type]
                const Icon = cfg.icon
                return (
                  <div
                    key={insight.id}
                    className={cn('rounded-xl p-3 border border-white/[0.06]', cfg.bg)}
                  >
                    <div className="flex items-start gap-2">
                      <Icon size={13} className={cn('shrink-0 mt-0.5', cfg.color)} />
                      <div>
                        <p className="text-xs font-semibold text-foreground leading-tight mb-0.5">
                          {insight.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </GlassCard>

          {/* About the AI */}
          <GlassCard className="p-4">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">About Your Tutor</h3>
            <div className="space-y-2.5">
              {[
                { icon: Brain,    label: 'Powered by OpenRouter',    desc: 'Uses best-in-class AI models' },
                { icon: Sparkles, label: 'Context-aware learning',   desc: 'Adapts to your study materials' },
                { icon: Target,   label: 'Goal-oriented guidance',   desc: 'Focused on your learning outcomes' },
                { icon: BookOpen, label: 'Document Q&A ready',       desc: 'Ask questions about your materials' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={11} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">{label}</p>
                    <p className="text-[11px] text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-4 bg-indigo-500/5 border border-indigo-500/20">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <span className="text-indigo-300 font-medium">Note:</span> Mnemo AI provides educational assistance and concept explanations. For academic submissions, always verify information with authoritative sources and cite accordingly.
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
