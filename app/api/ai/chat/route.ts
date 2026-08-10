import { NextRequest, NextResponse } from 'next/server'
import * as aiClient from '@/services/ai/aiClient'
import { getDefaultModel } from '@/services/ai/modelRegistry'
import { TUTOR_SYSTEM_PROMPT } from '@/services/ai/prompts/tutorPrompt'
import { run as runMock } from '@/services/ai/agents/tutorAgent'
import { lookup as vaultLookup, store as vaultStore } from '@/services/ai/responseVault'
import { badRequest, apiError } from '@/lib/api'

function streamText(text: string): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text))
      controller.close()
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { message?: string; context?: string; history?: { role: string; content: string }[] }

    if (!body.message || typeof body.message !== 'string' || !body.message.trim()) {
      return badRequest('message is required')
    }

    const message = body.message.trim()
    const history: { role: string; content: string }[] = Array.isArray(body.history) ? body.history : []

    // ── Vault / Cache lookup ──────────────────────────────────────────────────
    // The LRU cache tier stores real model output and is a single in-memory
    // store shared by every user this server process serves. The client only
    // sends `context` for personal-progress questions (see isPersonalQuery in
    // utils/aiContext.ts) — those answers may reference this student's real
    // streak/subjects/materials, so reusing them for a different student would
    // leak their study data. The static knowledge vault is pre-written,
    // non-personalized text, so it stays available either way (see lookup()).
    const skipCache = Boolean(body.context)
    const cached = vaultLookup(message, history, !skipCache)
    if (cached) {
      return streamText(cached.content)
    }

    // Mock mode — no API key configured, return JSON
    if (!aiClient.isConfigured()) {
      const result = await runMock({ message, context: body.context, history })
      if (!skipCache) vaultStore(message, result.content, history)
      return NextResponse.json(result)
    }

    // Live mode — stream tokens back to the client
    const messages: aiClient.Message[] = [
      { role: 'system', content: TUTOR_SYSTEM_PROMPT },
      ...(body.context
        ? [
            { role: 'user' as const, content: `My study context:\n${body.context}` },
            { role: 'assistant' as const, content: 'Got it — I have your study context. What would you like to explore?' },
          ]
        : []),
      ...history.map((m) => ({
        role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ]

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        let full = ''
        try {
          for await (const token of aiClient.chatStream(messages, {
            model: getDefaultModel('tutoring'),
            maxTokens: 512,
            temperature: 0.7,
          })) {
            full += token
            controller.enqueue(encoder.encode(token))
          }
          if (!skipCache) vaultStore(message, full, history)
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'AI error'
          controller.enqueue(encoder.encode(`\n\n*Sorry, something went wrong: ${msg}. Please try again.*`))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    return apiError(err)
  }
}
