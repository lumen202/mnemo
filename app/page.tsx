'use client'

import Link from 'next/link'
import {
  Brain, Sparkles, ArrowRight, CheckCircle2,
  FlipHorizontal, CircleHelp, CalendarDays,
  GraduationCap, Zap, FileText, MessageSquare, Menu, X,
  Boxes, Sigma, Network, Github,
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
  { value: '6', label: 'study tools, one workspace' },
  { value: '4', label: 'AI agents, one route each' },
  { value: '3-stage', label: 'automatic model failover' },
  { value: 'MIT', label: 'open source on GitHub' },
]

const BUILD_NOTES = [
  {
    icon: Boxes,
    title: 'Mock-first, zero config',
    description: 'Clone the repo and it runs with no environment variables. Every data service checks for real credentials before touching the network and falls back to in-memory data. Add Supabase and OpenRouter keys and the same UI switches to a live backend — no code branches, no separate demo mode.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/15',
    border: 'border-indigo-500/25',
  },
  {
    icon: Sigma,
    title: 'AI explains, math computes',
    description: 'Models never calculate a statistic. Study hours, streaks, scores, and progress are all derived by plain TypeScript in one analytics module. AI is used only for what a language model is actually good at: summarizing, explaining, and writing questions.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/25',
  },
  {
    icon: Network,
    title: 'One route per AI capability',
    description: 'Tutor chat, summarization, flashcard generation, and quiz generation are each their own agent module and API route — no monolithic dispatcher. Requests fail over automatically from the primary model to a free model router to Groq, so one provider outage does not take the app down.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/15',
    border: 'border-violet-500/25',
  },
]

const TECH_STACK = [
  'Next.js 15 · App Router',
  'React 19',
  'TypeScript · strict',
  'Zustand',
  'Tailwind CSS',
  'Supabase · Postgres + Auth',
  'OpenRouter + Groq',
  'Recharts',
  'Vercel',
]

const GITHUB_URL = 'https://github.com/lumen202/mnemo'
const CONTACT_EMAIL = 'remultasimpatiko@gmail.com'

const HOW_IT_WORKS = [
  { step: '01', title: 'Upload your materials', desc: 'Drag and drop PDFs, paste lecture notes, or link videos. Mnemo ingests anything and starts working immediately.' },
  { step: '02', title: 'AI processes & organizes', desc: 'Get instant summaries, auto-generated flashcards, and a suggested study plan — all from one upload.' },
  { step: '03', title: 'Study, quiz, repeat', desc: 'Ask questions, take AI quizzes, review flashcards with spaced repetition, and watch your learning score climb.' },
]

const CHECKLIST = [
  'Free and open source (MIT)',
  'One-click demo account',
  'Works with any subject',
  'Runs locally with zero config',
]

function LandingNav() {
  const [menuOpen, setMenuOpen] = React.useState(false)

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 lg:px-12 py-4 glass border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold gradient-text-study text-lg tracking-tight">Mnemo</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground flex-1 px-8">
          <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-foreground transition-colors">How it works</Link>
          <Link href="#how-its-built" className="hover:text-foreground transition-colors">How it&apos;s built</Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <Github size={14} />
            Source
          </a>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle showLabel={false} />
          <div className="hidden sm:flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="min-h-[44px]">
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild className="min-h-[44px]">
              <Link href="/auth/signup">Start free</Link>
            </Button>
          </div>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-muted-foreground hover:text-foreground transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <div className="fixed inset-0 top-16 z-40 md:hidden bg-background/95 backdrop-blur-sm">
          <div className="flex flex-col items-stretch px-4 py-6 gap-3">
            <Link
              href="#features"
              className="px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              How it works
            </Link>
            <Link
              href="#how-its-built"
              className="px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              How it&apos;s built
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              <Github size={16} />
              Source
            </a>
            <div className="border-t border-white/[0.06] mt-2 pt-4 flex flex-col gap-2">
              <Button variant="outline" asChild className="w-full min-h-[44px]">
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild className="w-full min-h-[44px]">
                <Link href="/auth/signup">Start for free</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

import React from 'react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav />


      {/* Hero */}
      <section className="hero-gradient pt-28 pb-16 sm:pt-32 sm:pb-20 px-4 sm:px-6 lg:px-12 relative overflow-hidden">
        {/* Ambient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-cyan-500/8 blur-[80px] pointer-events-none" />

        <div className="max-w-5xl mx-auto relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/25 rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm text-indigo-300 mb-6 sm:mb-8">
            <Sparkles size={14} className="text-indigo-400 shrink-0" />
            <span className="truncate">AI-powered learning for students</span>
          </div>

          <div className="text-center">
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-tight mb-4 sm:mb-6">
              Study smarter,{' '}
              <span className="gradient-text-study block sm:inline">learn faster.</span>
            </h1>

            <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-4 sm:px-0">
              Mnemo is your AI study companion that summarizes materials, generates flashcards,
              creates quizzes, and tutors you through any subject — in seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-14 px-4 sm:px-0">
              <Button size="lg" asChild className="w-full sm:w-auto min-h-[44px]">
                <Link href="/auth/signup">
                  Start studying free
                  <ArrowRight size={18} />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto min-h-[44px]">
                <Link href="/auth/login?demo=1">View demo</Link>
              </Button>
            </div>

            {/* Checklist */}
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-x-8 sm:gap-y-2 mb-12 sm:mb-16 px-4 sm:px-0">
              {CHECKLIST.map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <span className="text-center sm:text-left">{item}</span>
                </div>
              ))}
            </div>

            {/* Dashboard preview */}
            <div className="relative mx-auto max-w-4xl px-4 sm:px-0">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none rounded-2xl" />
              <div className="glass border border-white/10 rounded-2xl p-4 sm:p-6 shadow-2xl shadow-black/50">
                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                  {[
                    { label: 'Study Streak',      value: '7 days 🔥', color: 'text-amber-400',  bg: 'bg-amber-500/15'  },
                    { label: 'Hours This Month',  value: '80.5h',     color: 'text-indigo-400', bg: 'bg-indigo-500/15' },
                    { label: 'Materials',         value: '9/12',      color: 'text-cyan-400',   bg: 'bg-cyan-500/15'   },
                    { label: 'Learning Score',    value: '81/100',    color: 'text-violet-400', bg: 'bg-violet-500/15' },
                  ].map((stat) => (
                    <div key={stat.label} className={`rounded-xl p-2.5 sm:p-3 ${stat.bg} border border-white/10`}>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{stat.label}</p>
                      <p className={`text-xs sm:text-sm font-bold tabular-nums mt-0.5 ${stat.color} truncate`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
                {/* Fake activity chart */}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 sm:p-4 mb-3">
                  <p className="text-xs text-muted-foreground mb-3">Study Activity — 6 weeks</p>
                  <div className="flex items-end gap-1.5 sm:gap-2 h-16">
                    {[40, 55, 45, 70, 65, 80].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-t-sm bg-indigo-500/50" style={{ height: `${h}%` }} />
                        <div className="w-full rounded-t-sm bg-emerald-500/30" style={{ height: `${h * 0.4}%` }} />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Fake AI insight */}
                <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-3 flex items-start gap-2">
                  <Brain size={14} className="text-indigo-400 shrink-0 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">AI Insight: Machine Learning mastery within reach</p>
                    <p className="text-xs text-muted-foreground mt-0.5">You&apos;re 93% through ML materials. 3 more sessions to complete.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-12 border-y border-white/[0.05]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl sm:text-3xl font-bold gradient-text-study tabular-nums">{stat.value}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-12 mesh-gradient">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Everything you need to{' '}
              <span className="gradient-text-study block sm:inline">master any subject.</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto px-4 sm:px-0">
              Powered by AI — built for how students actually learn.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className={`glass border rounded-2xl p-6 card-shine glass-hover ${feature.border} min-h-[44px]`}
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
      <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-12 border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">From upload to insight in minutes</h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
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

      {/* How it's built */}
      <section id="how-its-built" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-12 bg-white/[0.01] border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">How it&apos;s built</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Three decisions that shaped{' '}
              <span className="gradient-text-study block sm:inline">the codebase.</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto px-4 sm:px-0">
              Mnemo is a solo-built portfolio project. The source is public — here is what is worth reading.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 mb-12">
            {BUILD_NOTES.map((note) => {
              const Icon = note.icon
              return (
                <div
                  key={note.title}
                  className={`glass border rounded-2xl p-6 card-shine glass-hover ${note.border}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${note.bg}`}>
                    <Icon className={`w-5 h-5 ${note.color}`} />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{note.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{note.description}</p>
                </div>
              )
            })}
          </div>

          {/* Tech stack */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {TECH_STACK.map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-muted-foreground"
              >
                {tech}
              </span>
            ))}
          </div>

          <div className="text-center">
            <Button variant="outline" size="lg" asChild className="min-h-[44px]">
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                <Github size={18} />
                Read the source on GitHub
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-12 border-t border-white/[0.05]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/30 animate-float">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to transform<br />how you study?
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-8 px-4 sm:px-0">
            Create an account and upload your first material, or sign in to the demo account to explore a fully populated workspace.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0">
            <Button size="lg" asChild className="w-full sm:w-auto min-h-[44px]">
              <Link href="/auth/signup">
                Get started free
                <ArrowRight size={18} />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto min-h-[44px]">
              <Link href="/auth/login?demo=1">Explore demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 px-4 sm:px-6 lg:px-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shrink-0">
              <GraduationCap className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold gradient-text-study">Mnemo</span>
          </div>
          <p className="text-xs text-muted-foreground text-center sm:text-left">© 2026 Mnemo. Portfolio prototype — AI-powered learning platform.</p>
          <div className="flex gap-4 sm:gap-6 text-xs text-muted-foreground">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
