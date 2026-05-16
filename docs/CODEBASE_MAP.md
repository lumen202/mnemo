# 🗺️ Codebase Map

> Every file in the project with its purpose, imports, and what it owns.
> Use Ctrl+F to jump to any file or folder.

---

## `/app` — Pages & Layouts

```
app/
├── globals.css                  CSS variables, Tailwind layers, glass/gradient utilities
├── layout.tsx                   Root HTML shell — dark mode, font, metadata
├── page.tsx                     Landing page (hero, features, stats, testimonials, CTA)
│
├── auth/
│   ├── login/page.tsx           Login form — calls useAuthStore.signIn → /dashboard
│   └── signup/page.tsx          Signup form — calls useAuthStore.signUp → /dashboard
│
└── (dashboard)/                 Route group — shares DashboardLayout
    ├── layout.tsx               Sidebar + TopBar + AddTransactionModal wrapper
    ├── dashboard/page.tsx       Main overview: BalanceCard, charts, health, insights
    ├── transactions/page.tsx    Full transaction table with filters + stats
    ├── budgets/page.tsx         Budget grid + AI banner + overall progress
    └── assistant/page.tsx       Split: ChatInterface (2/3) + insights sidebar (1/3)
```

---

## `/components` — UI Building Blocks

### `components/ui/` — shadcn Primitives
| File | What it provides |
|---|---|
| `button.tsx` | `<Button>` — variants: default, outline, ghost, gradient, glass |
| `card.tsx` | `<Card>` + CardHeader/Title/Description/Content/Footer |
| `input.tsx` | `<Input>` — styled text input |
| `label.tsx` | `<Label>` — form label via Radix |
| `badge.tsx` | `<Badge>` — variants: default, success, warning, destructive, info |
| `progress.tsx` | `<Progress>` — indigo gradient bar via Radix |
| `dialog.tsx` | `<Dialog>` + Content/Header/Footer/Title/Description |
| `tabs.tsx` | `<Tabs>` + TabsList/Trigger/Content via Radix |
| `select.tsx` | `<Select>` + Trigger/Content/Item via Radix |
| `avatar.tsx` | `<Avatar>` + AvatarImage/Fallback via Radix |
| `separator.tsx` | `<Separator>` — horizontal/vertical via Radix |
| `textarea.tsx` | `<Textarea>` — styled multiline input |
| `scroll-area.tsx` | `<ScrollArea>` — custom scrollbar via Radix |
| `dropdown-menu.tsx` | `<DropdownMenu>` + full Item/Label/Separator set via Radix |

### `components/layout/` — App Shell
| File | Owns | Key state |
|---|---|---|
| `Sidebar.tsx` | Navigation, logo, user section, collapse toggle | `useUIStore.sidebarOpen`, `useAuthStore.user` |
| `TopBar.tsx` | Page title, search icon, bell, Add Transaction button | `useUIStore.setAddTransactionOpen` |

### `components/common/` — Shared Atoms
| File | Props | Notes |
|---|---|---|
| `GlassCard.tsx` | `glow`, `hover`, `shine` | Wraps any content in glass surface |
| `StatCard.tsx` | `label`, `value`, `trend`, `trendValue`, `icon` | Metric card with trend arrow |
| `LoadingSpinner.tsx` | `size` (sm/md/lg) | Also exports `<PageLoader>` centered fullscreen |

### `components/charts/` — Data Viz
| File | Library | Data source |
|---|---|---|
| `TrendLineChart.tsx` | Recharts AreaChart | `MOCK_MONTHLY_TREND` prop or default |
| `CategoryPieChart.tsx` | Recharts PieChart | `CategorySpend[]` prop |
| `BudgetProgressBar.tsx` | Pure CSS | `budgeted` + `spent` props → calls `computeBudgetProgress` |

### `components/dashboard/` — Dashboard Widgets
| File | Data source | Visual |
|---|---|---|
| `BalanceCard.tsx` | `useTransactionStore` → `computeAnalytics` | 3-stat grid + savings rate badge |
| `SpendingTrendChart.tsx` | `MOCK_MONTHLY_TREND` | 6-month area chart wrapper |
| `CategoryBreakdown.tsx` | `MOCK_CATEGORY_SPEND` | Pie chart + legend list |
| `RecentTransactions.tsx` | `useTransactionStore` | Latest 6 transactions |
| `FinancialHealthScore.tsx` | `MOCK_HEALTH_SCORE` | SVG ring score + dimension bars |
| `AIInsightsPanel.tsx` | `useAIStore.insights` | Expandable insight cards |

### `components/ai/` — Conversational AI
| File | Role |
|---|---|
| `ChatInterface.tsx` | Full chat UI — message list, input, suggested questions, send |
| `AssistantMessage.tsx` | Renders one message (user right-aligned, AI left with icon) |
| `TypingIndicator.tsx` | Animated 3-dot bounce while AI is responding |

### `components/transactions/` — Transaction Management
| File | Role |
|---|---|
| `TransactionItem.tsx` | One row: icon, title, merchant, amount, type badge, delete |
| `AddTransactionModal.tsx` | Dialog form: type tabs, amount, date, category, merchant |
| `TransactionFilters.tsx` | Search + type select + category select |

### `components/budgets/` — Budget Management
| File | Role |
|---|---|
| `BudgetCard.tsx` | Category card with progress bar, AI badge, status, edit button |
| `EditBudgetModal.tsx` | Simple dialog to update a budget's monthly limit |

---

## `/data` — Mock Data

### `data/mockData.ts`
| Export | Type | Contents |
|---|---|---|
| `CATEGORY_META` | `Record<string, {label, color, icon, bg}>` | Style config for all 11 categories |
| `MOCK_TRANSACTIONS` | `Transaction[]` | 20 realistic transactions for May 2026 |
| `MOCK_BUDGETS` | `Budget[]` | 8 category budgets (4 AI-recommended) |
| `MOCK_INSIGHTS` | `AIInsight[]` | 6 AI insights (warnings, tips, achievements, predictions) |
| `MOCK_MONTHLY_TREND` | `MonthlyTrend[]` | 6-month income/expense/savings data |
| `MOCK_CATEGORY_SPEND` | `CategorySpend[]` | Spending breakdown by category |
| `MOCK_HEALTH_SCORE` | `FinancialHealthScore` | Overall score + 4 dimensions + tips |
| `SAMPLE_CHAT_MESSAGES` | `ChatMessage[]` | Initial welcome message for chat |
| `SUGGESTED_QUESTIONS` | `string[]` | 6 suggested chat prompts |
| `MOCK_AI_RESPONSES` | `Record<string, string>` | Keyword-matched mock AI responses |

---

## `/services` — External Integrations

### `services/ai/aiService.ts`
```
AIService class
├── chat(request)          → uses mock or live OpenRouter
├── mockResponse()         → keyword matches prompt → MOCK_AI_RESPONSES
├── liveResponse()         → POST to OpenRouter /chat/completions
├── generateInsights()     → wraps chat() with insight prompt
│
AI_MODELS = {
  fast:     'openai/gpt-4o-mini'
  balanced: 'anthropic/claude-3-5-haiku'   ← default
  powerful: 'anthropic/claude-sonnet-4-5'
}
aiService                  → singleton instance, exported
```

### `services/supabase/`
| File | Role |
|---|---|
| `client.ts` | `supabase` singleton with no-op storage (SSR-safe) |
| `auth.ts` | `signInWithEmail`, `signUpWithEmail`, `signOut`, `getSession` |
| `transactions.ts` | `fetchTransactions`, `insertTransaction`, `deleteTransaction` — mock-first |
| `schema.sql` | Paste into Supabase SQL editor to create tables + RLS policies |

---

## `/store` — Global State (`store/index.ts`)

| Store | State | Key actions |
|---|---|---|
| `useAuthStore` | `user`, `isLoading`, `isAuthenticated` | `signIn`, `signUp`, `signOut` |
| `useTransactionStore` | `transactions[]` | `addTransaction`, `deleteTransaction` |
| `useBudgetStore` | `budgets[]` | `updateBudget` |
| `useAIStore` | `messages[]`, `insights[]`, `isTyping` | `addMessage`, `setTyping`, `clearChat` |
| `useUIStore` | `sidebarOpen`, `addTransactionOpen` | `toggleSidebar`, `setAddTransactionOpen` |

---

## `/types` — TypeScript Interfaces (`types/index.ts`)

```typescript
Transaction          { id, userId, title, amount, type, category, date, merchant?, tags? }
Budget               { id, userId, category, budgeted, spent, period, aiRecommended?, color, icon }
AIInsight            { id, type, title, description, category?, actionable?, priority, createdAt }
ChatMessage          { id, role, content, timestamp, isLoading? }
AIRequest            { prompt, context?, model? }
AIResponse           { content, model, tokensUsed? }
CategorySpend        { category, amount, percentage, color }
MonthlyTrend         { month, income, expenses, savings }
SpendingAnalytics    { totalIncome, totalExpenses, netSavings, savingsRate, topCategories, monthlyTrend }
HealthScoreDimension { label, score, description }
FinancialHealthScore { overall, dimensions[], trend, explanation, tips[] }
User                 { id, email, name, avatar?, createdAt }
ToastMessage         { id, title, description?, variant }

TransactionCategory = 'housing'|'food'|'transport'|'entertainment'|'shopping'|
                      'utilities'|'healthcare'|'education'|'savings'|'income'|'other'
TransactionType     = 'income' | 'expense'
InsightType         = 'warning' | 'tip' | 'achievement' | 'prediction'
InsightPriority     = 'low' | 'medium' | 'high'
```

---

## `/utils` — Pure Functions

### `utils/formatters.ts`
| Function | Output example |
|---|---|
| `formatCurrency(n)` | `$1,234.56` |
| `formatCurrencyCompact(n)` | `$1.2k` |
| `formatPercentage(n)` | `18.7%` |
| `formatDate(str)` | `May 16, 2026` |
| `formatDateShort(str)` | `May 16` |
| `formatRelativeTime(str)` | `3m ago` |
| `capitalize(str)` | `Hello` |
| `truncate(str, n)` | `Hello…` |

### `utils/analytics.ts`
| Function | Returns |
|---|---|
| `computeAnalytics(transactions[])` | `SpendingAnalytics` — totals, savings rate, top categories |
| `computeBudgetProgress(budgeted, spent)` | `number` — 0-100 percentage |
| `getBudgetStatus(budgeted, spent)` | `'safe'` / `'warning'` / `'danger'` |

---

## Config Files

| File | Purpose |
|---|---|
| `tailwind.config.ts` | Dark theme colors (HSL vars), custom animations (fade-in, shimmer, float), system font stack |
| `app/globals.css` | CSS custom properties, `.glass`, `.gradient-text`, `.hero-gradient`, scrollbar styles |
| `next.config.ts` | Image remote patterns (GitHub, Google avatars) |
| `instrumentation.ts` | Patches broken `localStorage` in Claude Code dev environment |
| `.env.local.example` | Template for Supabase + OpenRouter + app URL keys |
