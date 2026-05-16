import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mnemo — AI Study Companion',
  description:
    'Your intelligent AI-powered study companion. Upload materials, generate summaries, create flashcards, take quizzes, and get personalized learning insights.',
  keywords: ['AI study', 'flashcards', 'quiz generator', 'study companion', 'AI tutor', 'learning assistant'],
  openGraph: {
    title: 'Mnemo — AI Study Companion',
    description: 'Your intelligent AI-powered study companion.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  )
}
