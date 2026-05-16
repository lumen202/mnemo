import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/services/ai/agents/summaryAgent'
import { apiError, badRequest } from '@/lib/api'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { content?: string; title?: string }

    if (!body.content || typeof body.content !== 'string') {
      return badRequest('content is required')
    }

    const result = await run({
      content: body.content,
      title: body.title ?? 'Study Material',
    })

    return NextResponse.json(result)
  } catch (err) {
    return apiError(err)
  }
}
