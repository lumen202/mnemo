import { NextRequest, NextResponse } from 'next/server'
import { badRequest, apiError } from '@/lib/api'

/**
 * arXiv search — a scripted tool for "find papers on X" queries. arXiv's API
 * is free, keyless, and returns real published research (title, authors,
 * abstract, link) — exactly what a STEM study companion should hand back for
 * "papers on transformers" rather than an LLM inventing plausible-sounding
 * citations. Response is Atom XML; parsed with targeted regexes rather than
 * pulling in an XML library for a handful of well-known tags.
 */

const ARXIV_API_URL = 'https://export.arxiv.org/api/query'
const FETCH_TIMEOUT_MS = 6000
const MAX_RESULTS = 3

export interface ArxivPaper {
  title: string
  authors: string[]
  summary: string
  url: string
  published: string
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

function extractTag(tag: string, block: string): string | null {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))
  return match ? decodeXmlEntities(match[1]).replace(/\s+/g, ' ').trim() : null
}

function parseEntries(xml: string): ArxivPaper[] {
  const entryBlocks = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? []
  return entryBlocks.map((block) => {
    const authors = [...block.matchAll(/<author>\s*<name>([\s\S]*?)<\/name>/g)].map((m) =>
      decodeXmlEntities(m[1]).trim()
    )
    const published = extractTag('published', block)
    // arXiv's <id> is an http:// URL by convention (https works fine) — the
    // chat message renderer only linkifies https:// for security, so a plain
    // http:// link here would render as raw unlinked markdown text.
    const rawUrl = extractTag('id', block) ?? ''
    return {
      title: extractTag('title', block) ?? 'Untitled',
      authors,
      summary: extractTag('summary', block) ?? '',
      url: rawUrl.replace(/^http:\/\//, 'https://'),
      published: published ? published.slice(0, 10) : '',
    }
  })
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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { query?: string }
    if (!body.query || typeof body.query !== 'string' || !body.query.trim()) {
      return badRequest('query is required')
    }

    const query = body.query.trim().slice(0, 200)
    const url = `${ARXIV_API_URL}?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${MAX_RESULTS}&sortBy=relevance`

    const res = await fetchWithTimeout(url)
    if (!res.ok) {
      return NextResponse.json({ papers: [] })
    }

    const xml = await res.text()
    const papers = parseEntries(xml).filter((p) => p.title !== 'Untitled')
    return NextResponse.json({ papers })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ papers: [] })
    }
    return apiError(err)
  }
}
