import type { Metadata } from 'next'
import { Manrope, Fraunces } from 'next/font/google'
import './globals.css'
import { ThemeProvider, themeScript } from '@/components/ThemeProvider'
import NextTopLoader from 'nextjs-toploader'

const sans = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
})

const serif = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
})

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
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${serif.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans min-h-screen bg-background antialiased">
        <NextTopLoader color="#2dd4bf" shadow="0 0 10px #2dd4bf,0 0 5px #2dd4bf" height={2} showSpinner={false} />
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
