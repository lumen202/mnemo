import * as aiClient from '../aiClient'
import { getDefaultModel, MODEL_IDS } from '../modelRegistry'
import { SUMMARIZER_SYSTEM_PROMPT } from '../prompts/summarizerPrompt'
import type { SummaryResponse } from '../types'
import type { SubjectId } from '@/types'

// ─── Input ────────────────────────────────────────────────────────────────────

export interface SummaryInput {
  content: string
  title: string
}

// ─── Agent ────────────────────────────────────────────────────────────────────

export async function run(input: SummaryInput): Promise<SummaryResponse> {
  if (!aiClient.isConfigured()) {
    throw new Error('OPENROUTER_API_KEY is not configured. Add it to .env.local to enable AI summarization.')
  }

  const messages: aiClient.Message[] = [
    { role: 'system', content: SUMMARIZER_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Study material title: "${input.title}"\n\nContent:\n${input.content}`,
    },
  ]

  const result = await aiClient.chat(messages, {
    model: getDefaultModel('summarization'),
    fallbackModel: MODEL_IDS.openrouterFree,
    maxTokens: 800,
    temperature: 0.3,
  })

  const parsed = aiClient.extractJson<{ summary: string; keyPoints: string[]; suggestedSubject?: SubjectId }>(result.content)

  if (!parsed || !parsed.summary || !Array.isArray(parsed.keyPoints)) {
    throw new Error('AI failed to generate a valid summary. The model returned an unexpected response format — please try again.')
  }

  return {
    summary: parsed.summary,
    keyPoints: parsed.keyPoints,
    suggestedSubject: parsed.suggestedSubject,
    model: result.model,
    tokensUsed: result.tokensUsed,
  }
}
