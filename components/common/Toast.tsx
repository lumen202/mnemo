'use client'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useUIStore } from '@/store'
import { cn } from '@/lib/utils'
import type { ToastMessage } from '@/types'

const ICONS = {
  default: Info,
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
}

const STYLES = {
  default: 'border-white/[0.08] text-foreground',
  success: 'border-emerald-500/25 text-emerald-300',
  error: 'border-rose-500/25 text-rose-300',
  warning: 'border-amber-500/25 text-amber-300',
}

function Toast({ toast }: { toast: ToastMessage }) {
  const removeToast = useUIStore((s) => s.removeToast)
  const Icon = ICONS[toast.variant]

  return (
    <div
      className={cn(
        'glass rounded-xl border px-4 py-3 shadow-lg shadow-black/20 flex items-start gap-3 w-full sm:w-80 animate-in slide-in-from-bottom-2 fade-in duration-200',
        STYLES[toast.variant]
      )}
    >
      <Icon size={16} className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto w-full sm:w-auto">
          <Toast toast={t} />
        </div>
      ))}
    </div>
  )
}
