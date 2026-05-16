# 🧩 Component Reference

> Props, usage examples, and extension notes for every component.

---

## shadcn/ui Primitives

### `<Button>`
```tsx
<Button variant="default|outline|ghost|gradient|glass|destructive|link" size="default|sm|lg|xl|icon">
```
- `variant="gradient"` — indigo→violet gradient, use for primary CTAs
- `variant="glass"` — glassmorphism surface, use inside glass cards
- `size="icon"` → 36×36px square, `size="icon-sm"` → 28×28px

### `<Badge>`
```tsx
<Badge variant="default|success|warning|destructive|info|outline|secondary">
```
- `success` → emerald, `warning` → amber, `destructive` → rose

### `<Progress>`
```tsx
<Progress value={75} indicatorClassName="bg-emerald-500" />
```

### `<Dialog>`
```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Subtitle</DialogDescription>
    </DialogHeader>
    {/* form content */}
    <DialogFooter>
      <Button variant="ghost">Cancel</Button>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### `<Select>`
```tsx
<Select value={val} onValueChange={setVal}>
  <SelectTrigger><SelectValue placeholder="Choose..." /></SelectTrigger>
  <SelectContent>
    <SelectItem value="food">Food</SelectItem>
  </SelectContent>
</Select>
```

---

## Layout Components

### `<Sidebar>`
**Location:** `components/layout/Sidebar.tsx`

Auto-collapses to icon-only mode. Width transitions between `w-60` (open) and `w-[72px]` (collapsed).
- Reads `useUIStore.sidebarOpen`
- Reads `useAuthStore.user` for name/email/initials
- Active route detected via `usePathname()`
- Tooltip shown for nav items when collapsed

**To add a nav item:**
```typescript
// In Sidebar.tsx, add to NAV_ITEMS array:
{ href: '/new-page', label: 'New Page', icon: SomeIcon }
```

### `<TopBar>`
**Location:** `components/layout/TopBar.tsx`

Reads current path and maps to `PAGE_TITLES`. Add entries there when adding new pages.
```typescript
const PAGE_TITLES = {
  '/new-page': { title: 'New Page', subtitle: 'Description' },
  ...
}
```

---

## Common Components

### `<GlassCard>`
**Location:** `components/common/GlassCard.tsx`

```tsx
<GlassCard glow="indigo" hover shine className="p-6">
  content
</GlassCard>
```
- `glow` → adds colored box-shadow ring: `"indigo" | "emerald" | "rose" | "none"`
- `hover` → enables hover brightness transition (default `true`)
- `shine` → adds a left-to-right shimmer on hover

### `<StatCard>`
**Location:** `components/common/StatCard.tsx`

```tsx
<StatCard
  label="Total Income"
  value="$7,700"
  trend="up"
  trendValue="+12% vs last month"
  icon={<TrendingUp />}
  iconBg="bg-emerald-500/15"
  accentColor="text-emerald-400"
/>
```

---

## Chart Components

### `<TrendLineChart>`
**Location:** `components/charts/TrendLineChart.tsx`

```tsx
<TrendLineChart data={customData} height={220} />
// data shape: Array<{ month: string, income: number, expenses: number, savings: number }>
```
Omit `data` to use `MOCK_MONTHLY_TREND`.

### `<CategoryPieChart>`
**Location:** `components/charts/CategoryPieChart.tsx`

```tsx
<CategoryPieChart data={categorySpendArray} size={160} />
// data shape: CategorySpend[]  { category, amount, percentage, color }
```

### `<BudgetProgressBar>`
**Location:** `components/charts/BudgetProgressBar.tsx`

```tsx
<BudgetProgressBar budgeted={500} spent={375} showLabel />
```
Auto-colors: ≥90% → rose, ≥75% → amber, <75% → indigo.

---

## Dashboard Widgets

### `<BalanceCard>`
Reads from `useTransactionStore` and calls `computeAnalytics()`.
Full-width card. Shows net savings, savings rate, income, expenses.
**No props** — self-contained.

### `<FinancialHealthScore>`
Reads `MOCK_HEALTH_SCORE`. SVG ring with dimension progress bars.
**To make dynamic:** accept a `score: FinancialHealthScore` prop and compute it from transactions.

### `<AIInsightsPanel>`
Reads `useAIStore.insights`. Sorts by priority (high first). Shows top 4.
**Each insight is expandable** — click to see `actionable` field.

---

## AI Components

### `<ChatInterface>`
**Location:** `components/ai/ChatInterface.tsx`

Full chat UI. Calls `aiService.chat()` on send. Handles:
- `Enter` to send, `Shift+Enter` for new line
- Typing indicator while AI responds
- Suggested questions when conversation is fresh
- Clear chat button

**To add suggested questions:** edit `SUGGESTED_QUESTIONS` in `data/mockData.ts`.

### `<AssistantMessage>`
Renders markdown inline: `**bold**` → `<strong>`, `\n\n` → paragraph breaks.
User messages right-aligned, AI messages left with icon.

---

## Transaction Components

### `<AddTransactionModal>`
Controlled by `useUIStore.addTransactionOpen`. Auto-resets on close.
Fields: type (expense/income tab), title, amount, date, category (expenses only), merchant.

**To add a field:** add state, an Input/Select in the form, include in `addTransaction()` call.

### `<TransactionItem>`
```tsx
<TransactionItem transaction={txn} showDelete={true} />
```
Shows category icon (pulled from `CATEGORY_META`), delete button on hover.

### `<TransactionFilters>`
Controlled component. All filter state lives in the parent page.
```tsx
<TransactionFilters
  search={s} onSearch={setS}
  filter={cat} onFilter={setCat}
  typeFilter={type} onTypeFilter={setType}
/>
```

---

## Budget Components

### `<BudgetCard>`
```tsx
<BudgetCard budget={budget} onEdit={(b) => setEditing(b)} />
```
Shows AI badge if `budget.aiRecommended === true`. Edit button appears on hover.

### `<EditBudgetModal>`
```tsx
<EditBudgetModal budget={editingBudget} open={!!editingBudget} onClose={() => setEditing(null)} />
```
Calls `useBudgetStore.updateBudget()` on save.
