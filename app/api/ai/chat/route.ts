import { NextRequest, NextResponse } from 'next/server'
import * as aiClient from '@/services/ai/aiClient'
import { getDefaultModel } from '@/services/ai/modelRegistry'
import { TUTOR_SYSTEM_PROMPT } from '@/services/ai/prompts/tutorPrompt'
import { run as runMock } from '@/services/ai/agents/tutorAgent'
import { badRequest, apiError } from '@/lib/api'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { message?: string; context?: string }

    if (!body.message || typeof body.message !== 'string' || !body.message.trim()) {
      return badRequest('message is required')
    }

    const message = body.message.trim()

    // Mock mode — no API key configured, return JSON as before
    if (!aiClient.isConfigured()) {
      const result = await runMock({ message, context: body.context })
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
      { role: 'user', content: message },
    ]

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const token of aiClient.chatStream(messages, {
            model: getDefaultModel('tutoring'),
            maxTokens: 512,
            temperature: 0.7,
          })) {
            controller.enqueue(encoder.encode(token))
          }
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
