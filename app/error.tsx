'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { GraduationCap, AlertTriangle, RotateCcw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// The App Router's native error boundary for the root segment — catches render
// errors that happen before or outside the dashboard, where the existing
// `ErrorBoundary` component (components/common/ErrorBoundary.tsx) doesn't reach
// (it only wraps the dashboard layout's children). Same visual language as that
// component, deliberately, so an error looks the same regardless of where it's caught.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Root error boundary caught an error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-primary-foreground" />
        </span>
        <span className="text-xl font-bold text-foreground">Mnemo</span>
      </Link>

      <Card className="max-w-sm w-full p-6 text-center">
        <div className="w-11 h-11 rounded-2xl bg-destructive/15 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={20} className="text-destructive" />
        </div>
        <h1 className="text-base font-semibold text-foreground mb-1.5">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mb-5">
          An unexpected error occurred. Try again, or head back to the dashboard.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => reset()} className="gap-2 flex-1">
            <RotateCcw size={14} /> Try again
          </Button>
          <Button asChild className="flex-1">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
