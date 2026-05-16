import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/services/ai/agents/studyCoachAgent'
import { apiError, badRequest } from '@/lib/api'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { studyContext?: string }

    if (!body.studyContext || typeof body.studyContext !== 'string') {
      return badRequest('studyContext is required')
    }

    const result = await run({ studyContext: body.studyContext })
    return NextResponse.json(result)
  } catch (err) {
    return apiError(err)
  }
}
