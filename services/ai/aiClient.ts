import { getDefaultModel } from './modelRegistry'
import type { ModelId } from './modelRegistry'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatOptions {
  model?: ModelId | string
  fallbackModel?: ModelId | string
  maxTokens?: number
  temperature?: number
  timeoutMs?: number
}

export interface ChatResult {
  content: string
  model: string
  tokensUsed?: number
}

// ─── Config ───────────────────────────────────────────────────────────────────

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'
const DEFAULT_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS ?? 15_000)
const MAX_RETRIES = 2

// ─── Rate Limiter (free-tier guard) ───────────────────────────────────────────
// Sliding-window counters: 15 req/min, 80 req/hour. In-memory — resets on restart.

const LIMIT_PER_MINUTE = 15
const LIMIT_PER_HOUR   = 80

const requestLog: number[] = []

function checkRateLimit(): void {
  const now = Date.now()
  const oneMin  = now - 60_000
  const oneHour = now - 3_600_000

  while (requestLog.length && requestLog[0] < oneHour) requestLog.shift()

  const perMinute = requestLog.filter((t) => t > oneMin).length
  const perHour   = requestLog.length

  if (perMinute >= LIMIT_PER_MINUTE) {
    throw new Error('AI rate limit: too many requests this minute. Please wait a moment.')
  }
  if (perHour >= LIMIT_PER_HOUR) {
    throw new Error('AI rate limit: hourly quota reached. Try again later.')
  }

  requestLog.push(now)
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) throw new Error('OPENROUTER_API_KEY is not configured')
  return key
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  ms: number
): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(id)
  }
}

async function callOnce(messages: Message[], opts: ChatOptions): Promise<ChatResult> {
  checkRateLimit()

  const model = opts.model ?? getDefaultModel('tutoring')
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS

  const res = await fetchWithTimeout(
    `${OPENROUTER_BASE}/chat/completions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
        'X-Title': 'Mnemo',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: opts.maxTokens ?? 1024,
        temperature: opts.temperature ?? 0.7,
      }),
    },
    timeoutMs
  )

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`OpenRouter ${res.status}: ${body || res.statusText}`)
  }

  const json = await res.json()
  return {
    content: json.choices[0]?.message?.content ?? '',
    model: json.model ?? model,
    tokensUsed: json.usage?.total_tokens,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function chat(messages: Message[], opts: ChatOptions = {}): Promise<ChatResult> {
  let lastErr: Error = new Error('Unknown AI error')

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callOnce(messages, opts)
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err))
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 500 * 2 ** attempt))
      }
    }
  }

  if (opts.fallbackModel && opts.fallbackModel !== opts.model) {
    return callOnce(messages, { ...opts, model: opts.fallbackModel, fallbackModel: undefined })
  }

  throw lastErr
}

async function openStream(model: string, messages: Message[], opts: ChatOptions): Promise<Response> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const controller = new AbortController()
  const timerId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
        'X-Title': 'Mnemo',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: opts.maxTokens ?? 512,
        temperature: opts.temperature ?? 0.7,
        stream: true,
      }),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timerId)
  }
}

// Streams tokens from OpenRouter as an async generator. Caller receives raw
// content delta strings; caller is responsible for stripping think-tags.
// Falls back to opts.fallbackModel if the primary request returns a non-2xx.
export async function* chatStream(
  messages: Message[],
  opts: ChatOptions = {}
): AsyncGenerator<string> {
  checkRateLimit()

  const primaryModel = opts.model ?? getDefaultModel('tutoring')

  let res = await openStream(primaryModel, messages, opts)

  if (!res.ok && opts.fallbackModel && opts.fallbackModel !== primaryModel) {
    res = await openStream(opts.fallbackModel, messages, opts)
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`OpenRouter ${res.status}: ${body || res.statusText}`)
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') return

        try {
          const json = JSON.parse(data)
          const token: string = json.choices?.[0]?.delta?.content ?? ''
          if (token) yield token
        } catch {
          // ignore malformed SSE lines
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

// ─── Structured Output Helper ─────────────────────────────────────────────────

// Extracts JSON from model output — handles markdown code fences gracefully
export function extractJson<T>(text: string): T | null {
  try {
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    const cleaned = fenceMatch ? fenceMatch[1].trim() : text.trim()
    return JSON.parse(cleaned) as T
  } catch {
    return null
  }
}

// ─── Status ───────────────────────────────────────────────────────────────────

export function isConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY)
}

// ─── RAG Extensibility Hooks ──────────────────────────────────────────────────
// Placeholder injection points for context-aware retrieval.
// Future: replace these no-ops with real embedding lookups.

export type RetrievedChunk = { content: string; source: string; score: number }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function retrieveContext(_query: string, _materialIds?: string[]): Promise<RetrievedChunk[]> {
  return []
}

export function injectContext(systemPrompt: string, chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return systemPrompt
  const ctx = chunks.map((c) => `[${c.source}]\n${c.content}`).join('\n\n')
  return `${systemPrompt}\n\n---\nRelevant study material:\n${ctx}\n---`
}
