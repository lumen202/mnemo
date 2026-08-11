import type { Flashcard, FlashcardDifficulty, SubjectId } from '@/types'

/**
 * Getting cards in and out.
 *
 * Deliberately text formats, not Anki's `.apkg`: that is a zip containing a SQLite database, so
 * supporting it means shipping a SQLite reader to the browser to serve a minority of imports.
 * Anki reads and writes tab-separated text natively (File → Export → Notes in Plain Text), which
 * covers the same migration path with no dependency and no binary parsing.
 *
 * Export exists for a blunter reason than interoperability: a student who cannot get their cards
 * out is renting them. Deck portability is what makes the app safe to commit to.
 */

export type TransferFormat = 'json' | 'tsv' | 'csv'

const DIFFICULTIES: FlashcardDifficulty[] = ['easy', 'medium', 'hard']

export interface ExportedDeck {
  format: 'mnemo-deck'
  version: 1
  exportedAt: string
  count: number
  cards: ExportedCard[]
}

export interface ExportedCard {
  front: string
  back: string
  subjectId: string
  difficulty: FlashcardDifficulty
  timesReviewed: number
  repetitions: number
  lapses: number
  ease?: number
  lastReviewed?: string
  nextReview?: string
}

function toExported(card: Flashcard): ExportedCard {
  return {
    front: card.front,
    back: card.back,
    subjectId: card.subjectId,
    difficulty: card.difficulty,
    timesReviewed: card.timesReviewed,
    repetitions: card.repetitions ?? 0,
    lapses: card.lapses ?? 0,
    ease: card.ease,
    lastReviewed: card.lastReviewed,
    nextReview: card.nextReview,
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * JSON keeps the full scheduling state, so a round trip through export/import preserves a
 * student's progress. The delimited formats keep only front/back/tags, because that is all
 * another app can read — a lossy export that pretends otherwise is worse than an honest one.
 */
export function exportDeck(cards: Flashcard[], format: TransferFormat): string {
  if (format === 'json') {
    const deck: ExportedDeck = {
      format: 'mnemo-deck',
      version: 1,
      exportedAt: new Date().toISOString(),
      count: cards.length,
      cards: cards.map(toExported),
    }
    return JSON.stringify(deck, null, 2)
  }

  const delimiter = format === 'tsv' ? '\t' : ','
  const escape = (value: string) => {
    const cleaned = value.replace(/\r?\n/g, '<br>')
    if (format === 'tsv') return cleaned.replace(/\t/g, ' ')
    return /[",]/.test(cleaned) ? `"${cleaned.replace(/"/g, '""')}"` : cleaned
  }

  const rows = cards.map((c) => [escape(c.front), escape(c.back), escape(c.subjectId)].join(delimiter))

  // Anki ignores a leading '#' line, so the header is safe to include for both audiences.
  return [`#front${delimiter}back${delimiter}tags`, ...rows].join('\n')
}

export function fileNameFor(format: TransferFormat, now = new Date()): string {
  const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return `mnemo-deck-${day}.${format}`
}

export function mimeTypeFor(format: TransferFormat): string {
  if (format === 'json') return 'application/json'
  if (format === 'tsv') return 'text/tab-separated-values'
  return 'text/csv'
}

// ─── Import ───────────────────────────────────────────────────────────────────

export type ImportableCard = Omit<Flashcard, 'id' | 'userId'>

export interface ImportResult {
  cards: ImportableCard[]
  /** Rows that could not be read, with the reason and the row number a human can find. */
  skipped: { line: number; reason: string }[]
  detectedFormat: TransferFormat
}

function coerceDifficulty(value: unknown): FlashcardDifficulty {
  return DIFFICULTIES.includes(value as FlashcardDifficulty) ? (value as FlashcardDifficulty) : 'medium'
}

/**
 * Split one delimited line, honouring quoted fields for CSV.
 */
function splitLine(line: string, delimiter: string): string[] {
  if (delimiter === '\t') return line.split('\t')

  const out: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { field += '"'; i++ }
      else if (ch === '"') inQuotes = false
      else field += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ',') { out.push(field); field = '' }
    else field += ch
  }
  out.push(field)
  return out
}

/**
 * Read a deck from JSON, TSV or CSV, detecting which by content rather than by file extension —
 * a file renamed by a student is still importable, and Anki's export extension varies.
 *
 * Imported cards always start unscheduled unless the file carries Mnemo's own scheduling state.
 * Inventing a schedule for foreign cards would put them in a due queue they never earned.
 */
export function parseDeck(raw: string, validSubjects: readonly string[], fallbackSubject: SubjectId = 'other'): ImportResult {
  const text = raw.trim()
  const skipped: ImportResult['skipped'] = []

  const subjectOrFallback = (value: unknown): SubjectId =>
    validSubjects.includes(String(value)) ? (value as SubjectId) : fallbackSubject

  if (text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text) as Partial<ExportedDeck>
      const rows = Array.isArray(parsed.cards) ? parsed.cards : []
      const cards: ImportableCard[] = []

      rows.forEach((row, index) => {
        if (!row?.front?.trim() || !row?.back?.trim()) {
          skipped.push({ line: index + 1, reason: 'missing front or back' })
          return
        }
        cards.push({
          front: row.front.trim(),
          back: row.back.trim(),
          subjectId: subjectOrFallback(row.subjectId),
          difficulty: coerceDifficulty(row.difficulty),
          timesReviewed: Number(row.timesReviewed) || 0,
          repetitions: Number(row.repetitions) || 0,
          lapses: Number(row.lapses) || 0,
          ease: typeof row.ease === 'number' ? row.ease : undefined,
          lastReviewed: row.lastReviewed,
          nextReview: row.nextReview,
        })
      })

      return { cards, skipped, detectedFormat: 'json' }
    } catch {
      return { cards: [], skipped: [{ line: 1, reason: 'file is not valid JSON' }], detectedFormat: 'json' }
    }
  }

  const lines = text.split(/\r?\n/)
  const sample = lines.find((l) => l.trim() && !l.startsWith('#')) ?? ''
  const delimiter = sample.includes('\t') ? '\t' : ','
  const detectedFormat: TransferFormat = delimiter === '\t' ? 'tsv' : 'csv'

  const cards: ImportableCard[] = []

  lines.forEach((line, index) => {
    const lineNumber = index + 1
    if (!line.trim()) return
    if (line.startsWith('#')) return // Anki metadata / our header

    const fields = splitLine(line, delimiter)
    const front = (fields[0] ?? '').trim()
    const back = (fields[1] ?? '').trim()

    if (!front || !back) {
      skipped.push({ line: lineNumber, reason: 'row has no front/back pair' })
      return
    }

    cards.push({
      front: front.replace(/<br\s*\/?>/gi, '\n'),
      back: back.replace(/<br\s*\/?>/gi, '\n'),
      subjectId: subjectOrFallback(fields[2]?.trim()),
      difficulty: 'medium',
      timesReviewed: 0,
      repetitions: 0,
      lapses: 0,
    })
  })

  return { cards, skipped, detectedFormat }
}

/** Trigger a browser download without a dependency or a server round trip. */
export function downloadText(contents: string, filename: string, mimeType: string): void {
  const blob = new Blob([contents], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
