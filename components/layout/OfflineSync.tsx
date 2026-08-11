'use client'

import { useEffect, useRef, useState } from 'react'
import { CloudOff, RefreshCw } from 'lucide-react'
import { useFlashcardStore, useUIStore } from '@/store'
import { pendingCount } from '@/utils/offlineOutbox'

/**
 * Registers the service worker and drains the offline review queue.
 *
 * Mounted once in the dashboard layout. Two jobs that belong together because they are the two
 * halves of "your review survived": the worker keeps the page reachable, the outbox keeps the
 * grade. Neither is worth much alone.
 *
 * The indicator is deliberately only rendered when there is something queued. A permanent
 * connection badge trains people to ignore it, which defeats the one moment it matters.
 */
export function OfflineSync() {
  const syncPendingReviews = useFlashcardStore((s) => s.syncPendingReviews)
  const addToast = useUIStore((s) => s.addToast)
  const [queued, setQueued] = useState(0)
  const syncing = useRef(false)

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') return
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registration failing degrades to a normal web app; it must never surface as an error.
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    const refreshCount = async () => {
      const count = await pendingCount()
      if (!cancelled) setQueued(count)
    }

    const flush = async () => {
      if (syncing.current) return
      syncing.current = true
      try {
        const { flushed } = await syncPendingReviews()
        if (flushed > 0 && !cancelled) {
          addToast({
            title: 'Reviews synced',
            description: `${flushed} card${flushed === 1 ? '' : 's'} you reviewed offline are saved.`,
            variant: 'success',
          })
        }
      } finally {
        syncing.current = false
        await refreshCount()
      }
    }

    void refreshCount()
    void flush()

    window.addEventListener('online', flush)
    return () => {
      cancelled = true
      window.removeEventListener('online', flush)
    }
  }, [syncPendingReviews, addToast])

  if (queued === 0) return null

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-xs text-muted-foreground shadow-lg"
    >
      {syncing.current ? (
        <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden />
      ) : (
        <CloudOff className="w-3.5 h-3.5" aria-hidden />
      )}
      {queued} review{queued === 1 ? '' : 's'} waiting to sync
    </div>
  )
}
