import { create } from 'zustand'
import type { StudyMaterial, Subject, ChatMessage, User, AIInsight, Flashcard, Quiz, StudySession, StudyGoal } from '@/types'
import {
  MOCK_MATERIALS,
  MOCK_SUBJECTS,
  MOCK_INSIGHTS,
  MOCK_FLASHCARDS,
  MOCK_QUIZZES,
  MOCK_SESSIONS,
  MOCK_GOALS,
  SAMPLE_CHAT_MESSAGES,
} from '@/data/mockData'
import { signInWithEmail, signUpWithEmail, signOut as supabaseSignOut, getSession } from '@/services/supabase/auth'
import { isSupabaseConfigured } from '@/lib/env'
import {
  getSubjects as fetchSubjects,
  getMaterials as fetchMaterials,
  getFlashcards as fetchFlashcards,
  getQuizzes as fetchQuizzes,
  getSessions as fetchSessions,
  getGoals as fetchGoals,
  getInsights as fetchInsights,
  createMaterial as insertMaterial,
  updateMaterial as editMaterial,
  deleteMaterial as removeMaterial,
  createFlashcard as insertFlashcard,
  updateFlashcard as editFlashcard,
  deleteFlashcard as removeFlashcard,
  createQuiz as insertQuiz,
  updateQuizScore as setQuizScore,
  createSession as insertSession,
  deleteSubject as removeSubject,
} from '@/services/supabase/repository'

// ─── Auth Store ────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isSigningOut: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isSigningOut: false,

  signIn: async (email, password) => {
    set({ isLoading: true })
    if (isSupabaseConfigured()) {
      const data = await signInWithEmail(email, password)
      const user = data.user
      document.cookie = `mnemo_session=${data.session?.access_token ?? 'supabase'}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
      set({
        isLoading: false,
        isAuthenticated: true,
        user: user
          ? { id: user.id, email: user.email ?? email, name: user.user_metadata?.name ?? email.split('@')[0], createdAt: user.created_at }
          : null,
      })
    } else {
      await new Promise((r) => setTimeout(r, 800))
      document.cookie = `mnemo_session=demo; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
      set({
        isLoading: false,
        isAuthenticated: true,
        user: { id: 'user_demo', email, name: email.split('@')[0], createdAt: new Date().toISOString() },
      })
    }
  },

  signUp: async (email, password, name) => {
    set({ isLoading: true })
    if (isSupabaseConfigured()) {
      const data = await signUpWithEmail(email, password, name)
      const user = data.user
      document.cookie = `mnemo_session=${data.session?.access_token ?? 'supabase'}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
      set({
        isLoading: false,
        isAuthenticated: true,
        user: user
          ? { id: user.id, email: user.email ?? email, name: user.user_metadata?.name ?? name, createdAt: user.created_at }
          : null,
      })
    } else {
      await new Promise((r) => setTimeout(r, 1000))
      document.cookie = `mnemo_session=demo; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
      set({
        isLoading: false,
        isAuthenticated: true,
        user: { id: `user_${Date.now()}`, email, name, createdAt: new Date().toISOString() },
      })
    }
  },

  signOut: async () => {
    set({ isSigningOut: true })
    if (isSupabaseConfigured()) {
      await supabaseSignOut()
    }
    document.cookie = 'mnemo_session=; path=/; max-age=0'
    set({ user: null, isAuthenticated: false, isLoading: false, isSigningOut: false })
  },

  hydrate: async () => {
    if (!isSupabaseConfigured()) {
      set({
        user: { id: 'user_demo', email: 'alex@mnemo.app', name: 'Alex Johnson', createdAt: '2025-01-15T00:00:00Z' },
        isAuthenticated: true,
        isLoading: false,
      })
      return
    }
    const session = await getSession()
    if (session?.user) {
      set({
        isAuthenticated: true,
        isLoading: false,
        user: { id: session.user.id, email: session.user.email ?? '', name: session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? '', createdAt: session.user.created_at },
      })
    } else {
      set({ isLoading: false })
    }
  },
}))

// ─── Study Material Store ──────────────────────────────────────────────────────

interface StudyMaterialState {
  materials: StudyMaterial[]
  isLoading: boolean
  addMaterial: (m: Omit<StudyMaterial, 'id' | 'userId'>) => Promise<void>
  deleteMaterial: (id: string) => Promise<void>
  updateMaterial: (id: string, updates: Partial<StudyMaterial>) => Promise<void>
  setMaterials: (m: StudyMaterial[]) => void
  loadMaterials: (userId: string) => Promise<void>
}

export const useStudyMaterialStore = create<StudyMaterialState>((set) => ({
  materials: [],
  isLoading: false,

  loadMaterials: async (userId) => {
    set({ isLoading: true })
    if (isSupabaseConfigured()) {
      const data = await fetchMaterials(userId)
      set({ materials: data, isLoading: false })
    } else {
      set({ materials: MOCK_MATERIALS, isLoading: false })
    }
  },

  addMaterial: async (m) => {
    const tempId = `mat_${Date.now()}`
    set((state) => ({
      materials: [{ ...m, id: tempId, userId: 'user_demo' }, ...state.materials],
    }))
    if (isSupabaseConfigured()) {
      await insertMaterial('user_demo', m)
    }
  },

  deleteMaterial: async (id) => {
    set((state) => ({ materials: state.materials.filter((m) => m.id !== id) }))
    if (isSupabaseConfigured()) {
      await removeMaterial(id)
    }
  },

  updateMaterial: async (id, updates) => {
    set((state) => ({
      materials: state.materials.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }))
    if (isSupabaseConfigured()) {
      await editMaterial(id, updates)
    }
  },

  setMaterials: (materials) => set({ materials }),
}))

// ─── Subject Store ─────────────────────────────────────────────────────────────

interface SubjectState {
  subjects: Subject[]
  isLoading: boolean
  updateSubject: (id: string, updates: Partial<Subject>) => Promise<void>
  setSubjects: (s: Subject[]) => void
  loadSubjects: (userId: string) => Promise<void>
  deleteSubject: (id: string) => Promise<void>
}

export const useSubjectStore = create<SubjectState>((set) => ({
  subjects: [],
  isLoading: false,

  loadSubjects: async (userId) => {
    set({ isLoading: true })
    if (isSupabaseConfigured()) {
      const data = await fetchSubjects(userId)
      set({ subjects: data, isLoading: false })
    } else {
      set({ subjects: MOCK_SUBJECTS, isLoading: false })
    }
  },

  updateSubject: async (id, updates) => {
    set((state) => ({
      subjects: state.subjects.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }))
  },

  setSubjects: (subjects) => set({ subjects }),

  deleteSubject: async (id) => {
    set((state) => ({ subjects: state.subjects.filter((s) => s.id !== id) }))
    if (isSupabaseConfigured()) {
      await removeSubject(id)
    }
  },
}))

// ─── Flashcard Store ───────────────────────────────────────────────────────────

interface FlashcardState {
  flashcards: Flashcard[]
  isLoading: boolean
  addFlashcard: (f: Omit<Flashcard, 'id' | 'userId'>) => Promise<void>
  deleteFlashcard: (id: string) => Promise<void>
  updateFlashcard: (id: string, updates: Partial<Flashcard>) => Promise<void>
  loadFlashcards: (userId: string) => Promise<void>
}

export const useFlashcardStore = create<FlashcardState>((set) => ({
  flashcards: [],
  isLoading: false,

  loadFlashcards: async (userId) => {
    set({ isLoading: true })
    if (isSupabaseConfigured()) {
      const data = await fetchFlashcards(userId)
      set({ flashcards: data, isLoading: false })
    } else {
      set({ flashcards: MOCK_FLASHCARDS, isLoading: false })
    }
  },

  addFlashcard: async (f) => {
    set((state) => ({
      flashcards: [{ ...f, id: `fc_${Date.now()}`, userId: 'user_demo' }, ...state.flashcards],
    }))
    if (isSupabaseConfigured()) {
      await insertFlashcard('user_demo', f)
    }
  },

  deleteFlashcard: async (id) => {
    set((state) => ({ flashcards: state.flashcards.filter((f) => f.id !== id) }))
    if (isSupabaseConfigured()) {
      await removeFlashcard(id)
    }
  },

  updateFlashcard: async (id, updates) => {
    set((state) => ({
      flashcards: state.flashcards.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    }))
    if (isSupabaseConfigured()) {
      await editFlashcard(id, updates)
    }
  },
}))

// ─── Quiz Store ────────────────────────────────────────────────────────────────

interface QuizState {
  quizzes: Quiz[]
  activeQuiz: Quiz | null
  isLoading: boolean
  setActiveQuiz: (quiz: Quiz | null) => void
  addQuiz: (q: Quiz) => Promise<void>
  updateQuizScore: (id: string, score: number) => Promise<void>
  loadQuizzes: (userId: string) => Promise<void>
}

export const useQuizStore = create<QuizState>((set) => ({
  quizzes: [],
  activeQuiz: null,
  isLoading: false,

  loadQuizzes: async (userId) => {
    set({ isLoading: true })
    if (isSupabaseConfigured()) {
      const data = await fetchQuizzes(userId)
      set({ quizzes: data, isLoading: false })
    } else {
      set({ quizzes: MOCK_QUIZZES, isLoading: false })
    }
  },

  setActiveQuiz: (quiz) => set({ activeQuiz: quiz }),

  addQuiz: async (q) => {
    set((state) => ({ quizzes: [q, ...state.quizzes] }))
    if (isSupabaseConfigured()) {
      await insertQuiz('user_demo', {
        subjectId: q.subjectId,
        title: q.title,
        questions: q.questions,
        totalQuestions: q.totalQuestions,
        materialId: q.materialId,
      })
    }
  },

  updateQuizScore: async (id, score) => {
    set((state) => ({
      quizzes: state.quizzes.map((q) =>
        q.id === id ? { ...q, score, completedAt: new Date().toISOString() } : q
      ),
    }))
    if (isSupabaseConfigured()) {
      await setQuizScore(id, score, new Date().toISOString())
    }
  },
}))

// ─── Study Session Store ───────────────────────────────────────────────────────

interface StudySessionState {
  sessions: StudySession[]
  goals: StudyGoal[]
  isLoading: boolean
  addSession: (s: Omit<StudySession, 'id' | 'userId'>) => Promise<void>
  updateGoal: (id: string, updates: Partial<StudyGoal>) => Promise<void>
  loadSessions: (userId: string) => Promise<void>
  loadGoals: (userId: string) => Promise<void>
}

export const useStudySessionStore = create<StudySessionState>((set) => ({
  sessions: [],
  goals: [],
  isLoading: false,

  loadSessions: async (userId) => {
    set({ isLoading: true })
    if (isSupabaseConfigured()) {
      const data = await fetchSessions(userId)
      set({ sessions: data, isLoading: false })
    } else {
      set({ sessions: MOCK_SESSIONS, isLoading: false })
    }
  },

  loadGoals: async (userId) => {
    if (isSupabaseConfigured()) {
      const data = await fetchGoals(userId)
      set({ goals: data })
    } else {
      set({ goals: MOCK_GOALS })
    }
  },

  addSession: async (s) => {
    set((state) => ({
      sessions: [{ ...s, id: `ses_${Date.now()}`, userId: 'user_demo' }, ...state.sessions],
    }))
    if (isSupabaseConfigured()) {
      await insertSession('user_demo', s)
    }
  },

  updateGoal: async (id, updates) => {
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    }))
  },
}))

// ─── AI / Chat Store ───────────────────────────────────────────────────────────

interface AIState {
  messages: ChatMessage[]
  insights: AIInsight[]
  isTyping: boolean
  addMessage: (msg: ChatMessage) => void
  setTyping: (v: boolean) => void
  clearChat: () => void
  loadInsights: (userId: string) => Promise<void>
}

export const useAIStore = create<AIState>((set) => ({
  messages: SAMPLE_CHAT_MESSAGES,
  insights: [],
  isTyping: false,

  loadInsights: async (userId) => {
    if (isSupabaseConfigured()) {
      const data = await fetchInsights(userId)
      set({ insights: data })
    } else {
      set({ insights: MOCK_INSIGHTS })
    }
  },

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  setTyping: (isTyping) => set({ isTyping }),

  clearChat: () => set({ messages: SAMPLE_CHAT_MESSAGES }),
}))

// ─── UI Store ──────────────────────────────────────────────────────────────────

export type Theme = 'dark' | 'light'

interface UIState {
  sidebarOpen: boolean
  addMaterialOpen: boolean
  theme: Theme
  toggleSidebar: () => void
  setSidebarOpen: (v: boolean) => void
  setAddMaterialOpen: (v: boolean) => void
  setTheme: (t: Theme) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  addMaterialOpen: false,
  theme: 'dark',
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setAddMaterialOpen: (addMaterialOpen) => set({ addMaterialOpen }),
  setTheme: (theme) => set({ theme }),
}))
