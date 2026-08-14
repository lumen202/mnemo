'use client'

import { useRef, useState } from 'react'
import { Download, Loader2, Upload } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFlashcardStore, useUIStore } from '@/store'
import {
  exportDeck,
  parseDeck,
  downloadText,
  fileNameFor,
  mimeTypeFor,
  type TransferFormat,
} from '@/utils/deckTransfer'
import { SUBJECT_META } from '@/data/mockData'

export default function SettingsPage() {
  const { flashcards, addFlashcard } = useFlashcardStore()
  const addToast = useUIStore((s) => s.addToast)

  const [importing, setImporting] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

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
        <p className="text-sm text-muted-foreground mt-1">Your card library.</p>
      </div>

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
