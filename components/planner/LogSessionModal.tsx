'use client'
import { useState } from 'react'
import { Clock, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useStudySessionStore, useUIStore } from '@/store'
import { SUBJECT_META } from '@/data/mockData'
import { cn } from '@/lib/utils'
import type { SubjectId } from '@/types'

const SUBJECT_OPTIONS: SubjectId[] = [
  'mathematics', 'computer-science', 'physics', 'machine-learning',
  'biology', 'chemistry', 'history', 'economics', 'philosophy', 'literature', 'other',
]

/** Preset durations — logging a session should take two clicks, not a form. */
const DURATIONS = [15, 30, 45, 60, 90, 120]

function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

export function LogSessionModal() {
  const { logSessionOpen, setLogSessionOpen, addToast } = useUIStore()
  const { addSession } = useStudySessionStore()

  const [subjectId, setSubjectId] = useState<SubjectId>('computer-science')
  const [durationMinutes, setDurationMinutes] = useState(45)
  const [date, setDate] = useState(todayString())
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const reset = () => {
    setSubjectId('computer-science')
    setDurationMinutes(45)
    setDate(todayString())
    setNotes('')
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await addSession({
        subjectId,
        date,
        durationMinutes,
        notes: notes.trim() || undefined,
      })
      addToast({
        title: 'Session logged',
        description: `${(durationMinutes / 60).toFixed(1)}h of ${SUBJECT_META[subjectId]?.label ?? subjectId}.`,
        variant: 'success',
      })
      reset()
      setLogSessionOpen(false)
    } catch (err) {
      // Supabase rejects with a plain object, not an Error — guard the access.
      const message = err instanceof Error ? err.message : 'Please try again.'
      addToast({ title: 'Could not log session', description: message, variant: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={logSessionOpen} onOpenChange={setLogSessionOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock size={16} className="text-indigo-400" />
            Log a study session
          </DialogTitle>
          <DialogDescription>
            Sessions drive your streak, weekly trend, and subject hours.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground">Subject</label>
            <Select value={subjectId} onValueChange={(v) => setSubjectId(v as SubjectId)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBJECT_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{SUBJECT_META[s]?.label ?? s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground">How long?</label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDurationMinutes(m)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-lg border transition-all tabular-nums',
                    durationMinutes === m
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                      : 'border-white/[0.07] text-muted-foreground hover:border-white/20'
                  )}
                >
                  {m < 60 ? `${m}m` : `${m / 60}h`}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground">Date</label>
            <input
              type="date"
              value={date}
              max={todayString()}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 w-full text-sm bg-background border border-border rounded-lg px-3 text-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground">Notes (optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you cover?"
              className="h-16 text-sm resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setLogSessionOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Clock size={13} />}
            {isSaving ? 'Saving...' : 'Log session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
