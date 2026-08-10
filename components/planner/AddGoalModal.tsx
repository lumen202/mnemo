'use client'
import { useState } from 'react'
import { Target, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useStudySessionStore, useUIStore } from '@/store'
import { SUBJECT_META } from '@/data/mockData'
import type { SubjectId } from '@/types'

const SUBJECT_OPTIONS: SubjectId[] = [
  'mathematics', 'computer-science', 'physics', 'machine-learning',
  'biology', 'chemistry', 'history', 'economics', 'philosophy', 'literature', 'other',
]

const NO_SUBJECT = '__none__'

function defaultTargetDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return d.toISOString().split('T')[0]
}

export function AddGoalModal() {
  const { addGoalOpen, setAddGoalOpen, addToast } = useUIStore()
  const { addGoal } = useStudySessionStore()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subjectId, setSubjectId] = useState<string>(NO_SUBJECT)
  const [targetDate, setTargetDate] = useState(defaultTargetDate())
  const [isSaving, setIsSaving] = useState(false)

  const reset = () => {
    setTitle('')
    setDescription('')
    setSubjectId(NO_SUBJECT)
    setTargetDate(defaultTargetDate())
  }

  const handleSave = async () => {
    if (!title.trim()) return
    setIsSaving(true)
    try {
      await addGoal({
        title: title.trim(),
        description: description.trim() || undefined,
        subjectId: subjectId === NO_SUBJECT ? undefined : (subjectId as SubjectId),
        targetDate,
        completed: false,
        progress: 0,
      })
      addToast({ title: 'Goal added', description: title.trim(), variant: 'success' })
      reset()
      setAddGoalOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please try again.'
      addToast({ title: 'Could not add goal', description: message, variant: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={addGoalOpen} onOpenChange={setAddGoalOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target size={16} className="text-primary" />
            New study goal
          </DialogTitle>
          <DialogDescription>
            Track something you want to finish by a date.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Goal</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Finish the dynamic programming chapter"
              className="h-9 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && title.trim()) handleSave()
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Subject</label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SUBJECT}>No subject</SelectItem>
                  {SUBJECT_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{SUBJECT_META[s]?.label ?? s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Target date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="h-9 w-full text-sm bg-background border border-border rounded-lg px-3 text-foreground"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why this matters, or how you'll get there"
              className="h-16 text-sm resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setAddGoalOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={isSaving || !title.trim()}>
            {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Target size={13} />}
            {isSaving ? 'Saving...' : 'Add goal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
