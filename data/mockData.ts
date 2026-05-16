import type {
  Subject,
  StudyMaterial,
  AIInsight,
  LearningHealthScore,
  WeeklyStudyTrend,
  SubjectStudy,
  ChatMessage,
  Flashcard,
  Quiz,
  StudySession,
  StudyGoal,
} from '@/types'

// ─── Subject Meta ──────────────────────────────────────────────────────────────

export const SUBJECT_META: Record<
  string,
  { label: string; color: string; icon: string; bg: string }
> = {
  'mathematics':      { label: 'Mathematics',      color: '#8b5cf6', icon: 'Calculator',    bg: 'bg-violet-500/20'  },
  'computer-science': { label: 'Computer Science',  color: '#6366f1', icon: 'Code2',         bg: 'bg-indigo-500/20'  },
  'physics':          { label: 'Physics',            color: '#06b6d4', icon: 'Atom',          bg: 'bg-cyan-500/20'    },
  'literature':       { label: 'Literature',         color: '#10b981', icon: 'BookOpen',      bg: 'bg-emerald-500/20' },
  'machine-learning': { label: 'Machine Learning',   color: '#f59e0b', icon: 'Brain',         bg: 'bg-amber-500/20'   },
  'history':          { label: 'History',            color: '#f97316', icon: 'Landmark',      bg: 'bg-orange-500/20'  },
  'biology':          { label: 'Biology',            color: '#22c55e', icon: 'Dna',           bg: 'bg-green-500/20'   },
  'chemistry':        { label: 'Chemistry',          color: '#ec4899', icon: 'FlaskConical',  bg: 'bg-pink-500/20'    },
  'economics':        { label: 'Economics',          color: '#84cc16', icon: 'TrendingUp',    bg: 'bg-lime-500/20'    },
  'philosophy':       { label: 'Philosophy',         color: '#a78bfa', icon: 'Lightbulb',     bg: 'bg-purple-500/20'  },
  'other':            { label: 'Other',              color: '#64748b', icon: 'MoreHorizontal', bg: 'bg-slate-500/20'  },
}

// ─── Mock Subjects ─────────────────────────────────────────────────────────────

export const MOCK_SUBJECTS: Subject[] = [
  {
    id: 'sub_001',
    userId: 'user_demo',
    name: 'Calculus II',
    slug: 'mathematics',
    description: 'Integration techniques, sequences, and series',
    targetHours: 20,
    completedHours: 14.5,
    materialCount: 8,
    period: 'monthly',
    aiRecommended: false,
    color: '#8b5cf6',
    icon: 'Calculator',
    createdAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'sub_002',
    userId: 'user_demo',
    name: 'Data Structures',
    slug: 'computer-science',
    description: 'Trees, graphs, hash maps and algorithm complexity',
    targetHours: 25,
    completedHours: 21,
    materialCount: 12,
    period: 'monthly',
    aiRecommended: true,
    color: '#6366f1',
    icon: 'Code2',
    createdAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'sub_003',
    userId: 'user_demo',
    name: 'Quantum Physics',
    slug: 'physics',
    description: 'Wave functions, superposition, and entanglement',
    targetHours: 15,
    completedHours: 6,
    materialCount: 5,
    period: 'monthly',
    aiRecommended: true,
    color: '#06b6d4',
    icon: 'Atom',
    createdAt: '2026-03-10T00:00:00Z',
  },
  {
    id: 'sub_004',
    userId: 'user_demo',
    name: 'Machine Learning',
    slug: 'machine-learning',
    description: 'Supervised learning, neural networks, and optimization',
    targetHours: 30,
    completedHours: 28,
    materialCount: 15,
    period: 'monthly',
    aiRecommended: true,
    color: '#f59e0b',
    icon: 'Brain',
    createdAt: '2026-02-15T00:00:00Z',
  },
  {
    id: 'sub_005',
    userId: 'user_demo',
    name: 'Modern Literature',
    slug: 'literature',
    description: 'Post-war fiction, critical theory, and narrative analysis',
    targetHours: 10,
    completedHours: 7,
    materialCount: 6,
    period: 'monthly',
    aiRecommended: false,
    color: '#10b981',
    icon: 'BookOpen',
    createdAt: '2026-03-05T00:00:00Z',
  },
  {
    id: 'sub_006',
    userId: 'user_demo',
    name: 'World History',
    slug: 'history',
    description: '20th century geopolitics and post-colonial theory',
    targetHours: 12,
    completedHours: 4,
    materialCount: 4,
    period: 'monthly',
    aiRecommended: false,
    color: '#f97316',
    icon: 'Landmark',
    createdAt: '2026-03-15T00:00:00Z',
  },
]

// ─── Mock Study Materials ──────────────────────────────────────────────────────

export const MOCK_MATERIALS: StudyMaterial[] = [
  {
    id: 'mat_001',
    userId: 'user_demo',
    title: 'Integration by Parts — Chapter 7',
    subject: 'mathematics',
    type: 'pdf',
    status: 'summarized',
    uploadDate: '2026-05-01',
    description: 'Covers u-substitution, integration by parts, and trigonometric substitution',
    summary: 'Chapter 7 introduces integration by parts using the formula ∫u dv = uv − ∫v du. Key techniques include choosing u and dv strategically, tabular integration for repeated integration, and applications to definite integrals.',
    tags: ['integration', 'calculus', 'chapter-7'],
    pages: 45,
    source: 'Stewart Calculus 8th Ed.',
  },
  {
    id: 'mat_002',
    userId: 'user_demo',
    title: 'Big O Notation & Complexity Analysis',
    subject: 'computer-science',
    type: 'note',
    status: 'mastered',
    uploadDate: '2026-05-02',
    description: 'Personal notes on time complexity, space complexity, and amortized analysis',
    summary: 'Big O describes the upper bound of algorithm complexity. Key classes: O(1) constant, O(log n) logarithmic, O(n) linear, O(n²) quadratic. Amortized analysis averages cost over sequences of operations — useful for dynamic arrays.',
    tags: ['algorithms', 'complexity', 'cs-fundamentals'],
    wordCount: 1200,
  },
  {
    id: 'mat_003',
    userId: 'user_demo',
    title: 'Quantum Wave Functions — Lecture Notes',
    subject: 'physics',
    type: 'note',
    status: 'pending',
    uploadDate: '2026-05-03',
    description: 'Prof. Chen lecture slides + personal annotations on Schrödinger equation',
    tags: ['quantum', 'wave-function', 'schrodinger'],
    pages: 22,
    source: 'PHY 401 Spring 2026',
  },
  {
    id: 'mat_004',
    userId: 'user_demo',
    title: 'Neural Networks from Scratch',
    subject: 'machine-learning',
    type: 'pdf',
    status: 'summarized',
    uploadDate: '2026-05-04',
    description: 'Andrej Karpathy\'s guide to building neural networks without libraries',
    summary: 'Neural networks consist of layers of neurons with weights and biases. Forward pass computes activations; backward pass computes gradients via chain rule. Key components: loss functions (MSE, cross-entropy), optimizers (SGD, Adam), activation functions (ReLU, sigmoid, tanh).',
    tags: ['neural-networks', 'backpropagation', 'deep-learning'],
    pages: 88,
    source: 'Karpathy — makemore series',
  },
  {
    id: 'mat_005',
    userId: 'user_demo',
    title: 'The Great Gatsby — Analysis Essay',
    subject: 'literature',
    type: 'note',
    status: 'reviewed',
    uploadDate: '2026-05-05',
    description: 'Critical analysis of symbolism, the American Dream, and Fitzgerald\'s prose',
    summary: 'Fitzgerald uses Gatsby\'s green light to symbolize the unattainable American Dream. The Valley of Ashes represents moral decay beneath prosperity. Nick\'s unreliable narration forces readers to question idealism vs. reality.',
    tags: ['fitzgerald', 'symbolism', 'american-dream'],
    wordCount: 3400,
  },
  {
    id: 'mat_006',
    userId: 'user_demo',
    title: 'Binary Trees & BST Operations',
    subject: 'computer-science',
    type: 'pdf',
    status: 'mastered',
    uploadDate: '2026-05-06',
    description: 'Complete guide to binary search trees, AVL trees, and traversal algorithms',
    summary: 'BST maintains ordering property: left child < root < right child. Operations: insert O(h), search O(h), delete O(h). AVL trees balance via rotations to guarantee O(log n). Traversals: in-order (sorted), pre-order (copy), post-order (delete).',
    tags: ['trees', 'bst', 'avl'],
    pages: 34,
    source: 'CLRS 4th Edition',
  },
  {
    id: 'mat_007',
    userId: 'user_demo',
    title: 'Transformer Architecture Deep Dive',
    subject: 'machine-learning',
    type: 'pdf',
    status: 'summarized',
    uploadDate: '2026-05-07',
    description: 'Attention is All You Need — annotated paper with implementation notes',
    summary: 'Transformers replace RNNs with self-attention mechanisms. Multi-head attention allows the model to attend to information from different positions simultaneously. Positional encoding injects sequence order. Architecture: encoder-decoder with layer normalization and residual connections.',
    tags: ['transformers', 'attention', 'nlp'],
    pages: 15,
    source: 'Vaswani et al. 2017',
  },
  {
    id: 'mat_008',
    userId: 'user_demo',
    title: 'Cold War Origins — Lecture Slides',
    subject: 'history',
    type: 'pdf',
    status: 'pending',
    uploadDate: '2026-05-08',
    description: 'Causes of the Cold War, Truman Doctrine, Marshall Plan, NATO formation',
    tags: ['cold-war', 'truman', 'nato'],
    pages: 28,
    source: 'HIST 302 — Prof. Williams',
  },
  {
    id: 'mat_009',
    userId: 'user_demo',
    title: 'Dynamic Programming Masterclass',
    subject: 'computer-science',
    type: 'video',
    status: 'reviewed',
    uploadDate: '2026-05-09',
    description: 'MIT 6.006 — Lecture 19: Dynamic Programming I',
    summary: 'DP breaks problems into overlapping subproblems. Two approaches: top-down memoization (recursive + cache) and bottom-up tabulation (iterative). Classic problems: Fibonacci, longest common subsequence, 0/1 knapsack, edit distance.',
    tags: ['dp', 'optimization', 'algorithms'],
    source: 'MIT OpenCourseWare',
  },
  {
    id: 'mat_010',
    userId: 'user_demo',
    title: 'Sequences & Series — Practice Problems',
    subject: 'mathematics',
    type: 'pdf',
    status: 'reviewed',
    uploadDate: '2026-05-10',
    description: '150 practice problems on convergence tests, power series, and Taylor expansions',
    tags: ['series', 'convergence', 'taylor'],
    pages: 62,
    source: 'MIT OCW 18.01',
  },
  {
    id: 'mat_011',
    userId: 'user_demo',
    title: 'Gradient Descent & Optimization',
    subject: 'machine-learning',
    type: 'note',
    status: 'mastered',
    uploadDate: '2026-05-11',
    description: 'SGD, momentum, Adam, learning rate schedules, and loss landscapes',
    summary: 'Gradient descent updates weights in the direction of negative gradient. SGD adds stochasticity for scalability. Momentum accumulates gradients for faster convergence. Adam combines momentum with adaptive learning rates — most popular for deep learning.',
    tags: ['optimization', 'sgd', 'adam'],
    wordCount: 2100,
  },
  {
    id: 'mat_012',
    userId: 'user_demo',
    title: 'Hamlet — Close Reading & Themes',
    subject: 'literature',
    type: 'note',
    status: 'reviewed',
    uploadDate: '2026-05-12',
    description: 'Act-by-act analysis of Hamlet with focus on mortality, revenge, and madness',
    tags: ['shakespeare', 'hamlet', 'drama'],
    wordCount: 4200,
  },
]

// ─── Mock AI Insights ──────────────────────────────────────────────────────────

export const MOCK_INSIGHTS: AIInsight[] = [
  {
    id: 'ins_001',
    type: 'warning',
    title: 'Physics Needs Attention',
    description:
      'You haven\'t reviewed Quantum Physics in 4 days. Based on spaced repetition principles, concepts like wave functions may fade without reinforcement soon.',
    subject: 'physics',
    actionable: 'Schedule a 30-minute review session for Quantum Wave Functions today.',
    priority: 'high',
    createdAt: '2026-05-16T08:00:00Z',
  },
  {
    id: 'ins_002',
    type: 'prediction',
    title: 'ML Mastery Within Reach',
    description:
      'At your current pace, you\'ll complete all Machine Learning materials in 3 days. You\'re 93% through the subject with strong flashcard retention.',
    subject: 'machine-learning',
    actionable: 'Focus on the Transformer Architecture material to close the final gap.',
    priority: 'high',
    createdAt: '2026-05-16T08:01:00Z',
  },
  {
    id: 'ins_003',
    type: 'achievement',
    title: '7-Day Study Streak!',
    description:
      'You\'ve studied every day for the past 7 days — your longest streak yet. Consistency is the #1 predictor of long-term retention.',
    actionable: 'Keep it up! Even 20 minutes tomorrow maintains your streak.',
    priority: 'low',
    createdAt: '2026-05-16T08:02:00Z',
  },
  {
    id: 'ins_004',
    type: 'tip',
    title: 'Spaced Repetition Opportunity',
    description:
      'You have 14 flashcards due for review today. Reviewing them now takes ~10 minutes and dramatically improves 30-day retention.',
    actionable: 'Open the Flashcards section and complete today\'s review queue.',
    priority: 'medium',
    createdAt: '2026-05-16T08:03:00Z',
  },
  {
    id: 'ins_005',
    type: 'tip',
    title: 'History Study Gap',
    description:
      'World History has only 33% of your target hours this month. With 16 days left, studying 30 min/day would close the gap.',
    subject: 'history',
    actionable: 'Upload your Cold War notes and generate a quick summary to re-engage.',
    priority: 'medium',
    createdAt: '2026-05-16T08:04:00Z',
  },
  {
    id: 'ins_006',
    type: 'achievement',
    title: 'Data Structures Champion',
    description:
      'You\'ve mastered 84% of Data Structures material with an average quiz score of 91%. This subject is well in control.',
    subject: 'computer-science',
    priority: 'low',
    createdAt: '2026-05-16T08:05:00Z',
  },
]

// ─── Weekly Study Trend ────────────────────────────────────────────────────────

export const MOCK_WEEKLY_TREND: WeeklyStudyTrend[] = [
  { week: 'Nov W3', hoursStudied: 8,  flashcardsReviewed: 45,  materialsCompleted: 2 },
  { week: 'Nov W4', hoursStudied: 12, flashcardsReviewed: 72,  materialsCompleted: 3 },
  { week: 'Dec W1', hoursStudied: 10, flashcardsReviewed: 58,  materialsCompleted: 2 },
  { week: 'Dec W2', hoursStudied: 15, flashcardsReviewed: 90,  materialsCompleted: 4 },
  { week: 'Dec W3', hoursStudied: 14, flashcardsReviewed: 84,  materialsCompleted: 4 },
  { week: 'Dec W4', hoursStudied: 18, flashcardsReviewed: 110, materialsCompleted: 5 },
]

// ─── Subject Study Breakdown ───────────────────────────────────────────────────

export const MOCK_SUBJECT_STUDY: SubjectStudy[] = [
  { subjectId: 'machine-learning', subjectName: 'Machine Learning',  hoursStudied: 28,   percentage: 34.6, color: '#f59e0b' },
  { subjectId: 'computer-science', subjectName: 'Computer Science',  hoursStudied: 21,   percentage: 25.9, color: '#6366f1' },
  { subjectId: 'mathematics',      subjectName: 'Mathematics',       hoursStudied: 14.5, percentage: 17.9, color: '#8b5cf6' },
  { subjectId: 'literature',       subjectName: 'Literature',        hoursStudied: 7,    percentage: 8.6,  color: '#10b981' },
  { subjectId: 'physics',          subjectName: 'Physics',           hoursStudied: 6,    percentage: 7.4,  color: '#06b6d4' },
  { subjectId: 'history',          subjectName: 'History',           hoursStudied: 4,    percentage: 4.9,  color: '#f97316' },
  { subjectId: 'other',            subjectName: 'History',           hoursStudied: 0.5,  percentage: 0.6,  color: '#64748b' },
]

// ─── Learning Health Score ─────────────────────────────────────────────────────

export const MOCK_LEARNING_SCORE: LearningHealthScore = {
  overall: 81,
  trend: 'up',
  explanation:
    'Your learning health is excellent. Consistent daily study habits and strong flashcard retention are your biggest strengths. Focus on Physics and History to achieve a more balanced subject portfolio.',
  dimensions: [
    { label: 'Study Consistency', score: 92, description: '7-day streak, daily average 2.3h' },
    { label: 'Retention Rate',    score: 85, description: 'Flashcard accuracy at 84%' },
    { label: 'Subject Balance',   score: 68, description: 'Physics & History under target' },
    { label: 'Material Coverage', score: 79, description: '9 of 12 materials reviewed' },
  ],
  tips: [
    'Review Physics materials at least 3x per week to improve subject balance.',
    'Generate quizzes after each new material upload to test active recall.',
    'Use the Planner to schedule dedicated World History sessions this week.',
  ],
}

// ─── Mock Flashcards ───────────────────────────────────────────────────────────

export const MOCK_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc_001',
    userId: 'user_demo',
    materialId: 'mat_002',
    subjectId: 'computer-science',
    front: 'What is the time complexity of binary search?',
    back: 'O(log n) — the search space halves with each comparison. Works only on sorted arrays.',
    difficulty: 'easy',
    timesReviewed: 8,
    lastReviewed: '2026-05-15',
    nextReview: '2026-05-17',
  },
  {
    id: 'fc_002',
    userId: 'user_demo',
    materialId: 'mat_004',
    subjectId: 'machine-learning',
    front: 'What is backpropagation?',
    back: 'An algorithm that computes gradients by applying the chain rule backwards through the computation graph. Used to update neural network weights via gradient descent.',
    difficulty: 'medium',
    timesReviewed: 5,
    lastReviewed: '2026-05-14',
    nextReview: '2026-05-16',
  },
  {
    id: 'fc_003',
    userId: 'user_demo',
    materialId: 'mat_001',
    subjectId: 'mathematics',
    front: 'State the Integration by Parts formula',
    back: '∫u dv = uv − ∫v du\n\nChoose u using LIATE: Logarithmic, Inverse trig, Algebraic, Trigonometric, Exponential (highest priority to lowest).',
    difficulty: 'medium',
    timesReviewed: 4,
    lastReviewed: '2026-05-13',
    nextReview: '2026-05-16',
  },
  {
    id: 'fc_004',
    userId: 'user_demo',
    materialId: 'mat_007',
    subjectId: 'machine-learning',
    front: 'What problem do Transformers solve that RNNs couldn\'t?',
    back: 'Transformers use self-attention to process all tokens in parallel (unlike RNNs which process sequentially), enabling much better long-range dependency modeling and training parallelism.',
    difficulty: 'hard',
    timesReviewed: 3,
    lastReviewed: '2026-05-12',
    nextReview: '2026-05-16',
  },
  {
    id: 'fc_005',
    userId: 'user_demo',
    materialId: 'mat_006',
    subjectId: 'computer-science',
    front: 'What is an AVL tree?',
    back: 'A self-balancing BST where the heights of the two child subtrees of any node differ by at most one. Balance is maintained via rotations (left, right, left-right, right-left) on insert/delete.',
    difficulty: 'hard',
    timesReviewed: 6,
    lastReviewed: '2026-05-15',
    nextReview: '2026-05-18',
  },
  {
    id: 'fc_006',
    userId: 'user_demo',
    materialId: 'mat_005',
    subjectId: 'literature',
    front: 'What does the green light in The Great Gatsby symbolize?',
    back: 'The green light at the end of Daisy\'s dock symbolizes Gatsby\'s dreams and desires — particularly the unattainable nature of the American Dream. It represents hope and the impossibility of repeating the past.',
    difficulty: 'easy',
    timesReviewed: 7,
    lastReviewed: '2026-05-15',
    nextReview: '2026-05-19',
  },
  {
    id: 'fc_007',
    userId: 'user_demo',
    subjectId: 'mathematics',
    front: 'What is the Ratio Test for series convergence?',
    back: 'For series Σaₙ, compute L = lim|aₙ₊₁/aₙ| as n→∞.\n• L < 1: absolutely convergent\n• L > 1: diverges\n• L = 1: inconclusive',
    difficulty: 'hard',
    timesReviewed: 2,
    lastReviewed: '2026-05-11',
    nextReview: '2026-05-16',
  },
  {
    id: 'fc_008',
    userId: 'user_demo',
    materialId: 'mat_011',
    subjectId: 'machine-learning',
    front: 'How does the Adam optimizer work?',
    back: 'Adam combines momentum (first moment — mean of gradients) with RMSProp (second moment — uncentered variance). Uses bias correction for initial steps. Update: θ = θ − α·m̂/√(v̂+ε), where m̂ and v̂ are bias-corrected estimates.',
    difficulty: 'hard',
    timesReviewed: 4,
    lastReviewed: '2026-05-14',
    nextReview: '2026-05-17',
  },
]

// ─── Mock Quizzes ──────────────────────────────────────────────────────────────

export const MOCK_QUIZZES: Quiz[] = [
  {
    id: 'quiz_001',
    userId: 'user_demo',
    subjectId: 'computer-science',
    materialId: 'mat_002',
    title: 'Algorithm Complexity Fundamentals',
    totalQuestions: 5,
    score: 90,
    completedAt: '2026-05-14T14:30:00Z',
    createdAt: '2026-05-14T14:00:00Z',
    questions: [
      {
        id: 'q_001',
        question: 'What is the time complexity of inserting into a hash table on average?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
        correctAnswer: 0,
        explanation: 'Hash tables achieve O(1) average-case insertion because a hash function maps keys directly to indices without traversal.',
      },
      {
        id: 'q_002',
        question: 'Which sorting algorithm has the best worst-case time complexity?',
        options: ['Quick Sort', 'Bubble Sort', 'Merge Sort', 'Selection Sort'],
        correctAnswer: 2,
        explanation: 'Merge Sort guarantees O(n log n) in all cases. Quick Sort degrades to O(n²) in the worst case (already-sorted arrays with naive pivot selection).',
      },
      {
        id: 'q_003',
        question: 'What does "amortized O(1)" mean for dynamic array append?',
        options: [
          'Every append is exactly O(1)',
          'The average cost per operation over many operations is O(1)',
          'The worst case is O(1)',
          'The space used is O(1)',
        ],
        correctAnswer: 1,
        explanation: 'Dynamic arrays double in size when full (O(n) copy) but this happens rarely. Averaging the cost over all appends gives O(1) amortized.',
      },
      {
        id: 'q_004',
        question: 'What is the space complexity of recursive DFS on a graph with V vertices?',
        options: ['O(1)', 'O(V)', 'O(V²)', 'O(E)'],
        correctAnswer: 1,
        explanation: 'The call stack depth in DFS can reach V in the worst case (a linear chain graph), so space complexity is O(V).',
      },
      {
        id: 'q_005',
        question: 'Which complexity class grows faster asymptotically?',
        options: ['O(n log n)', 'O(n^1.5)', 'O(n log n) and O(n^1.5) grow at the same rate', 'Cannot be determined'],
        correctAnswer: 1,
        explanation: 'O(n^1.5) grows faster than O(n log n) because log n grows slower than n^0.5 for large n.',
      },
    ],
  },
  {
    id: 'quiz_002',
    userId: 'user_demo',
    subjectId: 'machine-learning',
    materialId: 'mat_004',
    title: 'Neural Network Basics',
    totalQuestions: 4,
    score: 75,
    completedAt: '2026-05-13T10:00:00Z',
    createdAt: '2026-05-13T09:30:00Z',
    questions: [
      {
        id: 'q_006',
        question: 'What activation function is most commonly used in hidden layers today?',
        options: ['Sigmoid', 'Tanh', 'ReLU', 'Softmax'],
        correctAnswer: 2,
        explanation: 'ReLU (Rectified Linear Unit) f(x) = max(0,x) is preferred because it avoids vanishing gradients and is computationally efficient.',
      },
      {
        id: 'q_007',
        question: 'What is the vanishing gradient problem?',
        options: [
          'Weights become too large during training',
          'Gradients shrink exponentially in earlier layers, halting learning',
          'The loss function reaches zero too quickly',
          'The network overfits the training data',
        ],
        correctAnswer: 1,
        explanation: 'In deep networks, gradients are multiplied through many layers during backprop. Sigmoid/tanh saturate, causing gradients to shrink toward zero in early layers.',
      },
      {
        id: 'q_008',
        question: 'What does a softmax output layer produce?',
        options: [
          'Binary 0/1 predictions',
          'Raw unnormalized scores',
          'A probability distribution over classes summing to 1',
          'The index of the most likely class',
        ],
        correctAnswer: 2,
        explanation: 'Softmax converts raw logits into probabilities: σ(xᵢ) = eˣⁱ / Σeˣʲ. All outputs are positive and sum to 1, suitable for multi-class classification.',
      },
      {
        id: 'q_009',
        question: 'What is dropout used for in neural networks?',
        options: [
          'Speeding up training by skipping layers',
          'Reducing overfitting by randomly deactivating neurons during training',
          'Initializing weights to small values',
          'Normalizing inputs to the network',
        ],
        correctAnswer: 1,
        explanation: 'Dropout randomly sets neuron activations to zero with probability p during training, preventing co-adaptation and acting as an ensemble of many smaller networks.',
      },
    ],
  },
  {
    id: 'quiz_003',
    userId: 'user_demo',
    subjectId: 'mathematics',
    title: 'Integration Techniques',
    totalQuestions: 4,
    createdAt: '2026-05-16T08:00:00Z',
    questions: [
      {
        id: 'q_010',
        question: 'What is ∫x·eˣ dx ?',
        options: ['eˣ(x - 1) + C', 'x·eˣ + C', 'eˣ + C', 'x²·eˣ/2 + C'],
        correctAnswer: 0,
        explanation: 'Using integration by parts with u = x, dv = eˣ dx: uv - ∫v du = x·eˣ - ∫eˣ dx = x·eˣ - eˣ + C = eˣ(x-1) + C.',
      },
      {
        id: 'q_011',
        question: 'The p-series Σ(1/nᵖ) converges when:',
        options: ['p > 0', 'p > 1', 'p ≥ 1', 'p < 1'],
        correctAnswer: 1,
        explanation: 'The p-series converges if and only if p > 1. This is proved using the integral test with ∫₁^∞ 1/xᵖ dx.',
      },
      {
        id: 'q_012',
        question: 'What substitution simplifies ∫√(1-x²) dx ?',
        options: ['u = 1 - x²', 'x = sin(θ)', 'x = tan(θ)', 'x = sec(θ)'],
        correctAnswer: 1,
        explanation: 'Trigonometric substitution x = sin(θ) converts 1-x² = cos²(θ), simplifying the square root. The integral becomes ∫cos²(θ) dθ, which uses the half-angle identity.',
      },
      {
        id: 'q_013',
        question: 'What is the radius of convergence of Σ(xⁿ/n!) ?',
        options: ['1', '0', '∞', 'e'],
        correctAnswer: 2,
        explanation: 'Using the ratio test: |aₙ₊₁/aₙ| = |x|/(n+1) → 0 as n→∞ for all x. Since L = 0 < 1 for all x, the series converges for all real x. Radius = ∞.',
      },
    ],
  },
]

// ─── Mock Study Sessions ───────────────────────────────────────────────────────

export const MOCK_SESSIONS: StudySession[] = [
  { id: 'ses_001', userId: 'user_demo', subjectId: 'machine-learning',  date: '2026-05-16', durationMinutes: 90,  notes: 'Finished Transformer paper annotation' },
  { id: 'ses_002', userId: 'user_demo', subjectId: 'computer-science',  date: '2026-05-16', durationMinutes: 60,  notes: 'Dynamic programming practice problems' },
  { id: 'ses_003', userId: 'user_demo', subjectId: 'mathematics',       date: '2026-05-15', durationMinutes: 75,  notes: 'Series convergence tests drill' },
  { id: 'ses_004', userId: 'user_demo', subjectId: 'machine-learning',  date: '2026-05-15', durationMinutes: 120, notes: 'Neural networks from scratch — completed' },
  { id: 'ses_005', userId: 'user_demo', subjectId: 'literature',        date: '2026-05-14', durationMinutes: 45,  notes: 'Hamlet Act 4-5 close reading' },
  { id: 'ses_006', userId: 'user_demo', subjectId: 'computer-science',  date: '2026-05-14', durationMinutes: 90,  notes: 'AVL tree rotations + quiz prep' },
  { id: 'ses_007', userId: 'user_demo', subjectId: 'mathematics',       date: '2026-05-13', durationMinutes: 60,  notes: 'Integration by parts practice' },
  { id: 'ses_008', userId: 'user_demo', subjectId: 'physics',           date: '2026-05-12', durationMinutes: 45,  notes: 'Wave function lecture notes review' },
]

// ─── Mock Study Goals ──────────────────────────────────────────────────────────

export const MOCK_GOALS: StudyGoal[] = [
  {
    id: 'goal_001',
    userId: 'user_demo',
    title: 'Complete Machine Learning Module',
    description: 'Finish all 15 ML materials and achieve 90%+ quiz average',
    targetDate: '2026-05-20',
    completed: false,
    subjectId: 'machine-learning',
    progress: 93,
  },
  {
    id: 'goal_002',
    userId: 'user_demo',
    title: 'Master Data Structures',
    description: 'Review all materials and score 95+ on final quiz',
    targetDate: '2026-05-18',
    completed: false,
    subjectId: 'computer-science',
    progress: 84,
  },
  {
    id: 'goal_003',
    userId: 'user_demo',
    title: 'Study 7 days straight',
    description: 'Maintain daily study habit for a full week',
    targetDate: '2026-05-16',
    completed: true,
    progress: 100,
  },
  {
    id: 'goal_004',
    userId: 'user_demo',
    title: 'Upload & Summarize Physics Notes',
    description: 'Get all QM lecture notes into the system with AI summaries',
    targetDate: '2026-05-22',
    completed: false,
    subjectId: 'physics',
    progress: 40,
  },
  {
    id: 'goal_005',
    userId: 'user_demo',
    title: 'Complete Calculus II Review',
    description: 'Practice all integration techniques and series tests',
    targetDate: '2026-05-30',
    completed: false,
    subjectId: 'mathematics',
    progress: 58,
  },
]

// ─── Sample Chat Messages ──────────────────────────────────────────────────────

export const SAMPLE_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_001',
    role: 'assistant',
    content:
      'Hi! I\'m your Mnemo AI tutor. I can help you understand your study materials, explain difficult concepts, generate practice questions, and create personalized flashcards. What would you like to learn today?',
    timestamp: new Date(Date.now() - 60000).toISOString(),
  },
]

// ─── Suggested Questions ───────────────────────────────────────────────────────

export const SUGGESTED_QUESTIONS = [
  'Explain backpropagation in simple terms',
  'Quiz me on binary search trees',
  'What\'s the intuition behind the Attention mechanism?',
  'Help me understand the Ratio Test for series',
  'Create flashcards for integration techniques',
  'What should I study next based on my progress?',
  'Summarize the key points of dynamic programming',
  'Explain quantum superposition like I\'m 5',
]

// ─── Mock AI Responses ─────────────────────────────────────────────────────────

export const MOCK_AI_RESPONSES: Record<string, string> = {
  default:
    'Based on your study profile, you\'re making excellent progress — especially in Machine Learning and Computer Science. Your **7-day streak** shows strong consistency. I\'d recommend focusing on **Quantum Physics** today, as it\'s been 4 days since your last review and the concepts may start to fade without reinforcement.',

  explain:
    '## Backpropagation Explained\n\nBackpropagation is how neural networks learn from mistakes. Here\'s the intuition:\n\n1. **Forward pass**: Feed input through the network, get a prediction\n2. **Compute loss**: Measure how wrong the prediction was\n3. **Backward pass**: Calculate how much each weight contributed to the error (using chain rule)\n4. **Update weights**: Adjust weights in the direction that reduces the error\n\nThe "chain rule" is key — it lets us efficiently compute gradients layer by layer, from the output back to the input. Without it, training deep networks would be computationally infeasible.',

  quiz:
    'Here\'s a quick quiz on **Binary Search Trees**:\n\n**Q1:** What property must every BST satisfy?\n> For any node N: all values in the left subtree < N, all values in the right subtree > N\n\n**Q2:** What is the average time complexity for BST search?\n> O(h) where h is height — O(log n) for balanced, O(n) worst case\n\n**Q3:** In what order does in-order traversal visit BST nodes?\n> Ascending sorted order (left → root → right)\n\nWant me to generate a full quiz with multiple choice options?',

  flashcard:
    'Here are **AI-generated flashcards** for integration techniques:\n\n**Card 1**\n🔵 Front: State the Integration by Parts formula\n🟢 Back: ∫u dv = uv − ∫v du. Use LIATE to choose u.\n\n**Card 2**\n🔵 Front: When do you use trig substitution?\n🟢 Back: When integrand contains √(a²-x²), √(a²+x²), or √(x²-a²)\n\n**Card 3**\n🔵 Front: What does the Ratio Test tell you?\n🟢 Back: L<1 → converges, L>1 → diverges, L=1 → inconclusive\n\nShall I add these to your Mathematics flashcard deck?',

  progress:
    'Here\'s your **study progress summary**:\n\n📊 **This month:**\n- Total hours: 80.5h across 6 subjects\n- Study streak: 7 days 🔥\n- Materials reviewed: 9 of 12\n- Average quiz score: 83%\n\n🏆 **Strongest subject**: Machine Learning (93% complete)\n⚠️ **Needs attention**: Quantum Physics (last reviewed 4 days ago)\n\n**Recommendation**: Schedule a 45-min Physics session today, then finish the Transformer Architecture material tomorrow to hit your ML completion goal.',

  concept:
    'Great question! Let me explain the **Attention mechanism**:\n\nImagine you\'re translating "The cat sat on the mat" to French. When translating "chat" (cat), you need to attend strongly to "cat" and weakly to other words.\n\n**Self-attention** computes three vectors for each token:\n- **Query (Q)**: "What am I looking for?"\n- **Key (K)**: "What do I contain?"\n- **Value (V)**: "What will I contribute?"\n\nAttention score = softmax(Q·Kᵀ / √dₖ) · V\n\nThe scaling factor √dₖ prevents vanishing gradients with large dimensions. Multi-head attention runs this in parallel across H different representation subspaces, then concatenates the results.',
}
