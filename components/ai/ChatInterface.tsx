'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import { Send, RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AssistantMessage } from './AssistantMessage'
import { TypingIndicator } from './TypingIndicator'
import {
  useAIStore, useFlashcardStore, useQuizStore,
  useStudyMaterialStore, useSubjectStore, useStudySessionStore,
} from '@/store'
import { SUGGESTED_QUESTIONS } from '@/data/mockData'
import { cn } from '@/lib/utils'
import { computeStudyAnalytics } from '@/utils/analytics'
import { isDue } from '@/utils/srs'
import { buildStudyContext, buildHistoryWindow, isPersonalQuery } from '@/utils/aiContext'
import {
  runTutorTool, detectWikiTopic, formatWikiResult, type WikiResult,
  detectDefineTopic, formatDictionaryResult, type DictionaryResult,
  detectPaperSearchTopic, formatArxivResults, type ArxivPaper,
} from '@/services/ai/tutorTools'
import type { TutorResponse, FlashcardResponse, QuizResponse } from '@/services/ai/types'
import type { SubjectId, Quiz } from '@/types'

function detectFlashcardIntent(msg: string): { isFlashcard: boolean; topic: string | null } {
  const m = msg.toLowerCase()
  if (!/flash\s*card/.test(m) && !/(?:generate|create|make)\s+(?:some\s+)?cards?/.test(m)) {
    return { isFlashcard: false, topic: null }
  }
  const topicMatch =
    msg.match(/flash\s*cards?\s+(?:on|for|about|covering|of)\s+(.+)/i) ||
    msg.match(/(?:generate|create|make)\s+\w+\s+flash\s*cards?\s+(?:on|for|about)\s+(.+)/i) ||
    msg.match(/(?:on|about|for)\s+(.+?)\s+flash\s*cards?/i)
  return { isFlashcard: true, topic: topicMatch?.[1]?.trim() ?? null }
}

function detectQuizIntent(msg: string): { isQuiz: boolean; topic: string | null } {
  const m = msg.toLowerCase()
  // \b after "me" matters: without it, "test message" matches "test me" as a
  // substring ("test m" + "essage") and every message with that word false-triggers a quiz.
  if (!/quiz|test\s+me\b|make\s+(?:a\s+)?(?:practice\s+)?(?:test|exam)|(?:generate|create)\s+(?:a\s+)?(?:practice\s+)?(?:test|exam|quiz)/.test(m)) {
    return { isQuiz: false, topic: null }
  }
  const topicMatch =
    msg.match(/quiz\s+(?:on|for|about|covering|of)\s+(.+)/i) ||
    msg.match(/(?:generate|create|make)\s+\w+\s+quiz\s+(?:on|for|about)\s+(.+)/i) ||
    msg.match(/(?:test|exam)\s+(?:on|for|about|covering)\s+(.+)/i) ||
    msg.match(/test\s+me\s+on\s+(.+)/i)
  return { isQuiz: true, topic: topicMatch?.[1]?.trim() ?? null }
}

function mapTopicToSubject(topic: string): SubjectId {
  const t = topic.toLowerCase()
  if (/math|calculus|algebra|geometry|trig|statistic|probability/.test(t)) return 'mathematics'
  if (/computer|programm|algorithm|data.?struct|software|cod|network/.test(t)) return 'computer-science'
  if (/physics|quantum|mechanic|thermodynamic|electro|relativity/.test(t)) return 'physics'
  if (/machine.?learn|deep.?learn|neural|transformer|\bml\b|artificial.?intelligence/.test(t)) return 'machine-learning'
  if (/bio|cell|genetic|dna|evolution|anatomy|organism/.test(t)) return 'biology'
  if (/chem|organic|periodic|molecular|reaction|compound/.test(t)) return 'chemistry'
  if (/histor|war|empire|civilization|revolution|ancient/.test(t)) return 'history'
  if (/econom|market|supply|demand|macro|micro|gdp|inflation/.test(t)) return 'economics'
  if (/philosoph|ethics|logic|metaphys|epistemol|existential/.test(t)) return 'philosophy'
  if (/literatur|poem|poetry|novel|essay|fiction|writing/.test(t)) return 'literature'
  return 'other'
}

// Remove <think>...</think> blocks that Qwen3 models emit.
// Strips complete blocks and hides any in-progress (unclosed) block during streaming.
function stripThinking(text: string): string {
  let out = text.replace(/<think>[\s\S]*?<\/think>/g, '')
  const openIdx = out.lastIndexOf('<think>')
  if (openIdx !== -1) out = out.slice(0, openIdx)
  return out.trim()
}

export function ChatInterface() {
  // Selector subscriptions instead of a whole-store destructure — this
  // component only re-renders on the specific fields it reads, not on every
  // AI-store change (e.g. insights loading elsewhere).
  const messages = useAIStore((s) => s.messages)
  const activeSessionId = useAIStore((s) => s.activeSessionId)
  const typingSessionIds = useAIStore((s) => s.typingSessionIds)
  const addMessage = useAIStore((s) => s.addMessage)
  const updateMessage = useAIStore((s) => s.updateMessage)
  const setSessionTyping = useAIStore((s) => s.setSessionTyping)
  const clearChat = useAIStore((s) => s.clearChat)
  const { addFlashcard, flashcards } = useFlashcardStore()
  const { addQuiz, quizzes } = useQuizStore()
  const { materials } = useStudyMaterialStore()
  const { subjects } = useSubjectStore()
  const { sessions: studySessions } = useStudySessionStore()
  const [input, setInput] = useState('')
  // Sessions with tokens actively streaming in — a Set so multiple background
  // chats can be mid-flight without blocking each other's input.
  const [streamingSessionIds, setStreamingSessionIds] = useState<Set<string>>(new Set())
  const [pendingIntent, setPendingIntent] = useState<null | 'awaiting_flashcard_topic' | 'awaiting_quiz_topic'>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isTyping = typingSessionIds.includes(activeSessionId)
  const isStreaming = streamingSessionIds.has(activeSessionId)
  const isBusy = isTyping || isStreaming

  const markStreaming = (sessionId: string, streaming: boolean) => {
    setStreamingSessionIds((prev) => {
      const next = new Set(prev)
      if (streaming) next.add(sessionId)
      else next.delete(sessionId)
      return next
    })
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, isTyping])

  // Compact, real study context — the model gets to be relevant instead of
  // generic. Everything here is computed from live store data, never invented.
  const studyContext = useMemo(() => {
    const analytics = computeStudyAnalytics(materials, studySessions, subjects)
    const dueFlashcards = flashcards.filter((f) => isDue(f)).length
    return buildStudyContext(analytics, subjects, materials, dueFlashcards)
  }, [materials, studySessions, subjects, flashcards])

  // Same store snapshot, reshaped for the scripted tool router below.
  const toolContext = useMemo(
    () => ({ materials, subjects, sessions: studySessions, flashcards, quizzes }),
    [materials, subjects, studySessions, flashcards, quizzes]
  )

  const generateFlashcardsForTopic = async (topic: string, sessionId: string) => {
    const subject = mapTopicToSubject(topic)
    const assistantId = `msg_${Date.now() + 1}`
    addMessage({ id: assistantId, role: 'assistant', content: '…', timestamp: new Date().toISOString() }, sessionId)
    setSessionTyping(sessionId, true)

    try {
      const res = await fetch('/api/ai/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, content: topic, count: 6 }),
      })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: 'Generation failed' }))
        throw new Error(errBody.error ?? `HTTP ${res.status}`)
      }

      const data: FlashcardResponse = await res.json()
      const cards = data.flashcards ?? []

      cards.forEach((fc) =>
        addFlashcard({ subjectId: data.subject, front: fc.front, back: fc.back, difficulty: fc.difficulty, timesReviewed: 0 })
          .catch(() => {})
      )

      updateMessage(
        assistantId,
        `I've generated **${cards.length} flashcards** on *${topic}* and added them to your deck!\n\n[→ View your flashcards](/flashcards)`,
        sessionId
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed'
      updateMessage(assistantId, `I had trouble generating flashcards: ${msg}. Please try again or visit the Flashcards page to generate them directly.`, sessionId)
    } finally {
      setSessionTyping(sessionId, false)
      setPendingIntent(null)
    }
  }

  const generateQuizForTopic = async (topic: string, sessionId: string) => {
    const subject = mapTopicToSubject(topic)
    const assistantId = `msg_${Date.now() + 1}`
    addMessage({ id: assistantId, role: 'assistant', content: '…', timestamp: new Date().toISOString() }, sessionId)
    setSessionTyping(sessionId, true)

    try {
      const res = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, content: topic, count: 5 }),
      })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: 'Generation failed' }))
        throw new Error(errBody.error ?? `HTTP ${res.status}`)
      }

      const data: QuizResponse = await res.json()
      const quiz: Quiz = {
        id: `quiz_${Date.now()}`,
        userId: 'user_demo',
        subjectId: data.subject,
        title: data.title,
        totalQuestions: data.questions.length,
        createdAt: new Date().toISOString(),
        questions: data.questions.map((q, i) => ({
          id: `q_gen_${Date.now()}_${i}`,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        })),
      }

      addQuiz(quiz).catch(() => {})

      updateMessage(
        assistantId,
        `I've generated a **${data.questions.length}-question quiz** on *${topic}*!\n\n[→ Go to Quizzes](/quizzes)`,
        sessionId
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed'
      updateMessage(assistantId, `I had trouble generating the quiz: ${msg}. Please try again or visit the Quizzes page to generate one directly.`, sessionId)
    } finally {
      setSessionTyping(sessionId, false)
      setPendingIntent(null)
    }
  }

  const sendMessage = async (content: string) => {
    if (!content.trim() || isBusy) return

    // Bind this whole exchange to whichever session is active right now —
    // captured once, so a later switchSession() can't redirect the reply.
    const sessionId = activeSessionId

    addMessage({
      id: `msg_${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    }, sessionId)
    setInput('')

    // ── Pending topic replies ────────────────────────────────────────────────
    if (pendingIntent === 'awaiting_flashcard_topic') {
      setPendingIntent(null)
      await generateFlashcardsForTopic(content.trim(), sessionId)
      return
    }
    if (pendingIntent === 'awaiting_quiz_topic') {
      setPendingIntent(null)
      await generateQuizForTopic(content.trim(), sessionId)
      return
    }

    // ── Scripted tools ────────────────────────────────────────────────────────
    // Deterministic, zero-AI-cost answers for anything already computable from
    // local store data (streak, due flashcards, quiz average, ...). Runs before
    // flashcard/quiz detection so "what flashcards are due" can't be misread
    // as "generate flashcards" — the word "flashcards" alone used to trigger it.
    const toolAnswer = runTutorTool(content.trim(), toolContext)
    if (toolAnswer) {
      addMessage({ id: `msg_${Date.now() + 1}`, role: 'assistant', content: toolAnswer, timestamp: new Date().toISOString() }, sessionId)
      return
    }

    // ── Flashcard intent detection ───────────────────────────────────────────
    const { isFlashcard, topic: flashcardTopic } = detectFlashcardIntent(content.trim())
    if (isFlashcard) {
      if (flashcardTopic) {
        await generateFlashcardsForTopic(flashcardTopic, sessionId)
      } else {
        addMessage({
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: `Sure! What subject or topic would you like me to create flashcards for?\n\nFor example: *Calculus integration techniques*, *Binary Search Trees*, *Cell Biology*, *World War II* — just tell me the topic and I'll generate a deck for you.`,
          timestamp: new Date().toISOString(),
        }, sessionId)
        setPendingIntent('awaiting_flashcard_topic')
      }
      return
    }

    // ── Quiz intent detection ────────────────────────────────────────────────
    const { isQuiz, topic: quizTopic } = detectQuizIntent(content.trim())
    if (isQuiz) {
      if (quizTopic) {
        await generateQuizForTopic(quizTopic, sessionId)
      } else {
        addMessage({
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: `Sure! What subject or topic would you like me to quiz you on?\n\nFor example: *Calculus derivatives*, *Binary Trees*, *Cell Biology*, *World War II* — just tell me the topic and I'll build a quiz for you.`,
          timestamp: new Date().toISOString(),
        }, sessionId)
        setPendingIntent('awaiting_quiz_topic')
      }
      return
    }

    // ── Dictionary lookup ─────────────────────────────────────────────────────
    // "Define X" tries Wiktionary (real dictionary entry) first; a word it has
    // no entry for is usually a concept, not a dictionary word, so that falls
    // through to Wikipedia via detectWikiTopic-style handling below.
    const defineTopic = detectDefineTopic(content.trim())
    if (defineTopic) {
      setSessionTyping(sessionId, true)
      const dict = await fetch('/api/ai/wiktionary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: defineTopic }),
      })
        .then((r) => (r.ok ? r.json() : { result: null }))
        .catch(() => ({ result: null as DictionaryResult | null }))

      if (dict.result) {
        addMessage(
          { id: `msg_${Date.now() + 1}`, role: 'assistant', content: formatDictionaryResult(dict.result), timestamp: new Date().toISOString() },
          sessionId
        )
        setSessionTyping(sessionId, false)
        return
      }

      // No dictionary entry — try Wikipedia before falling through to the model.
      const wiki = await fetch('/api/ai/wiki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: defineTopic }),
      })
        .then((r) => (r.ok ? r.json() : { result: null }))
        .catch(() => ({ result: null as WikiResult | null }))

      if (wiki.result) {
        addMessage(
          { id: `msg_${Date.now() + 1}`, role: 'assistant', content: formatWikiResult(wiki.result), timestamp: new Date().toISOString() },
          sessionId
        )
        setSessionTyping(sessionId, false)
        return
      }
      // Neither source has it — stay "typing" and hand off to the AI chat flow below.
    }

    // ── Paper search ──────────────────────────────────────────────────────────
    const paperTopic = detectPaperSearchTopic(content.trim())
    if (paperTopic) {
      setSessionTyping(sessionId, true)
      const arxiv = await fetch('/api/ai/arxiv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: paperTopic }),
      })
        .then((r) => (r.ok ? r.json() : { papers: [] }))
        .catch(() => ({ papers: [] as ArxivPaper[] }))

      addMessage(
        { id: `msg_${Date.now() + 1}`, role: 'assistant', content: formatArxivResults(paperTopic, arxiv.papers), timestamp: new Date().toISOString() },
        sessionId
      )
      setSessionTyping(sessionId, false)
      return
    }

    // ── Wikipedia lookup ──────────────────────────────────────────────────────
    // Factual/biographical questions get a cited encyclopedia summary instead
    // of the model guessing from parametric memory — zero tokens spent, and
    // more trustworthy for exactly the kind of fact an LLM is prone to fudge.
    // No match or no result found falls straight through to the AI chat below.
    const wikiTopic = detectWikiTopic(content.trim())
    if (wikiTopic) {
      setSessionTyping(sessionId, true)
      const wiki = await fetch('/api/ai/wiki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: wikiTopic }),
      })
        .then((r) => (r.ok ? r.json() : { result: null }))
        .catch(() => ({ result: null as WikiResult | null }))

      if (wiki.result) {
        addMessage(
          { id: `msg_${Date.now() + 1}`, role: 'assistant', content: formatWikiResult(wiki.result), timestamp: new Date().toISOString() },
          sessionId
        )
        setSessionTyping(sessionId, false)
        return
      }
      // No article found — stay "typing" and hand off to the AI chat flow below.
    }

    // ── Normal AI chat ───────────────────────────────────────────────────────
    setSessionTyping(sessionId, true)

    const assistantId = `msg_${Date.now() + 1}`

    // A char budget rather than a flat message count — a handful of long
    // messages shouldn't balloon the request the way 20 raw ones can.
    const history = buildHistoryWindow(useAIStore.getState().sessions.find((s) => s.id === sessionId)?.messages ?? [])

    try {
      // Only pay the personalization cost (no cache, real context tokens) when
      // the question is actually about the student's own progress.
      const context = studyContext && isPersonalQuery(content) ? studyContext : undefined

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content.trim(), history, context }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const contentType = res.headers.get('content-type') ?? ''

      if (contentType.includes('text/plain') && res.body) {
        // Streaming mode — add placeholder message and stream tokens into it
        addMessage({ id: assistantId, role: 'assistant', content: '', timestamp: new Date().toISOString() }, sessionId)
        setSessionTyping(sessionId, false)
        markStreaming(sessionId, true)

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let raw = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          raw += decoder.decode(value, { stream: true })
          const display = stripThinking(raw)
          updateMessage(assistantId, display || '…', sessionId)
        }

        const final = stripThinking(raw)
        updateMessage(
          assistantId,
          final || 'I had trouble generating a response. Please try again.',
          sessionId
        )
      } else {
        // JSON mode (mock / fallback)
        const data: TutorResponse | { error: string } = await res.json()
        const responseContent =
          'error' in data ? 'Sorry, I ran into an error. Please try again.' : data.content
        addMessage({ id: assistantId, role: 'assistant', content: responseContent, timestamp: new Date().toISOString() }, sessionId)
        setSessionTyping(sessionId, false)
      }
    } catch {
      const targetSession = useAIStore.getState().sessions.find((s) => s.id === sessionId)
      if (targetSession?.messages.find((m) => m.id === assistantId)) {
        updateMessage(assistantId, 'Connection issue — please check your network and try again.', sessionId)
      } else {
        addMessage({
          id: assistantId,
          role: 'assistant',
          content: 'Connection issue — please check your network and try again.',
          timestamp: new Date().toISOString(),
        }, sessionId)
      }
      setSessionTyping(sessionId, false)
    } finally {
      markStreaming(sessionId, false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef as React.Ref<HTMLDivElement>}>
        <div className="py-4 space-y-4 max-w-3xl mx-auto">
          {messages.map((msg) => (
            <AssistantMessage key={msg.id} message={msg} />
          ))}
          {isTyping && !isStreaming && <TypingIndicator />}
        </div>
      </ScrollArea>

      {/* Suggested questions */}
      {messages.length <= 1 && !isBusy && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground mb-2 text-center">Try asking...</p>
          <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
            {SUGGESTED_QUESTIONS.slice(0, 4).map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className={cn(
                  'text-xs glass border border-white/[0.07] rounded-full px-3 py-1.5',
                  'text-muted-foreground hover:text-foreground hover:border-indigo-500/40 transition-all duration-200',
                  'hover:bg-indigo-500/10'
                )}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2 items-end glass border border-white/[0.07] rounded-2xl p-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your AI tutor anything — explain a concept, generate a quiz, create flashcards..."
              className="flex-1 min-h-[44px] max-h-32 border-0 bg-transparent focus-visible:ring-0 resize-none py-2 px-2 text-sm"
              rows={1}
            />
            <div className="flex gap-1.5 pb-1 shrink-0">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={clearChat}
                disabled={isBusy}
                className="text-muted-foreground hover:text-foreground"
                title="Clear chat"
              >
                <RefreshCw size={14} />
              </Button>
              <Button
                size="icon-sm"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isBusy}
                className="rounded-xl"
              >
                <Send size={14} />
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
            <Sparkles size={10} className="text-indigo-400" />
            Powered by AI · Personalized to your study context
          </p>
        </div>
      </div>
    </div>
  )
}
