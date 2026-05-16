# 🗄️ Data Layer

> Types, state management, database, and how data flows through the app.

---

## Type System (`types/index.ts`)

All shared interfaces live in one file. Import everything from `@/types`.

```typescript
import type { Transaction, Budget, AIInsight } from '@/types'
```

### Extending types
Add new fields directly to the interface — TypeScript will flag everywhere that needs updating:
```typescript
// Add recurring flag to Transaction
interface Transaction {
  // ...existing fields
  isRecurring?: boolean   // ← add optional fields to avoid breaking existing code
  recurringInterval?: 'weekly' | 'monthly'
}
```

---

## Zustand Stores (`store/index.ts`)

All stores export from a single file. **Always import from `@/store`**, not the file path.

```typescript
import { useAuthStore, useTransactionStore, useBudgetStore, useAIStore, useUIStore } from '@/store'
```

### Store rules
- Stores hold **raw data only** — no derived values
- Calculations happen in `utils/analytics.ts`
- Stores never call Supabase directly (that's for server actions / hooks)

### Adding a field to a store
```typescript
// store/index.ts — example: add isOnline to UIStore
interface UIState {
  sidebarOpen: boolean
  addTransactionOpen: boolean
  isOnline: boolean        // ← new field
  toggleSidebar: () => void
  setSidebarOpen: (v: boolean) => void
  setAddTransactionOpen: (v: boolean) => void
  setIsOnline: (v: boolean) => void  // ← new action
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  addTransactionOpen: false,
  isOnline: true,                                    // ← initial value
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setAddTransactionOpen: (addTransactionOpen) => set({ addTransactionOpen }),
  setIsOnline: (isOnline) => set({ isOnline }),      // ← new action
}))
```

### Adding a new store
```typescript
// At the bottom of store/index.ts
interface NotificationState {
  notifications: Notification[]
  addNotification: (n: Notification) => void
  clearAll: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  addNotification: (n) => set((s) => ({ notifications: [...s.notifications, n] })),
  clearAll: () => set({ notifications: [] }),
}))
```

---

## Mock Data (`data/mockData.ts`)

The single source of truth for all demo data.

### Adding mock transactions
```typescript
// data/mockData.ts → MOCK_TRANSACTIONS array
{
  id: 'txn_021',
  userId: 'user_demo',
  title: 'New Transaction',
  amount: 49.99,
  type: 'expense',
  category: 'entertainment',
  date: '2026-05-17',
  merchant: 'Some Service',
  tags: ['subscription'],
},
```

### Adding a new category
```typescript
// 1. Add to TransactionCategory union type (types/index.ts)
export type TransactionCategory = ... | 'fitness'

// 2. Add to CATEGORY_META (data/mockData.ts)
fitness: { label: 'Fitness', color: '#14b8a6', icon: 'Dumbbell', bg: 'bg-teal-500/20' }

// 3. Add to CATEGORIES in AddTransactionModal.tsx (auto-picked up from CATEGORY_META)
```

---

## Supabase Integration

### Status: Mock-first (placeholder)
The app runs without Supabase. Services detect placeholder credentials and return mock data.

### Files
| File | Purpose |
|---|---|
| `services/supabase/client.ts` | Singleton client with no-op storage for SSR safety |
| `services/supabase/auth.ts` | Auth helpers (signIn, signUp, signOut, getSession) |
| `services/supabase/transactions.ts` | CRUD for transactions table |
| `services/supabase/schema.sql` | Full DB schema + RLS policies |

### Activating real Supabase

**Step 1:** Create project at supabase.com

**Step 2:** Run schema in SQL editor:
```sql
-- Copy contents of services/supabase/schema.sql
-- Paste into Supabase SQL editor → Run
```

**Step 3:** Add to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

**Step 4:** Wire up the auth store to use real Supabase:
```typescript
// store/index.ts → useAuthStore.signIn
signIn: async (email, password) => {
  set({ isLoading: true })
  const { data } = await signInWithEmail(email, password)  // ← from services/supabase/auth.ts
  set({
    isLoading: false,
    isAuthenticated: true,
    user: { id: data.user!.id, email, name: data.user!.user_metadata.name, createdAt: data.user!.created_at }
  })
},
```

**Step 5:** Load real transactions on app start:
```typescript
// hooks/useTransactions.ts (create this file)
import { useEffect } from 'react'
import { useTransactionStore, useAuthStore } from '@/store'
import { fetchTransactions } from '@/services/supabase/transactions'

export function useTransactions() {
  const { transactions, setTransactions } = useTransactionStore()
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) return
    fetchTransactions(user.id).then(setTransactions)
  }, [user?.id])

  return transactions
}
```

---

## Analytics Engine (`utils/analytics.ts`)

All financial calculations are pure functions. Easy to test, impossible to misuse.

```typescript
// Anywhere you need analytics:
const analytics = computeAnalytics(transactions)
// analytics.totalIncome, .totalExpenses, .netSavings, .savingsRate, .topCategories

// Budget status:
const pct = computeBudgetProgress(budget.budgeted, budget.spent)  // 0-100
const status = getBudgetStatus(budget.budgeted, budget.spent)      // 'safe'|'warning'|'danger'
```

### Adding a new calculation
Add as a pure function in `utils/analytics.ts`:
```typescript
export function computeProjectedMonthEnd(
  currentSpend: number,
  daysElapsed: number,
  daysInMonth: number
): number {
  const dailyRate = currentSpend / daysElapsed
  return dailyRate * daysInMonth
}
```
