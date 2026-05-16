'use client'

import { useEffect } from 'react'
import { useAuthStore, useSubjectStore, useStudyMaterialStore, useFlashcardStore, useQuizStore, useStudySessionStore, useAIStore } from '@/store'

export function HydrateStores({ children }: { children: React.ReactNode }) {
  const { user, hydrate, isAuthenticated } = useAuthStore()
  const loadSubjects = useSubjectStore((s) => s.loadSubjects)
  const loadMaterials = useStudyMaterialStore((s) => s.loadMaterials)
  const loadFlashcards = useFlashcardStore((s) => s.loadFlashcards)
  const loadQuizzes = useQuizStore((s) => s.loadQuizzes)
  const loadSessions = useStudySessionStore((s) => s.loadSessions)
  const loadGoals = useStudySessionStore((s) => s.loadGoals)
  const loadInsights = useAIStore((s) => s.loadInsights)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (isAuthenticated && user) {
      loadSubjects(user.id)
      loadMaterials(user.id)
      loadFlashcards(user.id)
      loadQuizzes(user.id)
      loadSessions(user.id)
      loadGoals(user.id)
      loadInsights(user.id)
    }
  }, [isAuthenticated, user, loadSubjects, loadMaterials, loadFlashcards, loadQuizzes, loadSessions, loadGoals, loadInsights])

  return <>{children}</>
}
