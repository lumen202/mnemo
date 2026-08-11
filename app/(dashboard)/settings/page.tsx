'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, Download, Upload, Clock, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useAuthStore, useFlashcardStore, useUIStore } from '@/store'
import { isSupabaseConfigured } from '@/lib/env'
import {
  getNotificationPrefs,
  saveNotificationPrefs,
  detectTimezone,
  DEFAULT_PREFS,
  type NotificationPrefs,
} from '@/services/supabase/notifications'
import {
  exportDeck,
  parseDeck,
  downloadText,
  fileNameFor,
  mimeTypeFor,
  type TransferFormat,
} from '@/utils/deckTransfer'
import { SUBJECT_META } from '@/data/mockData'

const SEND_HOURS = Array.from({ length: 24 }, (_, hour) => hour)

function formatHour(hour: number): string {
  const suffix = hour < 12 ? 'am' : 'pm'
  const twelve = hour % 12 === 0 ? 12 : hour % 12
  return `${twelve}:00 ${suffix}`
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const { flashcards, addFlashcard } = useFlashcardStore()
  const addToast = useUIStore((s) => s.addToast)

  const [prefs, setPrefs] = useState<NotificationPrefs>({ ...DEFAULT_PREFS, timezone: 'UTC' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!user?.id || !isSupabaseConfigured()) {
        setPrefs({ ...DEFAULT_PREFS, timezone: detectTimezone() })
        setLoading(false)
        return
      }
      const loaded = await getNotificationPrefs(user.id)
      if (!cancelled) {
        setPrefs(loaded)
        setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  async function persist(next: NotificationPrefs) {
    setPrefs(next)
    if (!user?.id || !isSupabaseConfigured()) return
    setSaving(true)
    try {
      // The zone is written alongside the toggle: a reminder scheduled for "8am" is meaningless
      // without knowing whose 8am, and asking the student to pick one is worse than reading it.
      await saveNotificationPrefs(user.id, { ...next, timezone: next.timezone || detectTimezone() })
    } catch {
      addToast({ title: 'Could not save', description: 'Your reminder settings were not saved.', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  function handleExport(format: TransferFormat) {
    if (flashcards.length === 0) {
      addToast({ title: 'Nothing to export', description: 'Create some flashcards first.', variant: 'warning' })
      return
    }
    downloadText(exportDeck(flashcards, format), fileNameFor(format), mimeTypeFor(format))
    addToast({
      title: 'Deck exported',
      description: `${flashcards.length} cards as ${format.toUpperCase()}.`,
      variant: 'success',
    })
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const text = await file.text()
      const validSubjects = Object.keys(SUBJECT_META)
      const { cards, skipped, detectedFormat } = parseDeck(text, validSubjects)

      if (cards.length === 0) {
        addToast({
          title: 'No cards found',
          description: `Read the file as ${detectedFormat.toUpperCase()} but found no front/back pairs.`,
          variant: 'error',
        })
        return
      }

      for (const card of cards) {
        await addFlashcard(card)
      }

      addToast({
        title: `Imported ${cards.length} card${cards.length === 1 ? '' : 's'}`,
        description: skipped.length
          ? `${skipped.length} row${skipped.length === 1 ? '' : 's'} skipped — first was line ${skipped[0].line}: ${skipped[0].reason}.`
          : `Read as ${detectedFormat.toUpperCase()}.`,
        variant: skipped.length ? 'warning' : 'success',
      })
    } catch {
      addToast({ title: 'Import failed', description: 'That file could not be read.', variant: 'error' })
    } finally {
      setImporting(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Reminders and your card library.</p>
      </div>

      {/* ── Reminders ────────────────────────────────────────────────────── */}
      <Card className="p-5 space-y-5">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-primary mt-0.5" aria-hidden />
          <div className="flex-1">
            <h2 className="font-semibold">Review reminders</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              An email when cards are due. Spacing only works if you come back on the day the
              schedule picked.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Loading your preferences…
          </div>
        ) : (
          <>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.emailEnabled}
                onChange={(e) => persist({ ...prefs, emailEnabled: e.target.checked })}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-sm font-medium">Email me when cards are due</span>
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" aria-hidden />}
            </label>

            {prefs.emailEnabled && (
              <div className="pl-7 space-y-3 border-l border-border ml-2">
                <div className="space-y-1.5">
                  <Label htmlFor="send-hour" className="flex items-center gap-1.5 text-xs">
                    <Clock className="w-3.5 h-3.5" aria-hidden /> Send at
                  </Label>
                  <select
                    id="send-hour"
                    value={prefs.sendHour}
                    onChange={(e) => persist({ ...prefs, sendHour: Number(e.target.value) })}
                    className="w-40 rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    {SEND_HOURS.map((hour) => (
                      <option key={hour} value={hour}>
                        {formatHour(hour)}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    In your timezone — {prefs.timezone || detectTimezone()}.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* ── Deck portability ─────────────────────────────────────────────── */}
      <Card className="p-5 space-y-5">
        <div className="flex items-start gap-3">
          <Download className="w-5 h-5 text-primary mt-0.5" aria-hidden />
          <div className="flex-1">
            <h2 className="font-semibold">Your cards</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {flashcards.length} card{flashcards.length === 1 ? '' : 's'}. They&rsquo;re yours —
              take them anywhere.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Export</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
              JSON — full backup
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('tsv')}>
              TSV — for Anki
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              CSV — for spreadsheets
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            JSON keeps your review history and intervals. TSV and CSV keep only the card text,
            because that is all another app can read.
          </p>
        </div>

        <div className="space-y-2 pt-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Import</p>
          <input
            ref={fileInput}
            type="file"
            accept=".json,.tsv,.csv,.txt,text/plain"
            onChange={handleImport}
            className="hidden"
            id="deck-import"
          />
          <Button variant="outline" size="sm" disabled={importing} onClick={() => fileInput.current?.click()}>
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" aria-hidden /> Importing…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-1.5" aria-hidden /> Choose a file
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Mnemo JSON, or plain text from Anki (File → Export → Notes in Plain Text). Imported
            cards start unscheduled unless the file carries Mnemo&rsquo;s own review history.
          </p>
        </div>
      </Card>
    </div>
  )
}
