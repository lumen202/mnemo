# 🤖 AI System

> How the AI layer works, how to extend it, and where every AI response comes from.

---

## Golden Rule

```
AI handles:    explanations · summaries · recommendations · conversation · behavioral insights
Math handles:  totals · balances · percentages · budget calculations · savings rates
```

Never ask AI to compute numbers. Pre-compute, then ask AI to explain.

---

## Service Overview

**File:** `services/ai/aiService.ts`

```
AIService
├── chat(AIRequest)           → main entrypoint
│     ├── no API key → mockResponse()
│     └── has API key → liveResponse()
│
├── generateInsights(context) → wraps chat() with structured prompt
│
└── Singleton: export const aiService = new AIService()
```

### `AIRequest` shape
```typescript
{
  prompt: string     // the user's message or system prompt
  context?: string   // optional financial context to inject
  model?: string     // override model (defaults to AI_MODELS.balanced)
}
```

### `AIResponse` shape
```typescript
{
  content: string       // the AI's text response (may contain markdown)
  model: string         // which model actually responded
  tokensUsed?: number   // token count if available
}
```

---

## Mock Mode (default)

When `OPENROUTER_API_KEY` is missing, `mockResponse()` runs:

1. Delays 800–1500ms to simulate real latency
2. Scans the user's prompt for keywords:

| Keyword in prompt | Response used |
|---|---|
| `budget` | `MOCK_AI_RESPONSES.budget` |
| `spend` / `spending` | `MOCK_AI_RESPONSES.spending` |
| `save` / `saving` | `MOCK_AI_RESPONSES.save` |
| `health` / `score` | `MOCK_AI_RESPONSES.health` |
| `risk` | `MOCK_AI_RESPONSES.risk` |
| _(anything else)_ | `MOCK_AI_RESPONSES.default` |

**To add a mock response:**
```typescript
// data/mockData.ts → MOCK_AI_RESPONSES
retirement: 'Your retirement savings...',

// services/ai/aiService.ts → selectMockResponse()
if (lower.includes('retire')) return MOCK_AI_RESPONSES.retirement
```

---

## Live Mode (OpenRouter)

When `OPENROUTER_API_KEY` is set, calls OpenRouter's `/chat/completions` endpoint.

### System prompt
```
You are WealthMind, an intelligent AI financial coach.
You help users understand spending patterns, optimize budgets, and make smarter decisions.
Always be encouraging, data-driven, and actionable.
Use markdown for formatting when helpful.
Never make specific investment recommendations.
Focus on budgeting, saving, and spending habits.
```

### Model Registry
```typescript
// services/ai/aiService.ts
export const AI_MODELS = {
  fast:     'openai/gpt-4o-mini',              // cheapest, quick
  balanced: 'anthropic/claude-3-5-haiku',      // default
  powerful: 'anthropic/claude-sonnet-4-5',     // best quality
}
```
**To swap models:** change `request.model ?? AI_MODELS.balanced` in `liveResponse()`.

---

## AI Insights System

### Data structure
```typescript
// types/index.ts
AIInsight {
  id: string
  type: 'warning' | 'tip' | 'achievement' | 'prediction'
  title: string
  description: string
  category?: TransactionCategory
  actionable?: string      // what the user should do
  priority: 'low' | 'medium' | 'high'
  createdAt: string
}
```

### Current mock insights (`data/mockData.ts → MOCK_INSIGHTS`)
| ID | Type | Priority | Topic |
|---|---|---|---|
| ins_001 | warning | high | Housing near budget limit (96%) |
| ins_002 | prediction | high | Shopping overrun likely |
| ins_003 | achievement | low | Savings rate above average |
| ins_004 | tip | medium | Subscription annual billing |
| ins_005 | tip | low | Coffee shop spending |
| ins_006 | achievement | low | Healthcare well-controlled |

### Where insights are displayed
- `components/dashboard/AIInsightsPanel.tsx` — top 4, sorted by priority
- `app/(dashboard)/assistant/page.tsx` — sidebar panel

---

## Generating Real AI Insights

When real AI is connected, use `aiService.generateInsights()`:

```typescript
// Example: generate insights from real data
const context = `
  Monthly income: $${analytics.totalIncome}
  Monthly expenses: $${analytics.totalExpenses}
  Savings rate: ${analytics.savingsRate.toFixed(1)}%
  Top category: ${analytics.topCategories[0].category} ($${analytics.topCategories[0].amount})
  Budgets over limit: ${overBudgets.map(b => b.category).join(', ')}
`
const insightText = await aiService.generateInsights(context)
```

---

## Extending the Chat

### Add financial context to every message
In `ChatInterface.tsx`, build a context string before calling `aiService.chat()`:
```typescript
const context = `User financial snapshot:
- Net savings: ${formatCurrency(netSavings)}
- Savings rate: ${savingsRate.toFixed(1)}%
- Over-budget categories: ${overBudget.join(', ')}
`
await aiService.chat({ prompt: content, context })
```
Then in `aiService.liveResponse()`, inject context into the system message.

### Add a new suggested question
```typescript
// data/mockData.ts
export const SUGGESTED_QUESTIONS = [
  'How am I doing with my budget this month?',
  // add here ↓
  'What should I do with my end-of-month surplus?',
]
```
