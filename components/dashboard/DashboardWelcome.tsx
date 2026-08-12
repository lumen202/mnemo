'use client'
import { useRouter } from 'next/navigation'
import { Sparkles, Upload, MessageCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore, useUIStore } from '@/store'

/**
 * First thing a brand-new account sees instead of seven analytics widgets with
 * nothing in them. One clear next action beats a dashboard with no data to show.
 */
export function DashboardWelcome() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { setAddMaterialOpen } = useUIStore()

  const firstName = user?.name?.split(' ')[0]

  return (
    <Card className="max-w-2xl mx-auto text-center px-6 py-14 sm:px-10">
      <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center mx-auto mb-5">
        <Sparkles className="w-6 h-6 text-primary" />
      </div>
      <h1 className="text-xl font-semibold text-foreground mb-2">
        {firstName ? `Welcome, ${firstName}` : 'Welcome to Mnemo'}
      </h1>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed mb-8">
        Upload something you're studying and Mnemo turns it into flashcards, quizzes, and
        summaries — or just ask the AI tutor a question to get started.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button className="gap-1.5 w-full sm:w-auto" onClick={() => setAddMaterialOpen(true)}>
          <Upload size={14} />
          Upload your first material
        </Button>
        <Button
          variant="outline"
          className="gap-1.5 w-full sm:w-auto"
          onClick={() => router.push('/assistant')}
        >
          <MessageCircle size={14} />
          Ask the AI Tutor
        </Button>
      </div>
    </Card>
  )
}
