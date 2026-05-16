import * as aiClient from '../aiClient'
import { getDefaultModel } from '../modelRegistry'
import { STUDY_COACH_SYSTEM_PROMPT } from '../prompts/studyCoachPrompt'
import type { StudyInsightResponse } from '../types'
import type { AIInsight } from '@/types'

// ─── Input ────────────────────────────────────────────────────────────────────

export interface StudyCoachInput {
  studyContext: string
}

// ─── Agent ────────────────────────────────────────────────────────────────────

export async function run(input: StudyCoachInput): Promise<StudyInsightResponse> {
  if (!aiClient.isConfigured()) {
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 300))
    return { insights: MOCK_INSIGHTS, model: 'mock', tokensUsed: 0 }
  }

  try {
    const messages: aiClient.Message[] = [
      { role: 'system', content: STUDY_COACH_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Analyze this student's study data and generate personalized insights:\n\n${input.studyContext}`,
      },
    ]

    const result = await aiClient.chat(messages, {
      model: getDefaultModel('insights'),
      maxTokens: 1200,
      temperature: 0.4,
    })

    const parsed = aiClient.extractJson<{ insights: AIInsight[] }>(result.content)

    if (!parsed?.insights?.length) {
      return { insights: MOCK_INSIGHTS, model: 'mock-fallback', tokensUsed: 0 }
    }

    return {
      insights: parsed.insights,
      model: result.model,
      tokensUsed: result.tokensUsed,
    }
  } catch {
    return { insights: MOCK_INSIGHTS, model: 'mock-fallback', tokensUsed: 0 }
  }
}

// ─── Mock Insights ────────────────────────────────────────────────────────────

const MOCK_INSIGHTS: AIInsight[] = [
  {
    id: 'ins_gen_001',
    type: 'warning',
    title: 'Physics Needs Attention',
    description:
      "You haven't reviewed Quantum Physics in 4 days. Based on spaced repetition principles, wave function concepts may start to fade without reinforcement soon.",
    subject: 'physics',
    actionable: 'Schedule a 30-minute review of the Quantum Wave Functions lecture notes today.',
    priority: 'high',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ins_gen_002',
    type: 'prediction',
    title: 'ML Mastery Within Reach',
    description:
      "At your current pace you'll complete all Machine Learning materials in 3 days. You're 93% through the subject with strong flashcard retention.",
    subject: 'machine-learning',
    actionable: 'Focus on the Transformer Architecture material to close the final 7%.',
    priority: 'high',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ins_gen_003',
    type: 'achievement',
    title: '7-Day Study Streak!',
    description:
      "You've studied every day for the past 7 days — your longest streak yet. Consistency is the #1 predictor of long-term retention.",
    actionable: 'Keep it up! Even 20 minutes tomorrow maintains your streak.',
    priority: 'low',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ins_gen_004',
    type: 'tip',
    title: 'Spaced Repetition Due',
    description:
      'You have 14 flashcards due for review today. Reviewing them now takes ~10 minutes and dramatically improves 30-day retention.',
    actionable: 'Open the Flashcards section and complete today\'s review queue.',
    priority: 'medium',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ins_gen_005',
    type: 'tip',
    title: 'History Study Gap',
    description:
      'World History has only 33% of your target hours this month. With 16 days left, 30 min/day would close the gap.',
    subject: 'history',
    actionable: 'Upload your Cold War notes and generate a quick AI summary to re-engage.',
    priority: 'medium',
    createdAt: new Date().toISOString(),
  },
]
