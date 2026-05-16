import * as aiClient from '../aiClient'
import { getDefaultModel, MODEL_IDS } from '../modelRegistry'
import { QUIZ_SYSTEM_PROMPT } from '../prompts/quizPrompt'
import type { QuizResponse, GeneratedQuizQuestion } from '../types'
import type { SubjectId } from '@/types'

// ─── Input ────────────────────────────────────────────────────────────────────

export interface QuizInput {
  content: string
  subject: SubjectId
  questionCount?: number
}

// ─── Agent ────────────────────────────────────────────────────────────────────

export async function run(input: QuizInput): Promise<QuizResponse> {
  const count = input.questionCount ?? 5

  if (!aiClient.isConfigured()) {
    throw new Error('OPENROUTER_API_KEY is not configured. Add it to .env.local to enable AI quiz generation.')
  }

  const messages: aiClient.Message[] = [
    { role: 'system', content: QUIZ_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Topic: ${input.content}\nSubject area: ${input.subject}\n\nGenerate exactly ${count} multiple-choice questions ALL specifically about "${input.content}". Do NOT generate questions about other topics in ${input.subject} — only about "${input.content}".`,
    },
  ]

  const result = await aiClient.chat(messages, {
    model: getDefaultModel('quiz'),
    fallbackModel: MODEL_IDS.openrouterFree,
    maxTokens: 2000,
    temperature: 0.5,
  })

  const parsed = aiClient.extractJson<{ title: string; questions: GeneratedQuizQuestion[] }>(result.content)

  if (!parsed?.questions?.length) {
    throw new Error('AI failed to generate valid quiz questions. The model returned an unexpected response format — please try again.')
  }

  return {
    questions: parsed.questions,
    title: parsed.title ?? 'AI-Generated Quiz',
    subject: input.subject,
    model: result.model,
    tokensUsed: result.tokensUsed,
  }
}
