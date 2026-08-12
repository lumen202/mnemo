'use client'
import { useRef } from 'react'
import { useAuthStore, useStudyMaterialStore, useStudySessionStore, useFlashcardStore, useQuizStore } from '@/store'
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
  const { materials, isLoading: materialsLoading } = useStudyMaterialStore()
  const { sessions, isLoading: sessionsLoading } = useStudySessionStore()
  const { flashcards, isLoading: flashcardsLoading } = useFlashcardStore()
  const { quizzes, isLoading: quizzesLoading } = useQuizStore()

  // Each store's isLoading starts false and only flips true once HydrateStores calls its
  // load action post-mount — so "not loading, arrays empty" is ambiguous between "confirmed
  // empty account" and "hasn't started loading yet," and trusting it too early flashes the
  // welcome screen for returning users with real data. Latch once any load is actually seen
  // in flight, so "empty" is only trusted after a real fetch has completed at least once.
  const anyDataLoading = materialsLoading || sessionsLoading || flashcardsLoading || quizzesLoading
  const hasLoadedOnceRef = useRef(false)
  if (anyDataLoading) hasLoadedOnceRef.current = true
  const stillHydrating = authLoading || (isAuthenticated && !hasLoadedOnceRef.current) || anyDataLoading

  if (stillHydrating) {
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
