# 🏛️ Architecture

> System design, data flow, and the reasoning behind every major decision.

---

## High-Level Diagram

```
Browser
  │
  ├── Next.js App Router (SSR + Client hydration)
  │     ├── Server Components  → layout, static pages
  │     └── Client Components  → 'use client' — all interactive UI
  │
  ├── Zustand Stores           → in-memory global state (no SSR)
  │     ├── AuthStore          → user session
  │     ├── TransactionStore   → transaction list
  │     ├── BudgetStore        → budget limits
  │     ├── AIStore            → chat messages + insights
  │     └── UIStore            → sidebar open, modal open
  │
  ├── AI Service Layer
  │     ├── Mock path  →  keyword match → MOCK_AI_RESPONSES (no API key needed)
  │     └── Live path  →  OpenRouter API → any LLM model
  │
  └── Supabase (placeholder — mock-first)
        ├── Auth       → email/password (currently mocked in store)
        ├── DB         → transactions, budgets tables
        └── RLS        → row-level security per user
```

---

## Data Flow

### Reading data (e.g. Dashboard)
```
Page (Server Component)
  └── Widget (Client Component, 'use client')
        └── useTransactionStore()         ← Zustand
              └── computeAnalytics()      ← utils/analytics.ts
                    └── renders UI
```

### Writing data (e.g. Add Transaction)
```
User fills form → AddTransactionModal
  └── useTransactionStore.addTransaction()   ← optimistic update
        └── (future) insertTransaction()     ← services/supabase/transactions.ts
              └── Supabase DB
```

### AI Chat flow
```
User types message
  └── ChatInterface sends to aiService.chat()
        ├── no API key → mockResponse() → 800-1500ms fake delay → MOCK_AI_RESPONSES
        └── has API key → liveResponse() → OpenRouter → LLM → streamed back
              └── useAIStore.addMessage()  → re-renders ChatInterface
```

---

## Separation of Concerns

```
┌─────────────────────────────────────────────────────────┐
│ UI Layer           components/**                        │
│  - rendering only, no business logic                    │
│  - reads from stores, dispatches actions                │
├─────────────────────────────────────────────────────────┤
│ State Layer        store/index.ts                       │
│  - single source of truth for all client state         │
│  - no API calls, no calculations                       │
├─────────────────────────────────────────────────────────┤
│ Logic Layer        utils/analytics.ts                   │
│  - pure functions, deterministic, testable             │
│  - all financial math lives here                       │
├─────────────────────────────────────────────────────────┤
│ AI Layer           services/ai/aiService.ts             │
│  - only for language: explanations, summaries          │
│  - NEVER for calculations or business logic            │
├─────────────────────────────────────────────────────────┤
│ Data Layer         services/supabase/ + data/           │
│  - mock-first: returns mock data when no real DB       │
│  - swap to real Supabase by adding .env.local keys     │
└─────────────────────────────────────────────────────────┘
```

---

## Route Structure

```
/                           Landing page (public)
/auth/login                 Login (public)
/auth/signup                Signup (public)

/(dashboard)/               Route group — requires auth
  /dashboard                Overview
  /transactions             Transaction history
  /budgets                  Budget management
  /assistant                AI chat
```

> **Note:** Auth protection is not yet enforced by middleware. The auth store initializes with a demo user. See [ROADMAP.md → Auth middleware](./ROADMAP.md#-auth--user-management) to add route protection.

---

## Styling System

```
globals.css
├── CSS custom properties  (--background, --primary, etc.)
│     └── Used by Tailwind via hsl(var(--xxx)) in tailwind.config.ts
│
├── @layer components
│     ├── .glass              backdrop-blur + semi-transparent bg + border
│     ├── .glass-hover        transitions on hover
│     ├── .glow-indigo/etc    box-shadow glows
│     ├── .gradient-text      indigo→violet→cyan text gradient
│     ├── .hero-gradient      radial hero background
│     └── .card-shine         hover shimmer sweep effect
│
└── @layer utilities
      ├── .mask-bottom        fade to transparent at bottom
      └── .no-scrollbar       hide scrollbar cross-browser
```

---

## Mock-First Pattern

Every service follows this pattern — zero config required to run:

```typescript
// services/supabase/transactions.ts
export async function fetchTransactions(userId: string) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
    await delay(400)           // realistic latency
    return MOCK_TRANSACTIONS   // from data/mockData.ts
  }
  // real Supabase call only when env vars are real
  return supabase.from('transactions').select('*')...
}
```

Same pattern applies to `aiService.ts` — no `OPENROUTER_API_KEY` → uses `MOCK_AI_RESPONSES`.

---

## Adding Real Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Apply migrations with `supabase db push` (or paste `supabase/migrations/*.sql` into the SQL editor, in filename order)
3. Copy keys to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
4. Update auth store (`store/index.ts`) to call `services/supabase/auth.ts` instead of mocking

## Adding Real AI

1. Get API key at [openrouter.ai](https://openrouter.ai)
2. Add to `.env.local`:
   ```
   OPENROUTER_API_KEY=sk-or-...
   ```
3. Done — `aiService.ts` auto-switches to live mode
