import * as aiClient from '../aiClient'
import { getDefaultModel } from '../modelRegistry'
import { FLASHCARD_SYSTEM_PROMPT } from '../prompts/flashcardPrompt'
import type { FlashcardResponse, GeneratedFlashcard } from '../types'
import type { SubjectId } from '@/types'

// ─── Input ────────────────────────────────────────────────────────────────────

export interface FlashcardInput {
  content: string
  subject: SubjectId
  count?: number
}

// ─── Agent ────────────────────────────────────────────────────────────────────

export async function run(input: FlashcardInput): Promise<FlashcardResponse> {
  const count = input.count ?? 6

  if (!aiClient.isConfigured()) {
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 400))
    return { flashcards: mockFlashcards(count), subject: input.subject, model: 'mock', tokensUsed: 0 }
  }

  try {
    const messages: aiClient.Message[] = [
      { role: 'system', content: FLASHCARD_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Generate ${count} flashcards for a student studying ${input.subject}.\n\nMaterial:\n${input.content}`,
      },
    ]

    const result = await aiClient.chat(messages, {
      model: getDefaultModel('flashcards'),
      maxTokens: 1500,
      temperature: 0.5,
    })

    const parsed = aiClient.extractJson<{ flashcards: GeneratedFlashcard[] }>(result.content)

    if (!parsed?.flashcards?.length) {
      return { flashcards: mockFlashcards(count), subject: input.subject, model: 'mock-fallback', tokensUsed: 0 }
    }

    return {
      flashcards: parsed.flashcards,
      subject: input.subject,
      model: result.model,
      tokensUsed: result.tokensUsed,
    }
  } catch {
    return { flashcards: mockFlashcards(count), subject: input.subject, model: 'mock-fallback', tokensUsed: 0 }
  }
}

// ─── Mock ─────────────────────────────────────────────────────────────────────

function mockFlashcards(count: number): GeneratedFlashcard[] {
  const pool: GeneratedFlashcard[] = [
    {
      front: 'What is the time complexity of binary search?',
      back: 'O(log n) — the search space halves with each comparison. Requires a sorted array. Space complexity is O(1) iteratively, O(log n) recursively.',
      difficulty: 'easy',
    },
    {
      front: 'What is the difference between BFS and DFS?',
      back: 'BFS (Breadth-First Search) explores level by level using a queue — guarantees shortest path in unweighted graphs. DFS (Depth-First Search) explores as deep as possible using a stack — better for cycle detection, topological sort, and connected components.',
      difficulty: 'medium',
    },
    {
      front: 'What does backpropagation compute?',
      back: 'The gradient of the loss function with respect to each weight in the network, using the chain rule applied backwards through the computation graph. These gradients are then used to update weights via gradient descent.',
      difficulty: 'medium',
    },
    {
      front: 'State the Integration by Parts formula',
      back: '∫u dv = uv − ∫v du\n\nChoose u using LIATE priority (highest to lowest): Logarithmic, Inverse trig, Algebraic, Trigonometric, Exponential.',
      difficulty: 'medium',
    },
    {
      front: 'What is an AVL tree and when does it rebalance?',
      back: 'A self-balancing BST where the heights of any node\'s two child subtrees differ by at most 1. Rebalancing via rotations (left, right, left-right, right-left) occurs on insert or delete when the balance factor leaves [−1, 0, 1].',
      difficulty: 'hard',
    },
    {
      front: 'What problem does the vanishing gradient solve, and how?',
      back: 'In deep networks, gradients shrink exponentially through sigmoid/tanh layers, halting learning in early layers. Solutions: ReLU activation (preserves gradient magnitude), residual connections (skip connections provide gradient highways), batch normalisation, and careful weight initialisation (He, Xavier).',
      difficulty: 'hard',
    },
    {
      front: 'What is the Ratio Test for series convergence?',
      back: 'For series Σaₙ, compute L = lim|aₙ₊₁/aₙ| as n→∞.\n• L < 1: absolutely convergent\n• L > 1 (or ∞): diverges\n• L = 1: inconclusive — try another test',
      difficulty: 'hard',
    },
    {
      front: 'What is dynamic programming? Name the two approaches.',
      back: 'DP solves problems by breaking them into overlapping subproblems and caching results.\n\n1. Top-down (memoisation): recursive + cache (HashMap). Intuitive, only computes needed states.\n2. Bottom-up (tabulation): iterative, fills a table from base cases. Often faster, no stack overhead.',
      difficulty: 'medium',
    },
  ]

  return pool.slice(0, Math.min(count, pool.length))
}
