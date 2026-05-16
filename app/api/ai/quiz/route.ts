import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/services/ai/agents/quizAgent'
import { apiError, badRequest, parseSubject } from '@/lib/api'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      content?: string
      subject?: string
      count?: number
    }

    if (!body.content || typeof body.content !== 'string') {
      return badRequest('content is required')
    }

    const result = await run({
      content: body.content,
      subject: parseSubject(body.subject),
      questionCount: typeof body.count === 'number' ? body.count : 5,
    })

    return NextResponse.json(result)
  } catch (err) {
    return apiError(err)
  }
}
