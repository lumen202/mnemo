import { NextRequest, NextResponse } from 'next/server'
import { badRequest, apiError } from '@/lib/api'

/**
 * Wikipedia lookup — a scripted tool, not an AI agent. For factual/biographical
 * questions ("who is Alan Turing", "what is mitochondria"), a cited encyclopedia
 * summary is more trustworthy than an LLM's parametric memory and costs zero
 * tokens against the tutor's free-tier rate limit. Two public, keyless
 * Wikipedia endpoints, chained: opensearch resolves a loose query to the best
 * matching article title, then the REST summary endpoint returns its extract.
 */

const OPENSEARCH_URL = 'https://en.wikipedia.org/w/api.php'
const SUMMARY_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary'
const FETCH_TIMEOUT_MS = 5000

interface WikiResult {
  title: string
  extract: string
  url: string
  thumbnail?: string
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

async function resolveTitle(query: string): Promise<string | null> {
  const url = `${OPENSEARCH_URL}?action=opensearch&search=${encodeURIComponent(query)}&limit=1&namespace=0&format=json&origin=*`
  const res = await fetchWithTimeout(url)
  if (!res.ok) return null
  const data = (await res.json()) as [string, string[], string[], string[]]
  return data[1]?.[0] ?? null
}

async function fetchSummary(title: string): Promise<WikiResult | null> {
  const res = await fetchWithTimeout(`${SUMMARY_URL}/${encodeURIComponent(title)}`)
  if (!res.ok) return null
  const data = await res.json()
  if (data.type === 'disambiguation' || !data.extract) return null
  return {
    title: data.title,
    extract: data.extract,
    url: data.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
    thumbnail: data.thumbnail?.source,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { query?: string }
    if (!body.query || typeof body.query !== 'string' || !body.query.trim()) {
      return badRequest('query is required')
    }

    const query = body.query.trim().slice(0, 200)

    const title = await resolveTitle(query)
    if (!title) {
      return NextResponse.json({ result: null })
    }

    const result = await fetchSummary(title)
    return NextResponse.json({ result })
  } catch (err) {
    // Network hiccups here must never break the chat — treat as "no result"
    // rather than surfacing a 500 the client would have to specially handle.
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ result: null })
    }
    return apiError(err)
  }
}
