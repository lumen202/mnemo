import { NextRequest, NextResponse } from 'next/server'
import { badRequest, apiError } from '@/lib/api'
import { withAuth } from '@/lib/auth'

/**
 * Wiktionary lookup — a real dictionary definition for "define X" queries.
 * Wikipedia is encyclopedic (biographies, topics, events); for a plain word
 * or short term, Wiktionary's part-of-speech + definition is the better fit
 * and is free/keyless like the Wikipedia tool. No match falls back to
 * Wikipedia client-side (see tutorTools.ts) since not every "define X" is a
 * dictionary word — e.g. "define photosynthesis" is really a concept lookup.
 */

const DEFINITION_URL = 'https://en.wiktionary.org/api/rest_v1/page/definition'
const FETCH_TIMEOUT_MS = 5000

interface DictionaryResult {
  word: string
  partOfSpeech: string
  definition: string
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'Mnemo-AI-Study-Companion/1.0' } })
  } finally {
    clearTimeout(timer)
  }
}

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = (await req.json()) as { word?: string }
    if (!body.word || typeof body.word !== 'string' || !body.word.trim()) {
      return badRequest('word is required')
    }

    const word = body.word.trim().toLowerCase().slice(0, 60)
    const res = await fetchWithTimeout(`${DEFINITION_URL}/${encodeURIComponent(word)}`)
    if (!res.ok) {
      return NextResponse.json({ result: null })
    }

    const data = await res.json()
    const entries = data.en as { partOfSpeech: string; definitions: { definition: string }[] }[] | undefined
    const firstEntry = entries?.[0]
    const firstDefinition = firstEntry?.definitions?.[0]?.definition

    if (!firstEntry || !firstDefinition) {
      return NextResponse.json({ result: null })
    }

    const result: DictionaryResult = {
      word: body.word.trim(),
      partOfSpeech: firstEntry.partOfSpeech,
      definition: stripHtml(firstDefinition),
    }
    return NextResponse.json({ result })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ result: null })
    }
    return apiError(err)
  }
}, { cost: 'lookup' })
