import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/services/ai/agents/tutorAgent'
import { apiError, badRequest } from '@/lib/api'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { message?: string; context?: string }

    if (!body.message || typeof body.message !== 'string' || !body.message.trim()) {
      return badRequest('message is required')
    }

    const result = await run({
      message: body.message.trim(),
      context: body.context,
    })

    return NextResponse.json(result)
  } catch (err) {
    return apiError(err)
  }
}
