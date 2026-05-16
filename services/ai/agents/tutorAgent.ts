import * as aiClient from '../aiClient'
import { getDefaultModel } from '../modelRegistry'
import { TUTOR_SYSTEM_PROMPT } from '../prompts/tutorPrompt'
import type { TutorResponse } from '../types'

// ─── Input ────────────────────────────────────────────────────────────────────

export interface TutorInput {
  message: string
  context?: string
  history?: { role: string; content: string }[]
}

// ─── Agent ────────────────────────────────────────────────────────────────────

export async function run(input: TutorInput): Promise<TutorResponse> {
  if (!aiClient.isConfigured()) {
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 500))
    return { content: selectMockResponse(input.message), model: 'mock', tokensUsed: 0 }
  }

  try {
    const messages: aiClient.Message[] = [
      { role: 'system', content: TUTOR_SYSTEM_PROMPT },
      ...(input.context
        ? [
            { role: 'user' as const, content: `My study context:\n${input.context}` },
            { role: 'assistant' as const, content: 'Understood — I have your study context. What would you like to explore?' },
          ]
        : []),
      ...(input.history ?? []).map((m) => ({
        role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: input.message },
    ]

    const result = await aiClient.chat(messages, {
      model: getDefaultModel('tutoring'),
      maxTokens: 1024,
      temperature: 0.7,
    })

    return { content: result.content, model: result.model, tokensUsed: result.tokensUsed }
  } catch {
    return { content: selectMockResponse(input.message), model: 'mock-fallback', tokensUsed: 0 }
  }
}

// ─── Mock Responses ───────────────────────────────────────────────────────────

function selectMockResponse(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('explain') || m.includes('what is') || m.includes('how does')) return MOCK_EXPLAIN
  if (m.includes('quiz') || m.includes('test me') || m.includes('practice')) return MOCK_QUIZ
  if (m.includes('flashcard') || m.includes('flash card')) return MOCK_FLASHCARD
  if (m.includes('progress') || m.includes('how am i') || m.includes('summary')) return MOCK_PROGRESS
  if (m.includes('attention') || m.includes('transformer') || m.includes('neural') || m.includes('concept')) return MOCK_CONCEPT
  return MOCK_DEFAULT
}

const MOCK_DEFAULT = `Based on your study profile, you're making excellent progress in Machine Learning and Computer Science. Your **7-day streak** shows strong consistency.

I'd recommend focusing on **Quantum Physics** today — it's been 4 days since your last review and concepts like wave functions may start to fade without reinforcement.

What would you like to explore? I can explain a concept, work through problems with you, or help you prepare for an exam.`

const MOCK_EXPLAIN = `## Backpropagation Explained

Backpropagation is how neural networks learn from mistakes. Here's the intuition:

1. **Forward pass** — Feed input through the network, compute a prediction
2. **Compute loss** — Measure how wrong the prediction was (e.g., cross-entropy)
3. **Backward pass** — Use the chain rule to compute how much each weight contributed to the error
4. **Update weights** — Adjust weights in the direction that reduces the error (gradient descent)

**The key insight:** the chain rule lets us propagate error signals backwards through the computation graph, layer by layer. Without it, training deep networks would be computationally infeasible — we'd have to estimate gradients numerically for millions of parameters.

**Concrete example:** if your network predicts 0.9 for class "cat" but the true label is "dog," the loss is large. Backprop computes how much the last layer's weights caused this error, how much the layer before that contributed, and so on — back to the first layer.`

const MOCK_QUIZ = `Here's a quick quiz on **Binary Search Trees**:

**Q1:** What property must every BST satisfy?
> For any node N: all values in the left subtree < N's value, all values in the right subtree > N's value.

**Q2:** What is the time complexity of BST search in the average case?
> O(h) where h is the tree height — O(log n) for a balanced BST, O(n) worst case (degenerate/linear tree).

**Q3:** In what order does in-order traversal visit nodes?
> Ascending sorted order — left subtree → root → right subtree.

Want me to generate a full multiple-choice quiz? Head to the **Quizzes** page and click "Generate Quiz" to get a scored, timed practice set.`

const MOCK_FLASHCARD = `Here are **3 sample flashcards** for Integration Techniques:

**Card 1** (medium)
🔵 Front: State the Integration by Parts formula
🟢 Back: ∫u dv = uv − ∫v du. Use LIATE to choose u: Logarithmic > Inverse trig > Algebraic > Trigonometric > Exponential.

**Card 2** (medium)
🔵 Front: When do you use trigonometric substitution?
🟢 Back: When the integrand contains √(a²−x²) → x = a·sin(θ), √(a²+x²) → x = a·tan(θ), or √(x²−a²) → x = a·sec(θ).

**Card 3** (hard)
🔵 Front: What does the Ratio Test tell you about Σaₙ?
🟢 Back: Compute L = lim|aₙ₊₁/aₙ|. L < 1 → absolutely convergent. L > 1 → diverges. L = 1 → inconclusive.

Head to the **Flashcards** page and click "Generate" to create a full deck from any of your study materials.`

const MOCK_PROGRESS = `## Your Study Summary

**This month:**
- Total hours: 80.5h across 6 subjects
- Study streak: 7 days 🔥
- Materials reviewed: 9 of 12
- Average quiz score: 83%

**Strongest subject**: Machine Learning (93% complete, avg quiz score 88%)
**Needs attention**: Quantum Physics — last reviewed 4 days ago, only 40% of materials covered

**Recommendation:** Schedule a 45-min Physics session today. The wave function lecture notes are the highest-priority material. Then finish the Transformer Architecture PDF to close out your ML goal before the May 20 deadline.`

const MOCK_CONCEPT = `## The Self-Attention Mechanism

The core idea: instead of compressing context into one vector (RNNs), attention lets the model attend to *all* positions simultaneously.

For each token, self-attention computes three projections:
- **Query (Q):** "What am I looking for?"
- **Key (K):** "What do I contain?"
- **Value (V):** "What information will I contribute?"

**Attention formula:**
\`\`\`
Attention(Q, K, V) = softmax(QKᵀ / √dₖ) · V
\`\`\`

The √dₖ scaling prevents vanishing gradients when dimensions are large (dot products grow with dimension, pushing softmax into saturation).

**Multi-head attention** runs this in parallel across H different linear projections (heads). Each head can attend to different semantic aspects — one might track syntax, another coreference. Results are concatenated and projected back.

This is why Transformers parallelise better than RNNs: all positions are computed simultaneously.`
