'use client'
import { Component, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { GlassCard } from '@/components/common/GlassCard'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center p-6 min-h-[60vh]">
          <GlassCard className="max-w-sm w-full p-6 text-center">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/15 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={20} className="text-rose-400" />
            </div>
            <h2 className="text-base font-semibold text-foreground mb-1.5">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-5">
              This part of Mnemo hit an unexpected error. Try reloading the page.
            </p>
            <Button onClick={() => window.location.reload()} className="gap-2 w-full">
              <RotateCcw size={14} /> Reload
            </Button>
          </GlassCard>
        </div>
      )
    }

    return this.props.children
  }
}
