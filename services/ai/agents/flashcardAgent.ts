import * as aiClient from '../aiClient'
import { getDefaultModel, MODEL_IDS } from '../modelRegistry'
import { FLASHCARD_SYSTEM_PROMPT } from '../prompts/flashcardPrompt'
import type { FlashcardResponse, GeneratedFlashcard } from '../types'
import type { SubjectId } from '@/types'

// ─── Input ────────────────────────────────────────────────────────────────────

export interface FlashcardInput {
  content: string
  subject: SubjectId
  count?: number
}

// ─── Agent ────────────────────────────────────────────────────────────────────

export async function run(input: FlashcardInput): Promise<FlashcardResponse> {
  const count = input.count ?? 6

  if (!aiClient.isConfigured()) {
    throw new Error('OPENROUTER_API_KEY is not configured. Add it to .env.local to enable AI flashcard generation.')
  }

  const messages: aiClient.Message[] = [
    { role: 'system', content: FLASHCARD_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Topic: ${input.content}\nSubject area: ${input.subject}\n\nGenerate exactly ${count} flashcards that are ALL specifically about "${input.content}". Do NOT generate cards about other topics in ${input.subject} — only about "${input.content}".`,
    },
  ]

  const result = await aiClient.chat(messages, {
    model: getDefaultModel('flashcards'),
    fallbackModel: MODEL_IDS.openrouterFree,
    maxTokens: 1500,
    temperature: 0.5,
  })

  const parsed = aiClient.extractJson<{ flashcards: GeneratedFlashcard[] }>(result.content)

  if (!parsed?.flashcards?.length) {
    throw new Error('AI failed to generate valid flashcards. The model returned an unexpected response format — please try again.')
  }

  return {
    flashcards: parsed.flashcards,
    subject: input.subject,
    model: result.model,
    tokensUsed: result.tokensUsed,
  }
}
