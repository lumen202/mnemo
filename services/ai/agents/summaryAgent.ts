import * as aiClient from '../aiClient'
import { getDefaultModel } from '../modelRegistry'
import { SUMMARIZER_SYSTEM_PROMPT } from '../prompts/summarizerPrompt'
import type { SummaryResponse } from '../types'

// ─── Input ────────────────────────────────────────────────────────────────────

export interface SummaryInput {
  content: string
  title: string
}

// ─── Agent ────────────────────────────────────────────────────────────────────

export async function run(input: SummaryInput): Promise<SummaryResponse> {
  if (!aiClient.isConfigured()) {
    await new Promise((r) => setTimeout(r, 700 + Math.random() * 400))
    return mockSummary(input.title)
  }

  try {
    const messages: aiClient.Message[] = [
      { role: 'system', content: SUMMARIZER_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Study material title: "${input.title}"\n\nContent:\n${input.content}`,
      },
    ]

    const result = await aiClient.chat(messages, {
      model: getDefaultModel('summarization'),
      maxTokens: 800,
      temperature: 0.3,
    })

    const parsed = aiClient.extractJson<{ summary: string; keyPoints: string[] }>(result.content)

    if (!parsed || !parsed.summary || !Array.isArray(parsed.keyPoints)) {
      return {
        summary: result.content,
        keyPoints: [],
        model: result.model,
        tokensUsed: result.tokensUsed,
      }
    }

    return {
      summary: parsed.summary,
      keyPoints: parsed.keyPoints,
      model: result.model,
      tokensUsed: result.tokensUsed,
    }
  } catch {
    return mockSummary(input.title)
  }
}

// ─── Mock ─────────────────────────────────────────────────────────────────────

function mockSummary(title: string): SummaryResponse {
  return {
    summary: `"${title}" covers core theoretical foundations and practical applications of the subject matter. The material establishes key definitions, works through canonical examples, and connects concepts to real-world contexts. Mastery requires understanding both the formal rules and the intuition behind when and why to apply each technique.`,
    keyPoints: [
      'Core definitions establish the vocabulary needed to reason precisely about the subject.',
      'The fundamental theorem or algorithm ties together the key ideas and serves as the main analytical tool.',
      'Common edge cases and failure modes must be understood to apply techniques correctly.',
      'Complexity analysis (time/space or mathematical bounds) determines when a method is appropriate.',
      'The technique connects to adjacent topics — understanding these bridges accelerates mastery.',
    ],
    model: 'mock',
    tokensUsed: 0,
  }
}
