import * as aiClient from '../aiClient'
import { getDefaultModel } from '../modelRegistry'
import { QUIZ_SYSTEM_PROMPT } from '../prompts/quizPrompt'
import type { QuizResponse, GeneratedQuizQuestion } from '../types'
import type { SubjectId } from '@/types'

// ─── Input ────────────────────────────────────────────────────────────────────

export interface QuizInput {
  content: string
  subject: SubjectId
  questionCount?: number
}

// ─── Agent ────────────────────────────────────────────────────────────────────

export async function run(input: QuizInput): Promise<QuizResponse> {
  const count = input.questionCount ?? 5

  if (!aiClient.isConfigured()) {
    await new Promise((r) => setTimeout(r, 900 + Math.random() * 400))
    return mockQuiz(input.subject, count)
  }

  try {
    const messages: aiClient.Message[] = [
      { role: 'system', content: QUIZ_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Generate a ${count}-question multiple-choice quiz for a student studying ${input.subject}.\n\nMaterial:\n${input.content}`,
      },
    ]

    const result = await aiClient.chat(messages, {
      model: getDefaultModel('quiz'),
      maxTokens: 2000,
      temperature: 0.5,
    })

    const parsed = aiClient.extractJson<{ title: string; questions: GeneratedQuizQuestion[] }>(result.content)

    if (!parsed?.questions?.length) {
      return { ...mockQuiz(input.subject, count), model: 'mock-fallback' }
    }

    return {
      questions: parsed.questions,
      title: parsed.title ?? 'AI-Generated Quiz',
      subject: input.subject,
      model: result.model,
      tokensUsed: result.tokensUsed,
    }
  } catch {
    return { ...mockQuiz(input.subject, count), model: 'mock-fallback' }
  }
}

// ─── Mock ─────────────────────────────────────────────────────────────────────

function mockQuiz(subject: SubjectId, count: number): QuizResponse {
  const allQuestions: GeneratedQuizQuestion[] = [
    {
      question: 'What is the average-case time complexity of inserting into a hash table?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
      correctAnswer: 0,
      explanation: 'A hash function maps the key directly to an index, so insertion is O(1) on average. Worst case is O(n) when all keys collide into the same bucket.',
    },
    {
      question: 'Which sorting algorithm guarantees O(n log n) in all cases?',
      options: ['Quick Sort', 'Bubble Sort', 'Merge Sort', 'Insertion Sort'],
      correctAnswer: 2,
      explanation: 'Merge Sort always divides the array in half and merges in O(n) time per level, giving O(n log n) worst case. Quick Sort degrades to O(n²) with bad pivot selection.',
    },
    {
      question: 'What does "amortized O(1)" mean for dynamic array append?',
      options: [
        'Every single append is exactly O(1)',
        'The average cost per append over many operations is O(1)',
        'The worst-case append is O(1)',
        'The memory used per append is O(1)',
      ],
      correctAnswer: 1,
      explanation: 'When the array is full, it doubles (O(n) copy). But this happens so rarely that averaging the cost over all appends gives O(1). This is amortised analysis.',
    },
    {
      question: 'What activation function is most commonly used in hidden layers today?',
      options: ['Sigmoid', 'Tanh', 'ReLU', 'Softmax'],
      correctAnswer: 2,
      explanation: 'ReLU (f(x) = max(0,x)) avoids the vanishing gradient problem of sigmoid/tanh and is computationally cheap. Softmax is used in the output layer for multi-class classification.',
    },
    {
      question: 'The p-series Σ(1/nᵖ) converges when:',
      options: ['p > 0', 'p > 1', 'p ≥ 1', 'p < 1'],
      correctAnswer: 1,
      explanation: 'The integral test proves Σ(1/nᵖ) converges if and only if p > 1. The harmonic series (p=1) famously diverges despite its terms approaching 0.',
    },
    {
      question: 'In a Transformer, what does multi-head attention allow?',
      options: [
        'Processing tokens in parallel on multiple GPUs',
        'Attending to different representation subspaces simultaneously',
        'Using multiple different activation functions',
        'Running multiple loss functions at once',
      ],
      correctAnswer: 1,
      explanation: 'Each "head" learns a different linear projection of Q, K, V — allowing the model to attend to syntax, semantics, coreference, etc. simultaneously. Results are concatenated and projected.',
    },
  ]

  return {
    questions: allQuestions.slice(0, Math.min(count, allQuestions.length)),
    title: `${subject.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} — Practice Quiz`,
    subject,
    model: 'mock',
    tokensUsed: 0,
  }
}
