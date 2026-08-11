import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/services/ai/agents/flashcardAgent'
import { apiError, badRequest, parseSubject } from '@/lib/api'
import { withAuth } from '@/lib/auth'

export const POST = withAuth(async (req: NextRequest) => {
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
      count: typeof body.count === 'number' ? body.count : 6,
    })

    return NextResponse.json(result)
  } catch (err) {
    return apiError(err)
  }
}, { cost: 'model' })
