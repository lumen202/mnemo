import type { MetadataRoute } from 'next'

/**
 * PWA manifest.
 *
 * Reviewing is the one thing in this app that genuinely works offline: the payload is a few
 * hundred bytes per card, the grade is a single write, and students review on transit and in
 * buildings with bad signal. Installing also puts the app on a home screen, which for a habit
 * product is the difference between "a site I remember" and "an icon I see".
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mnemo — AI Study Companion',
    short_name: 'Mnemo',
    description:
      'Spaced-repetition flashcards, quizzes and an AI tutor, built around a schedule that adapts to what you actually remember.',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0e1413',
    theme_color: '#2dd4bf',
    categories: ['education', 'productivity'],
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
    shortcuts: [
      {
        name: 'Review due cards',
        short_name: 'Review',
        description: 'Jump straight into today’s queue',
        url: '/flashcards',
      },
      {
        name: 'Ask the tutor',
        short_name: 'Tutor',
        url: '/assistant',
      },
    ],
  }
}
