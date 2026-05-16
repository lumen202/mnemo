interface VaultEntry {
  keywords: string[]
  response: string
}

interface CacheEntry {
  response: string
  timestamp: number
}

const MAX_CACHE_SIZE = 500
const CACHE_TTL_MS = 60 * 60 * 1000

const lruCache = new Map<string, CacheEntry>()

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildCacheKey(message: string, history?: { role: string; content: string }[]): string {
  const base = normalize(message).slice(0, 200)
  if (!history?.length) return base
  const ctx = history
    .slice(-3)
    .map((m) => normalize(m.content).slice(0, 80))
    .join('|')
  return `${ctx}|||${base}`
}

function matchVault(message: string): VaultEntry | null {
  const norm = normalize(message)
  let best: VaultEntry | null = null
  let bestHits = 0

  for (const entry of KNOWLEDGE_VAULT) {
    let hits = 0
    for (const kw of entry.keywords) {
      if (norm.includes(normalize(kw))) hits++
    }
    if (hits > bestHits) {
      bestHits = hits
      best = entry
    }
  }

  return bestHits >= 1 ? best : null
}

export function lookup(
  message: string,
  history?: { role: string; content: string }[]
): { content: string; source: 'vault' | 'cache' } | null {
  const vaultEntry = matchVault(message)
  if (vaultEntry) {
    return { content: vaultEntry.response, source: 'vault' }
  }

  const key = buildCacheKey(message, history)
  const cached = lruCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    lruCache.delete(key)
    lruCache.set(key, cached)
    return { content: cached.response, source: 'cache' }
  }

  return null
}

export function store(
  message: string,
  responseText: string,
  history?: { role: string; content: string }[]
): void {
  const key = buildCacheKey(message, history)

  if (lruCache.size >= MAX_CACHE_SIZE) {
    const oldest = lruCache.keys().next().value
    if (oldest) lruCache.delete(oldest)
  }

  lruCache.set(key, { response: responseText, timestamp: Date.now() })
}

// ─── Pre-computed Knowledge Vault ──────────────────────────────────────────────

const KNOWLEDGE_VAULT: VaultEntry[] = [
  // ── CS / ML ──────────────────────────────────────────────────────────────
  {
    keywords: ['backpropagation', 'backprop', 'back propagation', 'backward pass'],
    response: `## Backpropagation Explained

Backpropagation is how neural networks learn from mistakes. Here's the intuition:

**The big idea:** you feed data forward through a network, measure the error at the output, then propagate that error *backwards* to figure out exactly how much each weight contributed to the mistake — so you know which knobs to turn and by how much.

1. **Forward pass** — Feed input through, compute prediction
2. **Loss computation** — Measure error (cross-entropy for classification, MSE for regression)
3. **Backward pass** — Apply chain rule layer by layer from output → input to compute gradients
4. **Weight update** — Nudge weights in the direction that reduces error (gradient descent)

The chain rule is the mathematical engine here. Without it, you'd need to numerically estimate gradients for millions of parameters — computationally impossible. With it, each layer's gradient is the product of the upstream gradient and the local derivative — clean, efficient, automatic.

**Quick example:** A 3-layer MLP classifying MNIST digits. After forward pass, output says 60% "7" but label is "5". Backprop traces the error signal from the output layer → hidden layer → input layer, assigning blame to every weight along the way.`,
  },
  {
    keywords: ['attention mechanism', 'self-attention', 'self attention', 'transformer attention', 'multi-head attention', 'multi head attention'],
    response: `## The Attention Mechanism

Attention lets a model look at *all* positions simultaneously when processing a sequence — unlike RNNs that compress everything into one hidden state vector.

**Analogy:** You're translating "The cat sat on the mat" to French. When outputting the word for "cat," you should attend strongly to "cat" and weakly to "the" and "sat."

For each token, self-attention computes three projections:
- **Query (Q):** "What am I looking for?"
- **Key (K):** "What do I contain?"
- **Value (V):** "What information will I contribute given attention score?"

**Formula:** \`Attention(Q,K,V) = softmax(QKᵀ / √dₖ) · V\`

The √dₖ scaling prevents dot products from growing too large (more dimensions = bigger dot products = saturated softmax = vanishing gradients).

**Multi-head attention** runs this in parallel across H different learned projections. Each head can focus on different aspects — one head tracks syntax, another tracks coreference, another tracks semantic meaning. Outputs are concatenated and projected back to the model dimension.

This is what makes Transformers parallelizable: every position computed simultaneously, no sequential dependency.`,
  },
  {
    keywords: ['gradient descent', 'sgd', 'stochastic gradient descent', 'optimizer'],
    response: `## Gradient Descent

Gradient descent is the workhorse optimization algorithm for training ML models. The intuition: you're standing on a foggy mountain and want to reach the bottom. You can't see the whole terrain, but you can feel which direction slopes downward — so you take small steps downhill until you reach a valley.

**The math:**
\`θ_new = θ_old − η · ∇L(θ)\`

Where θ are your model parameters, η is the learning rate (step size), and ∇L(θ) is the gradient of the loss with respect to the parameters.

**Key variants:**
| Variant | How it works | Best for |
|---|---|---|
| Batch GD | Uses entire dataset per step | Small datasets, convex problems |
| SGD | One random sample per step | Large datasets, noisy but escapes local minima |
| Mini-batch | Small random batches (32-256) | The standard — GPU-efficient |
| Momentum | Accumulates past gradients for smoother steps | Ravines and saddle points |
| Adam | Adaptive LR per parameter + momentum | Default choice for most DL tasks |

**Learning rate is critical:** too high → diverges, too low → takes forever. Common trick: start at 0.001, decay by 0.1 every N epochs.`,
  },
  {
    keywords: ['neural network', 'deep learning', 'what is a neural network', 'mlp', 'perceptron'],
    response: `## Neural Networks — The Big Picture

A neural network is a stack of layers where each layer transforms its input through a linear operation (weights × input + bias) followed by a nonlinear activation function.

**Building from the ground up:**

**Perceptron (single neuron):** takes weighted sum of inputs, applies step function. Can solve linearly separable problems only (XOR breaks it).

**Multi-layer perceptron (MLP):** input layer → one or more hidden layers → output layer. With nonlinear activations (ReLU, sigmoid, tanh), MLPs can approximate any continuous function (universal approximation theorem).

**The universal recipe for deep learning:**
1. Forward pass to compute predictions
2. Loss function to measure error
3. Backpropagation to compute gradients
4. Gradient descent to update weights
5. Repeat until convergence

**Why "deep"?** Depth (more layers) lets the network learn hierarchical features. In image recognition: early layers detect edges, middle layers detect shapes, deep layers detect objects. Each level composes the previous one.

**Key architectures:** CNNs for images, RNNs/LSTMs for sequences, Transformers for language, GNNs for graphs.`,
  },
  {
    keywords: ['overfitting', 'underfitting', 'overfit', 'bias variance', 'bias-variance'],
    response: `## Overfitting vs. Underfitting

These are the two fundamental failure modes in ML.

**Underfitting (high bias):** Your model is too simple to capture the pattern in the data. Think: fitting a straight line to a parabola. Both training and test error are high.

**Overfitting (high variance):** Your model memorizes the training data including the noise. Think: fitting a 20th-degree polynomial to 10 points. Training error is near zero, but test error is terrible.

**The bias-variance tradeoff:** Simpler models have high bias, low variance. Complex models have low bias, high variance. The sweet spot balances both for minimum total error.

**Solutions:**

| Problem | Fixes |
|---|---|
| Underfitting | More complex model, more features, reduce regularization, train longer |
| Overfitting | More training data, dropout, L1/L2 regularization, early stopping, data augmentation, reduce model size |

**Practical rule of thumb:** If train error >> human error → underfitting. If train error ≪ test error → overfitting. If both are close and low → you nailed it.`,
  },
  {
    keywords: ['linear regression', 'regression', 'line of best fit'],
    response: `## Linear Regression

Linear regression models the relationship between a dependent variable Y and one or more independent variables X by fitting a linear equation:

**Simple (one predictor):** Y = β₀ + β₁X + ε

**Multiple (many predictors):** Y = β₀ + β₁X₁ + β₂X₂ + ... + βₙXₙ + ε

Where β₀ is the intercept, βᵢ are coefficients, and ε is the error term.

**How it works:**
The model finds the line (or hyperplane) that minimizes the sum of squared residuals — the vertical distances between each data point and the line. This is Ordinary Least Squares (OLS).

**Key assumptions** (for valid inference):
1. Linearity — relationship is linear in parameters
2. Independence — observations independent of each other
3. Homoscedasticity — constant variance of residuals
4. Normality — residuals are normally distributed (for hypothesis tests)

**R² (coefficient of determination)** tells you what fraction of variance in Y is explained by X. R²=0.8 means your model explains 80% of the outcome variability.

**When to use it:** Continuous target, linear relationships, interpretability matters, you want statistical significance for each predictor.`,
  },
  {
    keywords: ['logistic regression', 'logistic', 'binary classification', 'sigmoid'],
    response: `## Logistic Regression

Despite the name, logistic regression is a **classification** algorithm — it predicts probabilities of class membership.

**How it works:**
\[
h_θ(x) = σ(θ^Tx) = \frac{1}{1 + e^{-θ^Tx}}
\]

The sigmoid function σ squashes any real value into [0, 1], giving you a probability. Decision boundary: predict class 1 if h_θ(x) ≥ 0.5, else class 0.

**Loss function:** Instead of MSE (which makes a non-convex surface for logistic regression), we use **log loss** (binary cross-entropy):

\[
J(θ) = -\frac{1}{m}\sum[y_i \log(h_θ(x_i)) + (1-y_i)\log(1-h_θ(x_i))]
\]

This is convex — guarantees gradient descent finds the global minimum.

**When to choose logistic over linear:**
| Linear Regression | Logistic Regression |
|---|---|
| Continuous output (price, temperature) | Binary output (spam/not spam, pass/fail) |
| MSE loss | Log loss |
| Unbounded predictions | Bounded [0, 1] (probabilities) |
| Assumes linearity + normality | Assumes linearity in log-odds |

**Multiclass extension:** Softmax regression (multinomial logistic) for 3+ classes.`,
  },
  {
    keywords: ['cnn', 'convolutional neural network', 'convolution', 'convnet'],
    response: `## Convolutional Neural Networks (CNNs)

CNNs are specialized for data with grid-like topology — images, but also 1D signals (audio) and 3D data (video, MRI).

**Core idea:** Instead of connecting every pixel to every neuron (millions of parameters), slide small filters across the input that detect local patterns. This exploits **spatial locality** and drastically reduces parameter count.

**Three key building blocks:**

1. **Convolutional layer:** Slides a learned filter (3×3, 5×5) across the input, computing dot products. Each filter detects a specific feature — horizontal edges, textures, corners.

2. **Pooling layer:** Downsamples by taking max (MaxPool) or average (AvgPool) values in each sliding window. Reduces dimensionality, provides translation invariance.

3. **Fully connected layer:** After conv+pool layers extract features, FC layers combine them for final classification.

**The hierarchy of visual features:**
- Layer 1-2: edges, colors, simple textures
- Layer 3-4: corners, shapes, patterns
- Layer 5-6: object parts (eyes, wheels)
- Layer 7+: full objects

**Classic architectures:** LeNet-5 (1998, digit recognition), AlexNet (2012, ImageNet winner), VGG (deep, uniform 3×3 filters), ResNet (skip connections enable 152+ layers), EfficientNet (compound scaling for efficiency).`,
  },
  {
    keywords: ['rnn', 'recurrent neural network', 'lstm', 'gru', 'sequence model', 'sequential data'],
    response: `## RNNs, LSTMs, and GRUs

**Recurrent Neural Networks (RNNs)** process sequences by maintaining a hidden state that captures information about previous inputs. At each time step t: h_t = f(W·x_t + U·h_{t-1} + b).

**The vanishing gradient problem:** When backpropagating through many time steps, gradients either vanish (→0, no learning) or explode (→∞, unstable). This is fundamental to RNNs — the chain of partial derivatives gets multiplied many times.

**LSTM (Long Short-Term Memory)** solves this with gating:
- **Forget gate:** What old information should we discard?
- **Input gate:** What new information should we store?
- **Output gate:** What should we output at this step?

The key innovation is the **cell state** — a highway running through the entire sequence that allows gradients to flow unchanged across hundreds of time steps. No more vanishing gradient.

**GRU (Gated Recurrent Unit)** is a simpler variant with only 2 gates (reset + update) and no separate cell state. Faster to train, often comparable performance.

**When to use RNNs:** Sequential data where order matters — time series forecasting, speech recognition, language modeling, music generation. For NLP today, Transformers have mostly replaced RNNs due to better parallelism and long-range modeling.`,
  },
  {
    keywords: ['binary search tree', 'bst', 'binary tree', 'tree traversal'],
    response: `## Binary Search Trees (BST)

A BST is a binary tree where for every node N:
- All values in the left subtree < N's value
- All values in the right subtree > N's value

This property makes search, insertion, and deletion all O(h) where h is the tree height.

**Operations:**
- **Search:** Start at root. If target < current, go left. If target > current, go right. Repeat until found or null. O(h).
- **Insert:** Search for the position, add new node as leaf. O(h).
- **Delete:** Three cases — leaf (just remove), one child (replace with child), two children (replace with inorder successor).

**Traversals:**
| Order | Sequence | Result |
|---|---|---|
| Inorder | Left → Root → Right | Values in ascending order |
| Preorder | Root → Left → Right | Copy tree structure |
| Postorder | Left → Right → Root | Delete tree bottom-up |

**Balanced vs unbalanced:** Worst case h = n (degenerate tree, like a linked list). Best case h = log₂n (balanced). **Self-balancing BSTs** (AVL, Red-Black) guarantee O(log n) operations by rebalancing after mutations.

**Real-world uses:** Database indexes (B-trees are BSTs on steroids), sorted maps/sets (TreeMap, TreeSet), file system directories, expression parsing.`,
  },
  {
    keywords: ['big o', 'time complexity', 'complexity analysis', 'algorithm complexity', 'space complexity'],
    response: `## Big O Notation

Big O describes how an algorithm's runtime or memory usage grows as the input size n grows. It captures the **worst-case upper bound** while ignoring constants and lower-order terms.

**Common complexities:**
| Notation | Name | Example |
|---|---|---|
| O(1) | Constant | Array access by index |
| O(log n) | Logarithmic | Binary search |
| O(n) | Linear | Looping through array |
| O(n log n) | Linearithmic | Merge sort, quicksort (avg) |
| O(n²) | Quadratic | Nested loops, bubble sort |
| O(2ⁿ) | Exponential | Brute-force subsets |
| O(n!) | Factorial | Traveling salesman brute-force |

**How to analyze:**
1. Count operations — not lines, but the dominant term
2. Drop constants — O(2n) → O(n)
3. Drop lower-order terms — O(n² + n) → O(n²)
4. Focus on worst case — what's the maximum number of operations for any input of size n?

**Amortized analysis** averages cost across all operations. Dynamic arrays: append is O(1) amortized (most appends are cheap, occasional O(n) resize).`,
  },
  {
    keywords: ['sorting', 'sort algorithm', 'quicksort', 'merge sort', 'bubble sort', 'sorting algorithm'],
    response: `## Sorting Algorithms — Key Comparisons

| Algorithm | Best | Average | Worst | Space | Stable |
|---|---|---|---|---|---|
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) | Yes |
| Insertion Sort | O(n) | O(n²) | O(n²) | O(1) | Yes |
| Selection Sort | O(n²) | O(n²) | O(n²) | O(1) | No |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes |
| Quicksort | O(n log n) | O(n log n) | O(n²) | O(log n) | No |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | O(1) | No |

**Merge Sort:** Divide-and-conquer. Split array in half recursively until each subarray has 1 element (trivially sorted), then merge sorted halves. Guaranteed O(n log n) but needs O(n) extra space. Excellent for linked lists.

**Quicksort:** Pick pivot, partition into ≤ pivot and > pivot, recurse. Average O(n log n), worst O(n²) with bad pivot choice. In-place, cache-friendly. Used in most standard libraries. Use randomized or median-of-three pivot to avoid worst case.

**When to use what:**
- **Insertion sort:** Tiny arrays (n < 50), already-mostly-sorted data
- **Merge sort:** Need stability + guarantee, linked lists
- **Quicksort:** Default general-purpose sort
- **Heap sort:** Need O(n log n) guarantee + O(1) space
- **TimSort (Python/Java default):** Adaptive — combines merge + insertion sort, handles real-world data exceptionally well`,
  },
  {
    keywords: ['reinforcement learning', 'rl', 'q-learning', 'deep q network', 'dqn', 'policy gradient'],
    response: `## Reinforcement Learning

RL is about an **agent** learning to make decisions by interacting with an **environment**. At each time step, the agent observes state s, takes action a, receives reward r, and transitions to a new state s'. The goal: learn a policy that maximizes cumulative reward.

**Key concepts:**
- **Policy π(a|s):** Strategy — what action to take from each state
- **Value function V(s):** Expected future reward from state s
- **Q-function Q(s,a):** Expected future reward from taking action a in state s
- **Reward:** Immediate feedback signal from the environment

**Two main approaches:**

**Model-free RL** (learns by trial and error):
- **Q-Learning:** Learn Q(s,a) by updating with \`Q(s,a) ← Q(s,a) + α[r + γ·max Q(s',a') − Q(s,a)]\`
- **Policy gradient:** Directly optimize policy parameters using gradient ascent on expected reward
- **Actor-Critic:** Combine both — actor learns policy, critic learns value function

**Deep RL** uses neural networks to approximate Q-functions or policies. DQN (2015) achieved human-level Atari by combining Q-learning with DNN + experience replay + target networks.

**Where RL shines:** Game playing (AlphaGo, Dota), robotics, recommendation systems, autonomous driving, dynamic pricing, resource allocation. Use RL when: sequential decisions, delayed rewards, environment can be simulated or interacted with.`,
  },
  {
    keywords: ['sql', 'database query', 'select statement', 'join', 'normalization'],
    response: `## SQL Fundamentals

SQL (Structured Query Language) is how you interact with relational databases.

**Core operations (CRUD):**
\`\`\`sql
SELECT name, grade FROM students WHERE grade >= 85 ORDER BY grade DESC
INSERT INTO students (name, grade) VALUES ('Alice', 92)
UPDATE students SET grade = 95 WHERE name = 'Alice'
DELETE FROM students WHERE grade < 60
\`\`\`

**JOINs — the heart of relational databases:**
| Type | Returns |
|---|---|
| INNER JOIN | Only matching rows in both tables |
| LEFT JOIN | All rows from left + matching from right (NULL if no match) |
| RIGHT JOIN | All rows from right + matching from left |
| FULL JOIN | All rows from both (NULL where no match) |
| CROSS JOIN | Cartesian product (every combination) |

**Aggregation:**
\`\`\`sql
SELECT department, AVG(salary) as avg_sal
FROM employees
GROUP BY department
HAVING AVG(salary) > 50000
ORDER BY avg_sal DESC
\`\`\`

WHERE filters individual rows before grouping. HAVING filters groups after aggregation.

**Normalization** reduces redundancy: 1NF (atomic values), 2NF (eliminate partial dependencies), 3NF (eliminate transitive dependencies). In practice: 3NF is the sweet spot for most applications; denormalize when you need read performance.`,
  },
  {
    keywords: ['python list', 'python dict', 'python set', 'python tuple', 'python data structures', 'list vs tuple'],
    response: `## Python Data Structures

**List:** Mutable, ordered, dynamic array. \`[1, 2, 3]\`. Append is O(1) amortized, insert/delete at front is O(n). Used for sequences where order matters and you might modify them.

**Tuple:** Immutable, ordered. \`(1, 2, 3)\`. Can't be changed after creation. Hashable (can be dict keys). Slightly more memory-efficient than lists. Use for: function returns, coordinates, fixed collections.

**Dict:** Key-value hash map. \`{"a": 1, "b": 2}\`. O(1) average lookup, insert, delete. Keys must be hashable (immutable). From Python 3.7+, dicts preserve insertion order. Use for: lookups, counting frequencies, caching.

**Set:** Unordered collection of unique elements. \`{1, 2, 3}\`. O(1) membership tests, union, intersection, difference. Use for: removing duplicates, membership checks, set operations.

**Choosing the right one:**
| Need | Use |
|---|---|
| Ordered, mutable | List |
| Ordered, immutable, hashable | Tuple |
| Key→value mapping | Dict |
| Unique items, membership tests | Set |
| FIFO | collections.deque |
| Named fields | collections.namedtuple / dataclass`,
  },
  // ── Math ────────────────────────────────────────────────────────────────
  {
    keywords: ['calculus', 'derivative', 'derivative explained', 'what is a derivative'],
    response: `## Derivatives — Intuition

The derivative of a function at a point is the **instantaneous rate of change** — the slope of the tangent line at that point.

**Intuition:** Imagine you're driving. Your speedometer doesn't measure average speed (total distance / total time). It measures instantaneous speed — how fast you're going *right now*, at this exact moment. That's a derivative.

**Formal definition:**
\[
f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}
\]

"What happens to f when I nudge x by a tiny amount h, divided by that nudge?"

**Key rules:**
| Rule | Formula |
|---|---|
| Power | d/dx[xⁿ] = nxⁿ⁻¹ |
| Product | d/dx[f·g] = f'·g + f·g' |
| Chain | d/dx[f(g(x))] = f'(g(x)) · g'(x) |

**Why it matters in ML:** Train models with gradient descent. ∂Loss/∂Weight₅₄₂ tells you exactly how much Loss changes when you tweak that specific weight. That's the derivative — and it's how the network learns.`,
  },
  {
    keywords: ['integration', 'integral', 'what is an integral', 'definite integral'],
    response: `## Integrals — Intuition

Integration is the reverse of differentiation. If a derivative tells you *rate of change*, an integral tells you *accumulation* — the total over an interval.

**Intuition:** If your speedometer (derivative) tells you 60 mph right now, the integral tells you you've traveled 1 mile over the last minute. Speed × time = distance. Integration = summing up tiny speed × tiny time contributions.

**Definite integral:** Area under the curve between a and b.
\[
\int_a^b f(x) \, dx
\]

**Indefinite integral (antiderivative):** A function F whose derivative is f. F'(x) = f(x).

**Fundamental Theorem of Calculus** connects them:
\[
\int_a^b f(x) \, dx = F(b) - F(a)
\]
where F is any antiderivative of f.

**Key integration techniques:**
- **Substitution (u-sub):** Reverse chain rule — ∫f(g(x))·g'(x)dx = ∫f(u)du
- **Integration by parts:** ∫u dv = uv − ∫v du (reverse product rule)
- **Partial fractions:** Decompose rational functions and integrate terms individually

**In ML:** Continuous probability distributions — the probability P(X ≤ x) is the integral of the PDF. Expected values, Bayesian evidence, entropy calculations.`,
  },
  {
    keywords: ['matrix', 'linear algebra', 'eigenvalue', 'eigenvector', 'matrix multiplication'],
    response: `## Linear Algebra — Core Concepts

**Vectors:** Ordered lists of numbers representing points in space, directions, or features. \`v = [3, 4]\` means 3 units horizontally, 4 vertically. Magnitude (length): ||v|| = √(3²+4²) = 5.

**Matrices:** Grids of numbers. An m×n matrix has m rows, n columns. A matrix can represent a linear transformation — it maps input vectors to output vectors by rotating, scaling, shearing, or reflecting them.

**Matrix multiplication:** A·B means "compose the transformations." If B maps x → y and A maps y → z, then A·B maps x → z directly. Dimension rule: (m×n) · (n×p) = (m×p). Not commutative — A·B ≠ B·A in general.

**Determinant:** A scalar that tells you how much a transformation scales area/volume. det(A) = 0 means the transformation collapses some dimensions (singular matrix, not invertible).

**Eigenvalues & eigenvectors:** If A·v = λ·v, then v is an eigenvector and λ is its eigenvalue. The transformation A just scales v by λ without changing its direction. Critical for: PCA (dimensionality reduction), spectral clustering, PageRank, stability analysis, quantum mechanics.

**Dot product v·w = ||v||·||w||·cos(θ):** Measures how aligned two vectors are. Zero = perpendicular. Used everywhere: attention scores in transformers, cosine similarity for search, projections.`,
  },
  {
    keywords: ['probability basics', 'bayes theorem', 'bayes', 'conditional probability', 'probability rules'],
    response: `## Probability Fundamentals

**Basic rules:**
| Rule | Formula |
|---|---|
| Addition (OR) | P(A∪B) = P(A) + P(B) − P(A∩B) |
| Multiplication (AND) | P(A∩B) = P(A) · P(B\|A) |
| Complement | P(not A) = 1 − P(A) |
| Conditional | P(A\|B) = P(A∩B) / P(B) |

**Bayes' Theorem** — the powerhouse:
\[
P(A|B) = \frac{P(B|A) \cdot P(A)}{P(B)}
\]

Translation: update your belief about A (posterior) given evidence B, based on how likely B is under A (likelihood) times your prior belief in A, divided by the overall probability of B.

**Intuition:** You test positive for a rare disease (1 in 10,000). The test is 99% accurate. What's the probability you actually have it?

Not 99%. Bayes says:
P(disease\|positive) = 0.99 × 0.0001 / (0.99×0.0001 + 0.01×0.9999) ≈ 0.98%

The key insight: false positives from the healthy 99.99% massively outnumber true positives from the diseased 0.01%.

**Distributions to know:**
- **Normal:** Bell curve, central limit theorem — sum of many IID variables → normal
- **Binomial:** n independent trials, each success probability p
- **Poisson:** Count of rare events in fixed interval (customer arrivals, decay events)
- **Exponential:** Time between Poisson events (waiting times)`,
  },
  // ── Physics ─────────────────────────────────────────────────────────────
  {
    keywords: ['quantum mechanics', 'quantum physics', 'wave function', 'double slit'],
    response: `## Quantum Mechanics — Key Ideas

Quantum mechanics describes nature at atomic and subatomic scales, where classical physics breaks down.

**Wave-particle duality:** Particles (electrons, photons) behave like waves *and* particles. The famous double-slit experiment: send electrons one at a time through two slits. If you don't measure which slit they go through, they create an interference pattern (wave behavior). If you do measure, the pattern disappears (particle behavior).

**Superposition:** A quantum system can exist in multiple states simultaneously — until measured. Schrödinger's cat is alive and dead (in superposition) until you open the box.

**Measurement:** Measuring a quantum system collapses it from a superposition to a definite state. Before measurement: in a blend of states. After: just one.

**Key principles:**
1. **Quantization:** Energy, angular momentum, spin come in discrete packets
2. **Uncertainty principle:** You can't simultaneously know a particle's exact position and momentum: Δx·Δp ≥ ℏ/2
3. **Entanglement:** Two particles can be correlated such that measuring one instantly determines the state of the other, regardless of distance

**Schrödinger equation** governs how quantum states evolve over time. Wave function Ψ describes the probability amplitude — |Ψ|² gives the probability density of finding a particle at a location.`,
  },
  {
    keywords: ['newton laws', 'newton laws of motion', "newton's first law", 'classical mechanics'],
    response: `## Newton's Laws of Motion

Three laws that form the foundation of classical mechanics:

**First Law (Inertia):** An object remains at rest or in uniform motion unless acted upon by a net force. No force → no acceleration → constant velocity (or rest). This refutes Aristotle's idea that rest is the "natural" state.

**Second Law (F=ma):** \`F = m × a\` — the net force on an object equals its mass times its acceleration. Force causes acceleration, and mass measures resistance to acceleration (inertia). Double the force, double the acceleration. Double the mass, halve the acceleration.

**Third Law (Action-Reaction):** For every force, there's an equal and opposite counter-force. You push down on the ground, the ground pushes up on you. Rocket exhaust pushes backward, the rocket accelerates forward. Forces always come in pairs acting on *different* objects.

**Why they matter:**
- Launch rockets: F=ma tells you the thrust needed for a given acceleration
- Design bridges: calculate forces to ensure structure doesn't accelerate (∑F=0, static equilibrium)
- Predict orbits: F=Gm₁m₂/r² + F=ma combine to derive Kepler's laws
- Everyday: seatbelt stops you because F=ma decelerates your body; crash means large negative acceleration = large force`,
  },
  // ── Study / Meta ────────────────────────────────────────────────────────
  {
    keywords: ['study tips', 'how to study', 'study effectively', 'study techniques', 'best way to study'],
    response: `## Evidence-Based Study Techniques

**Spaced Repetition:** Don't cram. Review material at increasing intervals (1 day → 3 days → 1 week → 1 month). This exploits the spacing effect — memory strengthens when you recall just before forgetting. Use Anki, Quizlet, or Mnemo's flashcards for automated SRS scheduling.

**Active Recall:** Testing yourself is dramatically more effective than re-reading. Close the book and try to explain the concept or answer questions from memory. The effort of retrieval strengthens neural pathways.

**Interleaving:** Mix different topics/subjects within one study session rather than blocking. Solving math problems mixed with physics problems helps you learn to *choose* which technique to use — not just mechanically apply it.

**Elaboration:** Connect new ideas to things you already know. Ask yourself: "How does this relate to X? Why is this true? What if Y changed?" Deeper processing = stronger encoding.

**Feynman Technique:** Can you explain the concept in simple terms to someone who knows nothing about it? If you can't, you don't truly understand it yet. Identify gaps, study, repeat.

**Pomodoro:** 25-minute focused sessions with 5-minute breaks. Prevents burnout, maintains concentration. After 4 pomodoros, take a longer break (15-30 min).

**Sleep is critical:** Memory consolidation happens during sleep. Poor sleep → poor retention regardless of study method.`,
  },
  {
    keywords: ['machine learning roadmap', 'ml roadmap', 'learn machine learning', 'how to learn ml', 'ai roadmap'],
    response: `## Learning Machine Learning — A Roadmap

**Phase 1 — Foundations (2-3 months):**
- Python proficiency: NumPy, Pandas, Matplotlib
- Linear algebra: vectors, matrices, eigenvalues, SVD
- Calculus: derivatives, gradients, partial derivatives
- Probability & statistics: distributions, Bayes' theorem, hypothesis testing

**Phase 2 — Core ML (3-4 months):**
- Supervised learning: linear/logistic regression, decision trees, random forests, SVMs, k-NN
- Model evaluation: train/test split, cross-validation, confusion matrix, precision/recall, ROC
- Gradient descent variants and regularization
- Feature engineering and data preprocessing
- Work on Kaggle competitions — apply what you learn

**Phase 3 — Deep Learning (3-4 months):**
- Neural networks from scratch (then PyTorch)
- CNNs (image classification, transfer learning)
- RNNs/LSTMs (sequence data, time series)
- Transformers and attention mechanisms
- Hands-on: build a classifier, a text generator, a simple chatbot

**Phase 4 — Specialization:**
Choose one: NLP, Computer Vision, RL, or MLOps. Build portfolio projects. Read papers on arXiv. Contribute to open source.

**Top resources:** Andrew Ng's ML Specialization (Coursera), fast.ai, Stanford CS231n/CS224n, "Deep Learning" by Goodfellow et al., Hugging Face course for transformers.`,
  },
  // ── Programming Concepts ─────────────────────────────────────────────────
  {
    keywords: ['recursion', 'recursive', 'recursive function', 'base case'],
    response: `## Recursion

Recursion is when a function calls itself to solve a smaller version of the same problem. Every recursive solution needs:

1. **Base case:** The simplest version — stops the recursion (e.g., factorial of 0 is 1)
2. **Recursive case:** Calls itself with a reduced problem (e.g., n! = n × (n-1)!)

**Example — factorial:**
\`\`\`python
def factorial(n):
    if n == 0:           # base case
        return 1
    return n * factorial(n - 1)  # recursive case
\`\`\`

**How it works:** Each call goes on the call stack. When the base case is reached, results unwind back up: factorial(4) = 4 × 3 × 2 × 1 × 1 = 24.

**Recursion vs Iteration:**
| Aspect | Recursion | Iteration |
|---|---|---|
| Code clarity | Elegant for tree/graph problems | Usually simpler for loops |
| Memory | Uses call stack (O(n) depth) | O(1) extra space |
| Performance | Function call overhead | Usually faster |

**When to use recursion:** Tree traversals, graph DFS, divide-and-conquer (merge sort), backtracking, dynamic programming (top-down with memoization).

**Watch out for:** Infinite recursion (no base case), stack overflow (too deep recursion). Many languages support tail-call optimization to convert recursive calls to jumps (reuses stack frame).`,
  },
  {
    keywords: ['big o', 'time complexity', 'space complexity', 'algorithm analysis', 'complexity classes'],
    response: `## Algorithm Complexity

**Time complexity** measures how runtime scales with input size n. **Space complexity** measures memory usage.

**Common growth rates (from fastest to slowest):**

| Complexity | Name | When n=1000 |
|---|---|---|
| O(1) | Constant | 1 operation |
| O(log n) | Logarithmic | ~10 ops |
| O(n) | Linear | 1,000 ops |
| O(n log n) | Linearithmic | ~10,000 ops |
| O(n²) | Quadratic | 1,000,000 ops |
| O(2ⁿ) | Exponential | ~10³⁰¹ ops |

**Real examples:**
- O(1): Array access by index, hash table lookup
- O(log n): Binary search, balanced BST operations
- O(n): Linear search, finding max element
- O(n log n): Merge sort, heapsort, fast Fourier transform
- O(n²): Bubble sort, nested for loops
- O(2ⁿ): Brute-force subsets, naive Fibonacci

**How to analyze:**
1. Count the dominant operations (loops, recursion depth)
2. Drop constants and lower-order terms
3. For nested loops: multiply (n × m for nested), add (n + m for sequential)

**Amortized analysis:** Average over many operations. Dynamic array append: most are O(1) cheap inserts, occasional O(n) resize → O(1) amortized total.`,
  },
  // ── Caching catch-all ────────────────────────────────────────────────────
  {
    keywords: ['hello', 'hi', 'hey', 'greetings', 'how are you', 'what can you do', 'who are you', 'help', 'what can you help'],
    response: `Hey! I'm Mnemo, your AI study companion. 😊

I can help you with:
- **Explain concepts** — just ask: "Explain backpropagation," "What's a neural network?"
- **Quiz you** — "Quiz me on binary search trees" or ask for practice questions
- **Create flashcards** — say "Generate flashcards for integration techniques"
- **Track progress** — "How am I doing?" or "What should I study next?"
- **Study tips** — "How do I study more effectively?"

I specialize in: Machine Learning, Computer Science, Mathematics, Physics, Biology, Chemistry, History, Economics, Philosophy, and Literature.

What are you studying today?`,
  },
]

export { KNOWLEDGE_VAULT }
export type { VaultEntry }
