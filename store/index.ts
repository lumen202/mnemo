import { create } from 'zustand'
import type { StudyMaterial, Subject, ChatMessage, ChatSession, User, AIInsight, Flashcard, Quiz, StudySession, StudyGoal } from '@/types'
import {
  MOCK_MATERIALS,
  MOCK_SUBJECTS,
  MOCK_INSIGHTS,
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
  signIn: (email: string, password: string, rememberMe: boolean) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isSigningOut: false,

  signIn: async (email, password, rememberMe) => {
    set({ isLoading: true })
    try {
      const maxAge = rememberMe ? `; max-age=${60 * 60 * 24 * 7}` : ''
      if (isSupabaseConfigured()) {
        const data = await signInWithEmail(email, password)
        const user = data.user
        document.cookie = `mnemo_session=${data.session?.access_token ?? 'supabase'}; path=/; SameSite=Lax${maxAge}`
        set({
          isLoading: false,
          isAuthenticated: true,
          user: user
            ? { id: user.id, email: user.email ?? email, name: user.user_metadata?.name ?? email.split('@')[0], createdAt: user.created_at }
            : null,
        })
      } else {
        await new Promise((r) => setTimeout(r, 800))
        document.cookie = `mnemo_session=demo; path=/; SameSite=Lax${maxAge}`
        set({
          isLoading: false,
          isAuthenticated: true,
          user: { id: 'user_demo', email, name: email.split('@')[0], createdAt: new Date().toISOString() },
        })
      }
    } catch (err) {
      set({ isLoading: false })
      throw err
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
    document.cookie = 'mnemo_session=; path=/; max-age=0; SameSite=Lax'
    set({ user: null, isAuthenticated: false, isLoading: false, isSigningOut: false })
    useAIStore.getState().reset()
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
    const userId = useAuthStore.getState().user?.id ?? 'user_demo'
    const tempId = `mat_${Date.now()}`
    set((state) => ({
      materials: [{ ...m, id: tempId, userId }, ...state.materials],
    }))
    if (isSupabaseConfigured()) {
      await insertMaterial(userId, m)
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
      try {
        const data = await fetchFlashcards(userId)
        set({ flashcards: data, isLoading: false })
      } catch {
        set({ flashcards: [], isLoading: false })
      }
    } else {
      set({ flashcards: [], isLoading: false })
    }
  },

  addFlashcard: async (f) => {
    const userId = useAuthStore.getState().user?.id ?? 'user_demo'
    set((state) => ({
      flashcards: [{ ...f, id: `fc_${Date.now()}`, userId }, ...state.flashcards],
    }))
    if (isSupabaseConfigured()) {
      await insertFlashcard(userId, f)
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
      set({ quizzes: [], isLoading: false })
    }
  },

  setActiveQuiz: (quiz) => set({ activeQuiz: quiz }),

  addQuiz: async (q) => {
    const userId = useAuthStore.getState().user?.id ?? 'user_demo'
    set((state) => ({ quizzes: [q, ...state.quizzes] }))
    if (isSupabaseConfigured()) {
      await insertQuiz(userId, {
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
    const userId = useAuthStore.getState().user?.id ?? 'user_demo'
    set((state) => ({
      sessions: [{ ...s, id: `ses_${Date.now()}`, userId }, ...state.sessions],
    }))
    if (isSupabaseConfigured()) {
      await insertSession(userId, s)
    }
  },

  updateGoal: async (id, updates) => {
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    }))
  },
}))

// ─── AI / Chat Store ───────────────────────────────────────────────────────────

const INITIAL_SESSION_ID = 'session_initial'
const INITIAL_SESSION: ChatSession = {
  id: INITIAL_SESSION_ID,
  title: 'Getting Started',
  createdAt: new Date().toISOString(),
  messages: SAMPLE_CHAT_MESSAGES,
}

interface AIState {
  sessions: ChatSession[]
  activeSessionId: string
  messages: ChatMessage[]       // mirrors active session — kept for component compat
  insights: AIInsight[]
  isTyping: boolean
  addMessage: (msg: ChatMessage) => void
  updateMessage: (id: string, content: string) => void
  setTyping: (v: boolean) => void
  clearChat: () => void
  newSession: () => void
  switchSession: (id: string) => void
  deleteSession: (id: string) => void
  loadInsights: (userId: string) => Promise<void>
  reset: () => void
}

export const useAIStore = create<AIState>((set) => ({
  sessions: [INITIAL_SESSION],
  activeSessionId: INITIAL_SESSION_ID,
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
    set((state) => {
      const updated = [...state.messages, msg]
      // Auto-title new sessions from the first user message
      const sessions = state.sessions.map((s) => {
        if (s.id !== state.activeSessionId) return s
        const title =
          s.title === 'New Chat' && msg.role === 'user'
            ? msg.content.slice(0, 42) + (msg.content.length > 42 ? '…' : '')
            : s.title
        return { ...s, messages: updated, title }
      })
      return { messages: updated, sessions }
    }),

  updateMessage: (id, content) =>
    set((state) => {
      const updated = state.messages.map((m) => (m.id === id ? { ...m, content } : m))
      const sessions = state.sessions.map((s) =>
        s.id === state.activeSessionId ? { ...s, messages: updated } : s
      )
      return { messages: updated, sessions }
    }),

  setTyping: (isTyping) => set({ isTyping }),

  clearChat: () =>
    set((state) => ({
      messages: [],
      sessions: state.sessions.map((s) =>
        s.id === state.activeSessionId ? { ...s, messages: [] } : s
      ),
    })),

  newSession: () =>
    set((state) => {
      const id = `session_${Date.now()}`
      const fresh: ChatSession = { id, title: 'New Chat', createdAt: new Date().toISOString(), messages: [] }
      return { sessions: [...state.sessions, fresh], activeSessionId: id, messages: [] }
    }),

  switchSession: (id) =>
    set((state) => {
      const session = state.sessions.find((s) => s.id === id)
      if (!session) return state
      return { activeSessionId: id, messages: session.messages }
    }),

  deleteSession: (id) =>
    set((state) => {
      const remaining = state.sessions.filter((s) => s.id !== id)
      if (remaining.length === 0) {
        const newId = `session_${Date.now()}`
        const fresh: ChatSession = { id: newId, title: 'New Chat', createdAt: new Date().toISOString(), messages: [] }
        return { sessions: [fresh], activeSessionId: newId, messages: [] }
      }
      if (id === state.activeSessionId) {
        const next = remaining[remaining.length - 1]
        return { sessions: remaining, activeSessionId: next.id, messages: next.messages }
      }
      return { sessions: remaining }
    }),

  reset: () =>
    set({
      sessions: [
        {
          id: 'session_initial',
          title: 'Getting Started',
          createdAt: new Date().toISOString(),
          messages: SAMPLE_CHAT_MESSAGES,
        },
      ],
      activeSessionId: 'session_initial',
      messages: SAMPLE_CHAT_MESSAGES,
      insights: [],
      isTyping: false,
    }),
}))

// ─── UI Store ──────────────────────────────────────────────────────────────────

export type Theme = 'dark' | 'light'

interface UIState {
  sidebarOpen: boolean
  isMobile: boolean
  addMaterialOpen: boolean
  theme: Theme
  toggleSidebar: () => void
  setSidebarOpen: (v: boolean) => void
  setIsMobile: (v: boolean) => void
  setAddMaterialOpen: (v: boolean) => void
  setTheme: (t: Theme) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  isMobile: false,
  addMaterialOpen: false,
  theme: 'dark',
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setIsMobile: (isMobile) => set({ isMobile }),
  setAddMaterialOpen: (addMaterialOpen) => set({ addMaterialOpen }),
  setTheme: (theme) => set({ theme }),
}))
