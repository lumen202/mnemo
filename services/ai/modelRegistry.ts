// ─── Model IDs ────────────────────────────────────────────────────────────────

export const MODEL_IDS = {
  // Testing default — free, covers all tasks
  gptOss120b:   'openai/gpt-oss-120b:free',
  // Free tier
  qwen32b:      'qwen/qwen3-32b:free',
  deepseek:     'deepseek/deepseek-chat:free',
  geminiFlash:  'google/gemini-flash-1.5',
  // Premium tier — swap in when ready
  gpt4oMini:    'openai/gpt-4o-mini',
  claudeHaiku:  'anthropic/claude-haiku-4-5-20251001',
  claudeSonnet: 'anthropic/claude-sonnet-4-6',
} as const

export type ModelId = (typeof MODEL_IDS)[keyof typeof MODEL_IDS]

// ─── Task Types ───────────────────────────────────────────────────────────────

export type TaskType = 'tutoring' | 'summarization' | 'flashcards' | 'quiz' | 'insights'

// ─── Model Config ─────────────────────────────────────────────────────────────

export interface ModelConfig {
  id: ModelId
  label: string
  tier: 'free' | 'cheap' | 'premium'
  contextWindow: number
  strengths: string[]
  defaultFor: TaskType[]
  notes?: string
}

export const MODEL_REGISTRY: ModelConfig[] = [
  {
    id: MODEL_IDS.gptOss120b,
    label: 'GPT-OSS 120B',
    tier: 'free',
    contextWindow: 128000,
    strengths: ['reasoning', 'instruction-following', 'JSON', 'long-form'],
    defaultFor: ['tutoring', 'summarization', 'flashcards', 'quiz', 'insights'],
    notes: 'Testing default — covers all task types on the free tier',
  },
  {
    id: MODEL_IDS.qwen32b,
    label: 'Qwen 32B',
    tier: 'free',
    contextWindow: 32768,
    strengths: ['reasoning', 'math', 'coding', 'step-by-step'],
    defaultFor: ['tutoring', 'quiz'],
    notes: 'Best free model for pedagogical explanations and quiz generation',
  },
  {
    id: MODEL_IDS.deepseek,
    label: 'DeepSeek Chat',
    tier: 'free',
    contextWindow: 65536,
    strengths: ['instruction-following', 'summarization', 'long-form', 'JSON'],
    defaultFor: ['summarization', 'insights'],
    notes: 'Reliable for structured JSON output and long-document summarization',
  },
  {
    id: MODEL_IDS.geminiFlash,
    label: 'Gemini Flash 1.5',
    tier: 'cheap',
    contextWindow: 1048576,
    strengths: ['speed', 'long-context', 'documents', 'flashcards'],
    defaultFor: ['flashcards'],
    notes: 'Massive context window — ideal for full-document flashcard generation',
  },
  {
    id: MODEL_IDS.gpt4oMini,
    label: 'GPT-4o Mini',
    tier: 'cheap',
    contextWindow: 128000,
    strengths: ['json-output', 'structured-data', 'consistency'],
    defaultFor: [],
    notes: 'Premium upgrade: reliable structured output for production',
  },
  {
    id: MODEL_IDS.claudeHaiku,
    label: 'Claude Haiku',
    tier: 'premium',
    contextWindow: 200000,
    strengths: ['nuance', 'pedagogy', 'safe-responses', 'citations'],
    defaultFor: [],
    notes: 'Best-in-class for nuanced tutoring and educational content',
  },
  {
    id: MODEL_IDS.claudeSonnet,
    label: 'Claude Sonnet',
    tier: 'premium',
    contextWindow: 200000,
    strengths: ['complex-reasoning', 'creative-explanations', 'deep-analysis'],
    defaultFor: [],
    notes: 'Highest quality — ideal for complex multi-step reasoning tasks',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getDefaultModel(task: TaskType): ModelId {
  const match = MODEL_REGISTRY.find((m) => m.defaultFor.includes(task))
  return match?.id ?? MODEL_IDS.gptOss120b
}

export function getModelConfig(id: string): ModelConfig | undefined {
  return MODEL_REGISTRY.find((m) => m.id === id)
}

export function getModelsByTier(tier: ModelConfig['tier']): ModelConfig[] {
  return MODEL_REGISTRY.filter((m) => m.tier === tier)
}
