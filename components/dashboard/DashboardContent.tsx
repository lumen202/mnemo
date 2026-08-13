'use client'
import { useAuthStore, useStudyMaterialStore, useStudySessionStore, useFlashcardStore, useQuizStore, useUIStore } from '@/store'
import { DashboardWelcome } from '@/components/dashboard/DashboardWelcome'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { StudyStatsCard } from '@/components/dashboard/StudyStatsCard'
import { StudyProgressChart } from '@/components/dashboard/StudyProgressChart'
import { SubjectBreakdown } from '@/components/dashboard/SubjectBreakdown'
import { RecentMaterials } from '@/components/dashboard/RecentMaterials'
import { LearningScore } from '@/components/dashboard/LearningScore'
import { LearningInsightsPanel } from '@/components/dashboard/AIInsightsPanel'
import { ReviewForecast } from '@/components/dashboard/ReviewForecast'

export function DashboardContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore()
  const { materials } = useStudyMaterialStore()
  const { sessions } = useStudySessionStore()
  const { flashcards } = useFlashcardStore()
  const { quizzes } = useQuizStore()
  const storesHydrated = useUIStore((s) => s.storesHydrated)

  // storesHydrated is set by HydrateStores once its Promise.all of every load
  // call has actually resolved — not inferred from a per-store isLoading flag,
  // which for a fast/empty account can flip true→false within a single React
  // batch and never be visible to a render here at all (see the comment on
  // storesHydrated in store/index.ts — this replaced exactly that kind of
  // heuristic after it hung the empty account on this loader forever).
  if (authLoading || (isAuthenticated && !storesHydrated)) {
    return <PageLoader />
  }

  const isNewAccount =
    materials.length === 0 && sessions.length === 0 && flashcards.length === 0 && quizzes.length === 0

  if (isNewAccount) {
    return <DashboardWelcome />
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Top row — study overview */}
      <div className="grid grid-cols-1 gap-5">
        <StudyStatsCard />
      </div>

      {/* Review load — what the schedule is asking of you this fortnight */}
      <ReviewForecast />

      {/* Middle row — chart + learning score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <StudyProgressChart />
        </div>
        <div>
          <LearningScore />
        </div>
      </div>

      {/* Bottom row — subjects + materials + insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div>
          <SubjectBreakdown />
        </div>
        <div>
          <RecentMaterials />
        </div>
        <div>
          <LearningInsightsPanel />
        </div>
      </div>
    </div>
  )
}
