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

// ─── Auth Store ────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, _password: string) => Promise<void>
  signUp: (email: string, _password: string, name: string) => Promise<void>
  signOut: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    id: 'user_demo',
    email: 'alex@mnemo.app',
    name: 'Alex Johnson',
    createdAt: '2025-01-15T00:00:00Z',
  },
  isLoading: false,
  isAuthenticated: true,

  signIn: async (email, _password) => {
    set({ isLoading: true })
    await new Promise((r) => setTimeout(r, 800))
    document.cookie = `mnemo_session=demo; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
    set({
      isLoading: false,
      isAuthenticated: true,
      user: {
        id: 'user_demo',
        email,
        name: email.split('@')[0],
        createdAt: new Date().toISOString(),
      },
    })
  },

  signUp: async (email, _password, name) => {
    set({ isLoading: true })
    await new Promise((r) => setTimeout(r, 1000))
    document.cookie = `mnemo_session=demo; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
    set({
      isLoading: false,
      isAuthenticated: true,
      user: {
        id: `user_${Date.now()}`,
        email,
        name,
        createdAt: new Date().toISOString(),
      },
    })
  },

  signOut: () => {
    document.cookie = 'mnemo_session=; path=/; max-age=0'
    set({ user: null, isAuthenticated: false })
  },
}))

// ─── Study Material Store ──────────────────────────────────────────────────────

interface StudyMaterialState {
  materials: StudyMaterial[]
  isLoading: boolean
  addMaterial: (m: Omit<StudyMaterial, 'id' | 'userId'>) => void
  deleteMaterial: (id: string) => void
  updateMaterial: (id: string, updates: Partial<StudyMaterial>) => void
  setMaterials: (m: StudyMaterial[]) => void
}

export const useStudyMaterialStore = create<StudyMaterialState>((set) => ({
  materials: MOCK_MATERIALS,
  isLoading: false,

  addMaterial: (m) =>
    set((state) => ({
      materials: [
        { ...m, id: `mat_${Date.now()}`, userId: 'user_demo' },
        ...state.materials,
      ],
    })),

  deleteMaterial: (id) =>
    set((state) => ({
      materials: state.materials.filter((m) => m.id !== id),
    })),

  updateMaterial: (id, updates) =>
    set((state) => ({
      materials: state.materials.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),

  setMaterials: (materials) => set({ materials }),
}))

// ─── Subject Store ─────────────────────────────────────────────────────────────

interface SubjectState {
  subjects: Subject[]
  updateSubject: (id: string, updates: Partial<Subject>) => void
  setSubjects: (s: Subject[]) => void
}

export const useSubjectStore = create<SubjectState>((set) => ({
  subjects: MOCK_SUBJECTS,
  updateSubject: (id, updates) =>
    set((state) => ({
      subjects: state.subjects.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),
  setSubjects: (subjects) => set({ subjects }),
}))

// ─── Flashcard Store ───────────────────────────────────────────────────────────

interface FlashcardState {
  flashcards: Flashcard[]
  addFlashcard: (f: Omit<Flashcard, 'id' | 'userId'>) => void
  deleteFlashcard: (id: string) => void
  updateFlashcard: (id: string, updates: Partial<Flashcard>) => void
}

export const useFlashcardStore = create<FlashcardState>((set) => ({
  flashcards: MOCK_FLASHCARDS,
  addFlashcard: (f) =>
    set((state) => ({
      flashcards: [
        { ...f, id: `fc_${Date.now()}`, userId: 'user_demo' },
        ...state.flashcards,
      ],
    })),
  deleteFlashcard: (id) =>
    set((state) => ({
      flashcards: state.flashcards.filter((f) => f.id !== id),
    })),
  updateFlashcard: (id, updates) =>
    set((state) => ({
      flashcards: state.flashcards.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    })),
}))

// ─── Quiz Store ────────────────────────────────────────────────────────────────

interface QuizState {
  quizzes: Quiz[]
  activeQuiz: Quiz | null
  setActiveQuiz: (quiz: Quiz | null) => void
  addQuiz: (q: Quiz) => void
  updateQuizScore: (id: string, score: number) => void
}

export const useQuizStore = create<QuizState>((set) => ({
  quizzes: MOCK_QUIZZES,
  activeQuiz: null,
  setActiveQuiz: (quiz) => set({ activeQuiz: quiz }),
  addQuiz: (q) => set((state) => ({ quizzes: [q, ...state.quizzes] })),
  updateQuizScore: (id, score) =>
    set((state) => ({
      quizzes: state.quizzes.map((q) =>
        q.id === id ? { ...q, score, completedAt: new Date().toISOString() } : q
      ),
    })),
}))

// ─── Study Session Store ───────────────────────────────────────────────────────

interface StudySessionState {
  sessions: StudySession[]
  goals: StudyGoal[]
  addSession: (s: Omit<StudySession, 'id' | 'userId'>) => void
  updateGoal: (id: string, updates: Partial<StudyGoal>) => void
}

export const useStudySessionStore = create<StudySessionState>((set) => ({
  sessions: MOCK_SESSIONS,
  goals: MOCK_GOALS,
  addSession: (s) =>
    set((state) => ({
      sessions: [
        { ...s, id: `ses_${Date.now()}`, userId: 'user_demo' },
        ...state.sessions,
      ],
    })),
  updateGoal: (id, updates) =>
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    })),
}))

// ─── AI / Chat Store ───────────────────────────────────────────────────────────

interface AIState {
  messages: ChatMessage[]
  insights: AIInsight[]
  isTyping: boolean
  addMessage: (msg: ChatMessage) => void
  setTyping: (v: boolean) => void
  clearChat: () => void
}

export const useAIStore = create<AIState>((set) => ({
  messages: SAMPLE_CHAT_MESSAGES,
  insights: MOCK_INSIGHTS,
  isTyping: false,

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
