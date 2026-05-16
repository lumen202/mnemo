# 🚀 Roadmap

> Every planned feature with implementation guidance so we can build fast.
> Pick a feature, follow the guide, ship it.

---

## Feature Status Key
- `[ ]` Not started
- `[~]` In progress
- `[x]` Done

---

## 🔐 Auth & User Management

### `[ ]` Route protection middleware
**Files to create/edit:**
- Create `middleware.ts` at project root
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.get('wm_auth')  // set on login
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
    || ['/transactions', '/budgets', '/assistant'].some(p => request.nextUrl.pathname.startsWith(p))

  if (isDashboard && !isAuthenticated) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}
```

### `[ ]` Real Supabase auth
**Files to edit:**
- `store/index.ts` → replace mock `signIn`/`signUp` with calls to `services/supabase/auth.ts`
- See `docs/DATA_LAYER.md → Activating real Supabase` for full steps

### `[ ]` User profile page
**Files to create:**
- `app/(dashboard)/profile/page.tsx`
- `components/profile/ProfileCard.tsx`
- `components/profile/AvatarUpload.tsx`

---

## 💳 Transactions

### `[ ]` Recurring transactions
**Types to update:** `types/index.ts` → add `isRecurring?: boolean`, `recurringInterval?: 'weekly'|'monthly'`
**Component to update:** `components/transactions/AddTransactionModal.tsx` → add recurring checkbox + interval select

### `[ ]` Transaction CSV import
**Files to create:**
- `components/transactions/ImportModal.tsx` — drag-drop CSV upload
- `utils/csvParser.ts` — parse CSV rows to `Transaction[]`
- `actions/importTransactions.ts` — server action for bulk insert

### `[ ]` Transaction search with filters memory
**Files to edit:**
- `app/(dashboard)/transactions/page.tsx` → persist filter state to `useUIStore` or URL search params

### `[ ]` Transaction tags editor
**Files to edit:**
- `components/transactions/TransactionItem.tsx` → add inline tag chips
- `components/transactions/AddTransactionModal.tsx` → add tag input (comma-separated)

### `[ ]` Transaction edit (not just delete)
**Files to create:** `components/transactions/EditTransactionModal.tsx`
**Files to edit:** `components/transactions/TransactionItem.tsx` → add edit button on hover alongside delete

---

## 📊 Budget Features

### `[ ]` Add new budget category
**Files to edit:**
- `app/(dashboard)/budgets/page.tsx` → "Add Budget" button
- Create `components/budgets/AddBudgetModal.tsx` (similar to `EditBudgetModal` but with category picker)
- `store/index.ts → useBudgetStore` → add `addBudget` action

### `[ ]` Budget history / month-over-month
**Files to create:**
- `components/budgets/BudgetHistory.tsx` — bar chart comparing budget vs actual over months
- `data/mockData.ts` → add `MOCK_BUDGET_HISTORY`

### `[ ]` Spending velocity indicator
Shows "at this pace you'll hit limit in X days".
**Files to edit:** `components/budgets/BudgetCard.tsx`
**Utils to add:** `utils/analytics.ts → computeVelocity(spent, daysElapsed, budgeted)`

---

## 🤖 AI Features

### `[ ]` Context-aware AI chat
Inject real financial data into every AI message.
**File to edit:** `components/ai/ChatInterface.tsx`
```typescript
// Before calling aiService.chat(), build context:
const { transactions } = useTransactionStore()
const { budgets } = useBudgetStore()
const analytics = computeAnalytics(transactions)
const context = buildFinancialContext(analytics, budgets) // new util
await aiService.chat({ prompt: content, context })
```
**File to create:** `utils/aiContext.ts → buildFinancialContext()`

### `[ ]` Live AI-generated insights
Replace `MOCK_INSIGHTS` with real AI-generated ones.
**Files to create:**
- `hooks/useAIInsights.ts` — calls `aiService.generateInsights(context)` on mount
- Parse AI response into `AIInsight[]` format
**Files to edit:** `store/index.ts → useAIStore` → add `refreshInsights()` action

### `[ ]` AI spending predictions
Predict end-of-month spend for each category.
**Utils to add:** `utils/analytics.ts → computeProjectedSpend(spent, daysElapsed, daysInMonth)`
**AI role:** explain the prediction in natural language, not compute it

### `[ ]` Message history persistence
Save chat history to localStorage or Supabase.
**Files to edit:** `store/index.ts → useAIStore` → add `persist` middleware (Zustand)
```typescript
import { persist } from 'zustand/middleware'
export const useAIStore = create(persist(/* ... */, { name: 'wm-ai-chat' }))
```

### `[ ]` Voice input
**Files to edit:** `components/ai/ChatInterface.tsx` → add mic button
**New util:** `utils/speechRecognition.ts` wrapping Web Speech API

---

## 📈 Analytics & Insights

### `[ ]` Monthly reports page
**Files to create:**
- `app/(dashboard)/reports/page.tsx`
- `components/reports/MonthlyReport.tsx` — full breakdown of a month
- `components/reports/MonthSelector.tsx`

### `[ ]` Net worth tracker
**Files to create:**
- `app/(dashboard)/net-worth/page.tsx`
- `types/index.ts` → add `Asset`, `Liability` interfaces
- `components/net-worth/NetWorthChart.tsx`

### `[ ]` Savings goals
**Files to create:**
- `app/(dashboard)/goals/page.tsx`
- `components/goals/GoalCard.tsx` — target amount, deadline, progress ring
- `types/index.ts` → add `SavingsGoal` interface
- `store/index.ts` → add `useGoalStore`

### `[ ]` Spending heatmap calendar
Visual calendar showing spending intensity per day.
**Files to create:** `components/charts/SpendingCalendar.tsx`

---

## 🎨 UI & UX

### `[ ]` Toast notification system
**Files to create:**
- `components/common/Toast.tsx` — animated toast component
- `components/common/ToastContainer.tsx` — positioned container
- `store/index.ts → useUIStore` → add `toasts[]`, `addToast()`, `removeToast()`
- Use in: `AddTransactionModal` (success), `EditBudgetModal` (saved)

### `[ ]` Dark/Light mode toggle
**Files to edit:**
- `app/layout.tsx` → remove hardcoded `dark` class
- `store/index.ts → useUIStore` → add `theme: 'dark'|'light'`
- `components/layout/TopBar.tsx` → add toggle button
- `tailwind.config.ts` → already supports `darkMode: ['class']`

### `[ ]` Mobile sidebar (drawer)
**Files to create:** `components/layout/MobileDrawer.tsx` — Sheet-style slide-in
**Files to edit:** `app/(dashboard)/layout.tsx` → render Sidebar on desktop, MobileDrawer on mobile

### `[ ]` Onboarding flow
**Files to create:**
- `app/(dashboard)/onboarding/page.tsx` — multi-step wizard
- `components/onboarding/OnboardingStep.tsx`
- Steps: set income → choose categories → set budget targets → first transaction

### `[ ]` Empty states
**Files to create:** `components/common/EmptyState.tsx`
**Files to edit:** `TransactionList`, `BudgetList` — show empty state when no data

### `[ ]` Keyboard shortcuts
Add `useEffect` with `keydown` listener in layout:
- `Cmd+K` → search
- `Cmd+N` → add transaction
- `Cmd+/` → open AI assistant

---

## 🔧 Infrastructure

### `[ ]` Server actions for mutations
**Files to create:** `actions/transactions.ts`, `actions/budgets.ts`
```typescript
// actions/transactions.ts
'use server'
export async function createTransaction(data: Omit<Transaction, 'id'>) {
  return insertTransaction(data)
}
```

### `[ ]` API route for AI (server-side key security)
Move OpenRouter API key to server-side:
**Files to create:** `app/api/ai/chat/route.ts`
```typescript
export async function POST(req: Request) {
  const { prompt } = await req.json()
  // call OpenRouter with server-side key
}
```
**Files to edit:** `services/ai/aiService.ts → liveResponse()` → call `/api/ai/chat` instead of OpenRouter directly

### `[ ]` Error boundary
**Files to create:** `components/common/ErrorBoundary.tsx`
**Files to edit:** `app/(dashboard)/layout.tsx` → wrap children in ErrorBoundary

### `[ ]` Loading skeletons
Replace instant renders with skeleton screens for perceived performance.
**Files to create:** `components/common/Skeleton.tsx`
**Files to edit:** Each dashboard widget → show skeleton while `isLoading`

---

## 📱 PWA / Mobile

### `[ ]` PWA manifest
**Files to create:** `public/manifest.json`, icons in `public/icons/`
**Files to edit:** `app/layout.tsx` → add `<link rel="manifest">`

### `[ ]` Responsive transaction list
**Files to edit:** `components/transactions/TransactionItem.tsx` → collapse merchant/date on mobile (already partially done with `hidden sm:block`)
