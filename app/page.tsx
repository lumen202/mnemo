import Link from 'next/link'
import {
  Brain, Sparkles, Shield, ArrowRight, CheckCircle2,
  BookOpen, FlipHorizontal, CircleHelp, CalendarDays,
  GraduationCap, Zap, FileText, MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const FEATURES = [
  {
    icon: Brain,
    title: 'AI Study Tutor',
    description: 'Get instant explanations, concept breakdowns, and answers to your questions. Mnemo adapts to your learning level and explains things the way you need to hear them.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/15',
    border: 'border-indigo-500/25',
  },
  {
    icon: FileText,
    title: 'Document Summarization',
    description: 'Upload PDFs, lecture notes, or textbook chapters. AI instantly extracts key takeaways, topic highlights, and concise summaries — turning hours of reading into minutes.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/25',
  },
  {
    icon: FlipHorizontal,
    title: 'Smart Flashcards',
    description: 'AI generates targeted flashcards from your materials using proven spaced repetition principles. Study smarter, not harder — and retain what you learn for the long term.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/15',
    border: 'border-violet-500/25',
  },
  {
    icon: CircleHelp,
    title: 'Quiz Generator',
    description: 'Test your knowledge with AI-generated multiple-choice and short-answer quizzes. Get instant explanations for every answer — right or wrong.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/25',
  },
  {
    icon: CalendarDays,
    title: 'Study Planner',
    description: 'Set study goals, track sessions, and visualize your consistency with a built-in activity heatmap. AI spots patterns and suggests when and what to study next.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/25',
  },
  {
    icon: MessageSquare,
    title: 'Document Q&A',
    description: 'Upload any study material and ask questions about it in plain English. Get contextual, source-aware answers — like having a TA available 24/7.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/25',
  },
]

const STATS = [
  { value: '10×', label: 'faster document review' },
  { value: '< 30s', label: 'to generate flashcards' },
  { value: '6+', label: 'AI-powered study tools' },
  { value: '100%', label: 'private & encrypted' },
]

const TESTIMONIALS = [
  {
    quote: 'Mnemo summarized my 80-page lecture notes in 30 seconds. I used to spend 2 hours on that. It\'s genuinely changed how I prepare for exams.',
    name: 'Sophia L.',
    role: 'Medical Student',
    initials: 'SL',
  },
  {
    quote: 'The AI-generated flashcards are incredibly good. They ask exactly the right questions. My quiz scores went from C+ to A- in two weeks.',
    name: 'Marcus W.',
    role: 'CS Undergraduate',
    initials: 'MW',
  },
  {
    quote: 'I upload my research papers and just ask questions. It\'s like having an expert reader in the room who can explain any passage instantly.',
    name: 'Priya N.',
    role: 'PhD Researcher',
    initials: 'PN',
  },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Upload your materials', desc: 'Drag and drop PDFs, paste lecture notes, or link videos. Mnemo ingests anything and starts working immediately.' },
  { step: '02', title: 'AI processes & organizes', desc: 'Get instant summaries, auto-generated flashcards, and a suggested study plan — all from one upload.' },
  { step: '03', title: 'Study, quiz, repeat', desc: 'Ask questions, take AI quizzes, review flashcards with spaced repetition, and watch your learning score climb.' },
]

const CHECKLIST = [
  'No credit card required',
  'AI insights in under 60 seconds',
  'Works with any subject',
  'Free plan — always',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 py-4 glass border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold gradient-text-study text-lg tracking-tight">Mnemo</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-foreground transition-colors">How it works</Link>
          <Link href="#testimonials" className="hover:text-foreground transition-colors">Stories</Link>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle showLabel />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth/login">Sign In</Link>
          </Button>
          <Button size="sm" asChild className="hidden sm:flex">
            <Link href="/auth/signup">Start for free</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-gradient pt-32 pb-20 px-6 lg:px-12 relative overflow-hidden">
        {/* Ambient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-cyan-500/8 blur-[80px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/25 rounded-full px-4 py-1.5 text-sm text-indigo-300 mb-8">
            <Sparkles size={14} className="text-indigo-400" />
            <span>AI-powered learning for the modern student</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6">
            Study smarter,{' '}
            <span className="gradient-text-study">learn faster.</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Mnemo is your AI study companion that summarizes materials, generates flashcards,
            creates quizzes, and tutors you through any subject — in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Button size="xl" asChild className="w-full sm:w-auto">
              <Link href="/auth/signup">
                Start studying free
                <ArrowRight size={18} />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/dashboard">View demo</Link>
            </Button>
          </div>

          {/* Checklist */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mb-16">
            {CHECKLIST.map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Dashboard preview */}
          <div className="relative mx-auto max-w-4xl">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none rounded-2xl" />
            <div className="glass border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/50">
              {/* Stats row */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Study Streak',      value: '7 days 🔥', color: 'text-amber-400',  bg: 'bg-amber-500/15'  },
                  { label: 'Hours This Month',  value: '80.5h',     color: 'text-indigo-400', bg: 'bg-indigo-500/15' },
                  { label: 'Materials',         value: '9/12',      color: 'text-cyan-400',   bg: 'bg-cyan-500/15'   },
                  { label: 'Learning Score',    value: '81/100',    color: 'text-violet-400', bg: 'bg-violet-500/15' },
                ].map((stat) => (
                  <div key={stat.label} className={`rounded-xl p-3 ${stat.bg} border border-white/10`}>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className={`text-sm font-bold tabular-nums mt-0.5 ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
              {/* Fake activity chart */}
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 mb-3">
                <p className="text-xs text-muted-foreground mb-3">Study Activity — 6 weeks</p>
                <div className="flex items-end gap-2 h-16">
                  {[40, 55, 45, 70, 65, 80].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t-sm bg-indigo-500/50" style={{ height: `${h}%` }} />
                      <div className="w-full rounded-t-sm bg-emerald-500/30" style={{ height: `${h * 0.4}%` }} />
                    </div>
                  ))}
                </div>
              </div>
              {/* Fake AI insight */}
              <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-3 flex items-start gap-2.5">
                <Brain size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-foreground">AI Insight: Machine Learning mastery within reach</p>
                  <p className="text-xs text-muted-foreground mt-0.5">You&apos;re 93% through ML materials. 3 more sessions to complete the module.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 lg:px-12 border-y border-white/[0.05]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold gradient-text-study tabular-nums">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 lg:px-12 mesh-gradient">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Everything you need to{' '}
              <span className="gradient-text-study">master any subject.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Powered by AI — built for how students actually learn.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className={`glass border rounded-2xl p-6 card-shine glass-hover ${feature.border}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${feature.bg}`}>
                    <Icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 lg:px-12 border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-4xl font-bold text-foreground">From upload to insight in minutes</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="relative">
                <p className="text-5xl font-bold text-white/5 mb-3 tabular-nums">{item.step}</p>
                <h3 className="text-base font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6 lg:px-12 bg-white/[0.01] border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">Stories</p>
            <h2 className="text-4xl font-bold text-foreground">Students who study smarter</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="glass border border-white/[0.07] rounded-2xl p-6 glass-hover">
                <p className="text-sm text-foreground/80 leading-relaxed mb-5 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/40 to-cyan-500/40 flex items-center justify-center text-sm font-bold text-foreground">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 lg:px-12 border-t border-white/[0.05]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/30 animate-float">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Ready to transform<br />how you study?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join students who use AI to learn faster, retain more, and stress less — starting with their very first upload.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="xl" asChild>
              <Link href="/auth/signup">
                Get started free
                <ArrowRight size={18} />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="/dashboard">Explore demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
              <GraduationCap className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold gradient-text-study">Mnemo</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Mnemo. Portfolio prototype — AI-powered learning platform.</p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
