import { WifiOff } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Offline — Mnemo' }

/**
 * Shown by the service worker when a navigation fails and no cached copy of that page exists.
 * It states what still works rather than apologising, because the useful thing to know offline
 * is which door is still open.
 */
export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="max-w-md text-center space-y-5">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <WifiOff className="w-6 h-6 text-muted-foreground" aria-hidden />
        </div>
        <h1 className="font-serif text-2xl font-semibold">You&rsquo;re offline</h1>
        <p className="text-muted-foreground">
          Pages you&rsquo;ve already opened still work, and any cards you review are saved on this
          device and sent as soon as you reconnect. Nothing is lost.
        </p>
        <p className="text-sm text-muted-foreground">
          Generating summaries, quizzes and tutor replies needs a connection.
        </p>
        <Link
          href="/flashcards"
          className="inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Go to review
        </Link>
      </div>
    </main>
  )
}
