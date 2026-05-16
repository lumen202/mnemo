# 🧠 WealthMind — Mind Palace

> Master index for the entire codebase. Every file, every feature, every decision.
> Start here to navigate anywhere.

---

## 📍 Quick Jump

| I want to… | Go to |
|---|---|
| See all files at a glance | [CODEBASE_MAP.md](./CODEBASE_MAP.md) |
| Understand the system design | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Look up a specific component | [COMPONENTS.md](./COMPONENTS.md) |
| Work on the AI layer | [AI_SYSTEM.md](./AI_SYSTEM.md) |
| Work on data / state / DB | [DATA_LAYER.md](./DATA_LAYER.md) |
| See what's been built | [CHANGELOG.md](./CHANGELOG.md) |
| Plan or implement a feature | [ROADMAP.md](./ROADMAP.md) |

---

## 🗺️ Project Root

```
wealthmind/
├── app/                    → Next.js App Router pages
├── components/             → All React components
├── data/                   → Mock data
├── services/               → External integrations (AI, Supabase)
├── store/                  → Zustand global state
├── types/                  → TypeScript interfaces
├── utils/                  → Pure utility functions
├── hooks/                  → (reserved for custom hooks)
├── actions/                → (reserved for server actions)
├── public/                 → Static assets
├── docs/                   → ← You are here
├── instrumentation.ts      → SSR localStorage patch
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🚀 Running the App

```bash
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint     # ESLint
```

**All 7 routes work with zero config** — the app runs entirely on mock data.

---

## ⚡ Key Conventions

| Convention | Rule |
|---|---|
| Client components | Must have `'use client'` at top |
| Server components | No directive needed (default) |
| State access | Always through Zustand stores in `store/index.ts` |
| Calculations | Always in `utils/analytics.ts` — never in AI service |
| AI responses | Always from `services/ai/aiService.ts` |
| Styling | Tailwind classes + custom utilities from `globals.css` |
| Mock data | Always from `data/mockData.ts` |

---

## 🔑 The Three Rules

1. **AI explains, math computes** — deterministic calculations in `utils/`, AI only for language
2. **Mock-first** — every service checks for placeholder credentials and falls back to mock data
3. **Glass everything** — use `.glass` + `border border-white/[0.07]` for all card surfaces
