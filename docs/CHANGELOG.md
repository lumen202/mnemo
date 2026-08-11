# 📋 Changelog

> Every change made to the codebase, in reverse chronological order.

---

## Session 1 — May 16, 2026 — Full MVP Build

### Initial scaffold
- Created complete project directory structure
- `package.json` with all dependencies (Next.js 15, Zustand 5, Recharts, Supabase, Radix UI, shadcn)
- `tsconfig.json`, `postcss.config.js`
- `tailwind.config.ts` — dark theme HSL CSS variables, custom animations (fade-in, shimmer, float, gradient-shift), system font stack

### Types
- `types/index.ts` — 13 interfaces: Transaction, Budget, AIInsight, ChatMessage, AIRequest/Response, CategorySpend, MonthlyTrend, SpendingAnalytics, FinancialHealthScore, User, ToastMessage

### Mock data
- `data/mockData.ts` — complete mock dataset:
  - 20 realistic transactions (May 2026)
  - 8 category budgets (4 AI-recommended)
  - 6 AI insights (2 warnings, 2 tips, 2 achievements)
  - 6-month trend data
  - Category spend breakdown
  - Financial health score with 4 dimensions
  - 5 mock AI responses (keyword-matched)
  - Sample chat + 6 suggested questions
  - `CATEGORY_META` with colors, icons, bg for all 11 categories

### Utils
- `utils/formatters.ts` — `formatCurrency`, `formatCurrencyCompact`, `formatPercentage`, `formatDate`, `formatDateShort`, `formatRelativeTime`, `capitalize`, `truncate`
- `utils/analytics.ts` — `computeAnalytics`, `computeBudgetProgress`, `getBudgetStatus`
- `lib/utils.ts` — `cn()` (clsx + tailwind-merge)

### Services
- `services/ai/aiService.ts` — OpenRouter integration with keyword-matched mock fallback, `AI_MODELS` registry
- `services/supabase/client.ts` — SSR-safe client with no-op in-memory storage
- `services/supabase/auth.ts` — `signInWithEmail`, `signUpWithEmail`, `signOut`, `getSession`
- `services/supabase/transactions.ts` — mock-first CRUD (fetch, insert, delete)
- `supabase/migrations/` — full schema with RLS policies (a duplicate `services/supabase/schema.sql` was removed 2026-08-11; it had drifted and carried no RLS)

### State management
- `store/index.ts` — 5 Zustand stores: `useAuthStore`, `useTransactionStore`, `useBudgetStore`, `useAIStore`, `useUIStore`

### shadcn/ui primitives (14 components)
- `button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `badge.tsx`
- `progress.tsx`, `dialog.tsx`, `tabs.tsx`, `select.tsx`
- `avatar.tsx`, `separator.tsx`, `textarea.tsx`, `scroll-area.tsx`, `dropdown-menu.tsx`

### Layout components
- `components/layout/Sidebar.tsx` — collapsible sidebar, active route, user section, collapse toggle
- `components/layout/TopBar.tsx` — page title/subtitle, search, bell, Add Transaction button

### Common components
- `components/common/GlassCard.tsx` — glass surface with optional glow, hover, shine
- `components/common/StatCard.tsx` — metric card with trend indicator
- `components/common/LoadingSpinner.tsx` + `PageLoader`

### Chart components
- `components/charts/TrendLineChart.tsx` — Recharts AreaChart with custom tooltip
- `components/charts/CategoryPieChart.tsx` — Recharts PieChart with custom tooltip
- `components/charts/BudgetProgressBar.tsx` — deterministic CSS bar with auto-status colors

### Dashboard components
- `components/dashboard/BalanceCard.tsx` — 3-stat grid + savings rate badge
- `components/dashboard/SpendingTrendChart.tsx` — 6-month area chart wrapper
- `components/dashboard/CategoryBreakdown.tsx` — pie + legend
- `components/dashboard/RecentTransactions.tsx` — latest 6 with category icons
- `components/dashboard/FinancialHealthScore.tsx` — SVG ring + dimension progress bars
- `components/dashboard/AIInsightsPanel.tsx` — expandable insight cards sorted by priority

### AI components
- `components/ai/ChatInterface.tsx` — full chat with suggested questions, markdown, clear
- `components/ai/AssistantMessage.tsx` — renders user/AI messages with markdown
- `components/ai/TypingIndicator.tsx` — animated 3-dot bounce

### Transaction components
- `components/transactions/TransactionItem.tsx` — row with icon, delete on hover
- `components/transactions/AddTransactionModal.tsx` — full modal form
- `components/transactions/TransactionFilters.tsx` — search + type + category filters

### Budget components
- `components/budgets/BudgetCard.tsx` — progress bar card with AI badge, edit button
- `components/budgets/EditBudgetModal.tsx` — simple budget amount editor

### Pages
- `app/globals.css` — CSS variables, glass utilities, gradients, scrollbar
- `app/layout.tsx` — root HTML shell
- `app/page.tsx` — landing page (hero, features, stats, testimonials, CTA, footer)
- `app/auth/login/page.tsx` — login form with demo hint
- `app/auth/signup/page.tsx` — signup with perk list
- `app/(dashboard)/layout.tsx` — sidebar + topbar + modal shell
- `app/(dashboard)/dashboard/page.tsx` — 3-row grid layout
- `app/(dashboard)/transactions/page.tsx` — stats + filterable table
- `app/(dashboard)/budgets/page.tsx` — AI banner + overview + card grid
- `app/(dashboard)/assistant/page.tsx` — chat 2/3 + sidebar 1/3

### Bug fixes
- `instrumentation.ts` — patches broken `localStorage` injected by Claude Code dev environment (SSR safe, no-op in production)
- `services/supabase/client.ts` — replaced native localStorage with in-memory Map to prevent SSR crashes from `localStorage.getItem is not a function`
- `app/layout.tsx` — removed `next/font/google` (requires network) → system font stack
- `tailwind.config.ts` — added explicit system font family
- `npm install autoprefixer` — missing postcss dependency
- `npm install @radix-ui/react-scroll-area` — missing Radix package

### Documentation
- `docs/MIND_PALACE.md` — master index
- `docs/CODEBASE_MAP.md` — every file with purpose and shape
- `docs/ARCHITECTURE.md` — system design and data flow diagrams
- `docs/COMPONENTS.md` — component API reference
- `docs/AI_SYSTEM.md` — AI layer deep dive
- `docs/DATA_LAYER.md` — types, stores, Supabase activation guide
- `docs/CHANGELOG.md` — this file
- `docs/ROADMAP.md` — planned features with implementation guides
