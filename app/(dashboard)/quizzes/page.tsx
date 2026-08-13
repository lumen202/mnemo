'use client'
import { useState } from 'react'
import { CircleHelp, Sparkles, CheckCircle, XCircle, Trophy, RotateCcw, ChevronRight, Loader2, LayoutGrid, Layers, BookOpen, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useQuizStore, useStudyMaterialStore, useUIStore } from '@/store'
import { SUBJECT_META } from '@/data/mockData'
import { cn } from '@/lib/utils'
import type { Quiz, SubjectId, StudyMaterial } from '@/types'
import type { QuizResponse } from '@/services/ai/types'

const SUBJECT_OPTIONS: SubjectId[] = [
  'mathematics', 'computer-science', 'physics', 'machine-learning',
  'biology', 'chemistry', 'history', 'economics', 'philosophy', 'literature', 'other',
]

function QuizPlayer({ quiz, onFinish }: { quiz: Quiz; onFinish: (score: number) => void }) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [showExplanation, setShowExplanation] = useState(false)

  const question = quiz.questions[questionIndex]
  const isLast = questionIndex === quiz.questions.length - 1
  const isAnswered = selectedAnswer !== null
  const isCorrect = isAnswered && selectedAnswer === question.correctAnswer

  const handleAnswer = (index: number) => {
    if (isAnswered) return
    setSelectedAnswer(index)
    setAnswers((prev) => ({ ...prev, [question.id]: index }))
    setShowExplanation(true)
  }

  const handleNext = () => {
    if (isLast) {
      const correct = Object.entries(answers).filter(([id, ans]) => {
        const q = quiz.questions.find((q) => q.id === id)
        return q && ans === q.correctAnswer
      }).length
      onFinish(Math.round((correct / quiz.questions.length) * 100))
    } else {
      setQuestionIndex((i) => i + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Question {questionIndex + 1} of {quiz.questions.length}</span>
          <span>{Object.keys(answers).length} answered</span>
        </div>
        <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((questionIndex) / quiz.questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <Card className="p-6">
        <p className="text-base font-semibold text-foreground mb-5 leading-relaxed">
          {question.question}
        </p>

        <div className="space-y-2.5">
          {question.options.map((option, idx) => {
            let optionClass = 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-primary/5'
            if (isAnswered) {
              if (idx === question.correctAnswer) {
                optionClass = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              } else if (idx === selectedAnswer && idx !== question.correctAnswer) {
                optionClass = 'border-rose-500/40 bg-rose-500/10 text-rose-300'
              } else {
                optionClass = 'border-border text-muted-foreground/50'
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={isAnswered}
                className={cn(
                  'w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 text-sm',
                  'flex items-center gap-3',
                  optionClass,
                  !isAnswered && 'cursor-pointer'
                )}
              >
                <span className={cn(
                  'w-6 h-6 rounded-full border flex items-center justify-center text-xs font-semibold shrink-0',
                  isAnswered && idx === question.correctAnswer ? 'border-emerald-400 text-emerald-400' :
                  isAnswered && idx === selectedAnswer ? 'border-rose-400 text-rose-400' :
                  'border-border text-muted-foreground'
                )}>
                  {String.fromCharCode(65 + idx)}
                </span>
                {option}
                {isAnswered && idx === question.correctAnswer && (
                  <CheckCircle size={15} className="text-emerald-400 ml-auto shrink-0" />
                )}
                {isAnswered && idx === selectedAnswer && idx !== question.correctAnswer && (
                  <XCircle size={15} className="text-rose-400 ml-auto shrink-0" />
                )}
              </button>
            )
          })}
        </div>

        {showExplanation && (
          <div className={cn(
            'mt-4 p-3.5 rounded-xl border text-xs leading-relaxed',
            isCorrect
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200'
              : 'bg-amber-500/10 border-amber-500/25 text-amber-200'
          )}>
            <span className="font-semibold">{isCorrect ? '✓ Correct! ' : '✗ Not quite. '}</span>
            {question.explanation}
          </div>
        )}
      </Card>

      {isAnswered && (
        <div className="flex justify-end">
          <Button onClick={handleNext} className="gap-1.5">
            {isLast ? 'Finish Quiz' : 'Next Question'}
            <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </div>
  )
}

function QuizResult({ quiz, score, onRetry }: { quiz: Quiz; score: number; onRetry: () => void }) {
  const grade = score >= 90 ? { label: 'Excellent!', color: 'text-emerald-400', bg: 'bg-emerald-500/15' }
    : score >= 75 ? { label: 'Good job!', color: 'text-primary', bg: 'bg-primary/15' }
    : score >= 60 ? { label: 'Keep practicing', color: 'text-amber-400', bg: 'bg-amber-500/15' }
    : { label: 'Needs review', color: 'text-rose-400', bg: 'bg-rose-500/15' }

  return (
    <Card className="p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-4">
        <Trophy className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">{grade.label}</h3>
      <div className={cn('text-5xl font-bold tabular-nums mb-2', grade.color)}>{score}%</div>
      <p className="text-sm text-muted-foreground mb-6">{quiz.title}</p>
      <Button onClick={onRetry} variant="outline" className="gap-1.5">
        <RotateCcw size={14} />
        Retry Quiz
      </Button>
    </Card>
  )
}

// ─── Generate Banner ──────────────────────────────────────────────────────────

function GenerateBanner({ onGenerated }: { onGenerated: (quiz: Quiz) => void }) {
  const { addQuiz } = useQuizStore()
  const { materials } = useStudyMaterialStore()
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null)
  const [subject, setSubject] = useState<SubjectId>('computer-science')
  const [topic, setTopic] = useState('')
  const [count, setCount] = useState(5)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function pickMaterial(id: string) {
    if (id === '__none__') { setSelectedMaterial(null); return }
    const mat = materials.find((m) => m.id === id) ?? null
    setSelectedMaterial(mat)
    if (mat) { setSubject(mat.subject); setTopic(mat.title) }
  }

  const handleGenerate = async () => {
    if (!topic.trim() && !selectedMaterial) return
    setIsGenerating(true)
    setError(null)

    const content = selectedMaterial
      ? (selectedMaterial.content ?? selectedMaterial.summary ?? selectedMaterial.title)
      : topic.trim()

    try {
      const res = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, content, count }),
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
        materialId: selectedMaterial?.id,
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
      onGenerated(quiz)
      setTopic('')
      setSelectedMaterial(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">AI Quiz Generator</h3>
          <p className="text-xs text-muted-foreground">Generate from an uploaded material or describe a topic below.</p>
        </div>
      </div>

      <div className="space-y-3">
        {materials.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">From study material (optional)</label>
            <Select value={selectedMaterial?.id ?? '__none__'} onValueChange={pickMaterial}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="None — enter topic below" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None — enter topic below</SelectItem>
                {materials.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.title}
                    <span className="ml-2 text-muted-foreground text-xs">{SUBJECT_META[m.subject]?.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Subject</label>
            <Select value={subject} onValueChange={(v) => setSubject(v as SubjectId)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBJECT_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{SUBJECT_META[s]?.label ?? s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Number of questions</label>
            <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[3, 5, 8, 10].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} questions</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            {selectedMaterial ? 'Topic (from material)' : 'Topic / content to quiz on'}
          </label>
          <Textarea
            value={topic}
            onChange={(e) => { setTopic(e.target.value); if (selectedMaterial) setSelectedMaterial(null) }}
            placeholder="e.g. Dynamic programming, Photosynthesis, French Revolution causes..."
            className="h-20 text-sm resize-none"
            disabled={isGenerating}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                handleGenerate()
              }
            }}
          />
          {selectedMaterial && (
            <p className="text-xs text-primary/80">
              Using full content of &ldquo;{selectedMaterial.title}&rdquo; — edit above to override
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            className="gap-1.5"
            onClick={handleGenerate}
            disabled={isGenerating || (!topic.trim() && !selectedMaterial)}
          >
            {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {isGenerating ? 'Generating...' : 'Generate Quiz'}
          </Button>
          {error && <span className="text-xs text-rose-400">{error}</span>}
        </div>
      </div>
    </Card>
  )
}

// ─── Quiz Card ────────────────────────────────────────────────────────────────

function QuizCard({ quiz, onStart }: { quiz: Quiz; onStart: (quiz: Quiz) => void }) {
  const { deleteQuiz } = useQuizStore()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const meta = SUBJECT_META[quiz.subjectId]
  const score = quiz.score
  const isCompleted = score !== undefined
  const scoreColor = !isCompleted ? '' : score >= 90 ? 'text-emerald-400' : score >= 70 ? 'text-primary' : 'text-amber-400'

  return (
    <>
    <Card className="group relative p-5 flex flex-col gap-4 hover:bg-accent transition-colors">
      <Button
        size="icon-sm"
        variant="ghost"
        className="absolute top-3 right-3 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation()
          setDeleteOpen(true)
        }}
        title="Delete quiz"
      >
        <Trash2 size={13} />
      </Button>
      <div className="flex items-start justify-between">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: (meta?.color ?? '#6366f1') + '25', color: meta?.color ?? '#6366f1' }}
        >
          <CircleHelp size={16} />
        </div>
        {isCompleted && (
          <div className={cn('text-lg font-bold tabular-nums', scoreColor)}>
            {score}%
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">{quiz.title}</h3>
        <p className="text-xs text-muted-foreground">{meta?.label} · {quiz.totalQuestions} questions</p>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {isCompleted
            ? `Completed ${new Date(quiz.completedAt!).toLocaleDateString()}`
            : `Created ${new Date(quiz.createdAt).toLocaleDateString()}`}
        </span>
        <Button
          size="sm"
          variant={isCompleted ? 'outline' : 'default'}
          className="h-7 text-xs px-3 gap-1"
          onClick={() => onStart(quiz)}
        >
          {isCompleted ? 'Retake' : 'Start'}
          <ChevronRight size={11} />
        </Button>
      </div>
    </Card>
    <ConfirmDialog
      open={deleteOpen}
      onOpenChange={setDeleteOpen}
      title="Delete quiz?"
      description={`Delete "${quiz.title}"? ${isCompleted ? 'Your score for it will be lost. ' : ''}This cannot be undone.`}
      confirmLabel="Delete"
      onConfirm={() => deleteQuiz(quiz.id)}
    />
    </>
  )
}

// ─── Grouped by Subject ────────────────────────────────────────────────────────

function QuizzesGroupedBySubject({ quizzes, onStart }: { quizzes: Quiz[]; onStart: (quiz: Quiz) => void }) {
  const grouped: Record<string, Quiz[]> = {}
  quizzes.forEach((q) => {
    const key = q.subjectId
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(q)
  })

  const sorted = Object.entries(grouped).sort(([, a], [, b]) => b.length - a.length)

  return (
    <div className="space-y-6">
      {sorted.map(([subjectId, groupQuizzes]) => {
        const meta = SUBJECT_META[subjectId]
        const completedCount = groupQuizzes.filter((q) => q.score !== undefined).length
        return (
          <div key={subjectId}>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: (meta?.color ?? '#6366f1') + '20', color: meta?.color ?? '#6366f1' }}
              >
                <CircleHelp size={14} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{meta?.label ?? subjectId}</h3>
                <p className="text-xs text-muted-foreground">
                  {groupQuizzes.length} quiz{groupQuizzes.length !== 1 ? 'zes' : ''} · {completedCount} completed
                </p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupQuizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} onStart={onStart} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Grouped by Material ───────────────────────────────────────────────────────

function QuizzesGroupedByMaterial({
  quizzes,
  materials,
  onStart,
}: {
  quizzes: Quiz[]
  materials: StudyMaterial[]
  onStart: (quiz: Quiz) => void
}) {
  const materialMap = new Map(materials.map((m) => [m.id, m]))
  const grouped: Record<string, Quiz[]> = {}
  const ungrouped: Quiz[] = []

  quizzes.forEach((q) => {
    if (q.materialId && materialMap.has(q.materialId)) {
      if (!grouped[q.materialId]) grouped[q.materialId] = []
      grouped[q.materialId].push(q)
    } else {
      ungrouped.push(q)
    }
  })

  const sorted = Object.entries(grouped).sort(([, a], [, b]) => b.length - a.length)

  return (
    <div className="space-y-6">
      {sorted.map(([materialId, groupQuizzes]) => {
        const mat = materialMap.get(materialId)
        const meta = mat ? SUBJECT_META[mat.subject] : null
        const completedCount = groupQuizzes.filter((q) => q.score !== undefined).length
        return (
          <div key={materialId}>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: (meta?.color ?? '#6366f1') + '20', color: meta?.color ?? '#6366f1' }}
              >
                <BookOpen size={14} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{mat?.title ?? materialId}</h3>
                <p className="text-xs text-muted-foreground">
                  {meta?.label ?? 'Unknown'} · {groupQuizzes.length} quiz{groupQuizzes.length !== 1 ? 'zes' : ''} · {completedCount} completed
                </p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupQuizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} onStart={onStart} />
              ))}
            </div>
          </div>
        )
      })}

      {ungrouped.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-accent text-muted-foreground">
              <Layers size={14} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Ungrouped</h3>
              <p className="text-xs text-muted-foreground">
                {ungrouped.length} quiz{ungrouped.length !== 1 ? 'zes' : ''} · no linked material
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ungrouped.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} onStart={onStart} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ViewMode = 'all' | 'by-subject' | 'by-material'

export default function QuizzesPage() {
  const { quizzes, activeQuiz, setActiveQuiz, updateQuizScore } = useQuizStore()
  const { materials } = useStudyMaterialStore()
  const { addToast } = useUIStore()
  const [completedScore, setCompletedScore] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('all')

  const handleFinish = (score: number) => {
    if (activeQuiz) {
      updateQuizScore(activeQuiz.id, score)
      setCompletedScore(score)
      addToast({
        title: score >= 75 ? 'Nice work!' : 'Quiz completed',
        description: `You scored ${score}% on "${activeQuiz.title}".`,
        variant: score >= 60 ? 'success' : 'warning',
      })
    }
  }

  const handleRetry = () => setCompletedScore(null)

  const handleStart = (quiz: Quiz) => {
    setActiveQuiz(quiz)
    setCompletedScore(null)
  }

  const handleBack = () => {
    setActiveQuiz(null)
    setCompletedScore(null)
  }

  const handleGenerated = (quiz: Quiz) => {
    setActiveQuiz(quiz)
    setCompletedScore(null)
  }

  if (activeQuiz) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">{activeQuiz.title}</h2>
            <p className="text-xs text-muted-foreground">{SUBJECT_META[activeQuiz.subjectId]?.label}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleBack}>← Back to quizzes</Button>
        </div>
        {completedScore !== null ? (
          <QuizResult quiz={activeQuiz} score={completedScore} onRetry={handleRetry} />
        ) : (
          <QuizPlayer quiz={activeQuiz} onFinish={handleFinish} />
        )}
      </div>
    )
  }

  const completed = quizzes.filter((q) => q.score !== undefined)
  const avgScore = completed.length > 0
    ? Math.round(completed.reduce((s, q) => s + (q.score ?? 0), 0) / completed.length)
    : 0

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { label: 'Total Quizzes', value: quizzes.length, color: 'text-primary', bg: 'bg-primary/15' },
          { label: 'Completed',     value: completed.length, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
          { label: 'Avg Score',     value: `${avgScore}%`, color: 'text-amber-400', bg: 'bg-amber-500/15' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={cn('rounded-xl p-4 border border-border', bg)}>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={cn('text-2xl font-bold tabular-nums', color)}>{value}</p>
          </div>
        ))}
      </div>

      <GenerateBanner onGenerated={handleGenerated} />

      {quizzes.length === 0 && (
        <EmptyState
          icon={CircleHelp}
          title="No quizzes yet"
          description="Generate a quiz from a topic or one of your uploaded materials above. You can also ask the AI Tutor to “quiz me on…” anything you're studying."
        />
      )}

      {quizzes.length > 0 && (
      <>
      {/* View mode toggle */}
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-foreground">Your Quizzes</h2>
        <div className="flex items-center rounded-xl border border-border bg-accent/40 p-0.5 ml-auto">
          {([
            { id: 'all' as const, label: 'All', icon: LayoutGrid },
            { id: 'by-subject' as const, label: 'By Subject', icon: Layers },
            { id: 'by-material' as const, label: 'By Material', icon: BookOpen },
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setViewMode(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                viewMode === id
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground border border-transparent'
              )}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Quiz list */}
      <div>
        {viewMode === 'all' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} onStart={handleStart} />
            ))}
          </div>
        )}

        {viewMode === 'by-subject' && <QuizzesGroupedBySubject quizzes={quizzes} onStart={handleStart} />}

        {viewMode === 'by-material' && (
          <QuizzesGroupedByMaterial quizzes={quizzes} materials={materials} onStart={handleStart} />
        )}
      </div>
      </>
      )}
    </div>
  )
}
