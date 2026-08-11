/**
 * Mnemo service worker.
 *
 * Scope is deliberately narrow. This does NOT try to make the whole app work offline — an
 * app-shell cache that serves stale dashboards and half-loaded AI responses trades a clear
 * failure for a confusing one. It does two things:
 *
 *   1. serves a real offline page instead of the browser's error, and
 *   2. keeps previously-visited pages and static assets available when the network is gone,
 *      so an interrupted review session survives a tunnel.
 *
 * The other half of offline support — queuing grades so a review is never lost — lives in
 * utils/offlineOutbox.ts, in the page context where IndexedDB and the Supabase client already
 * are. A service worker replaying authenticated writes would need its own copy of the session,
 * which is a second source of truth for auth and not worth it.
 */

const VERSION = 'mnemo-v1'
const SHELL_CACHE = `${VERSION}-shell`
const PAGE_CACHE = `${VERSION}-pages`
const OFFLINE_URL = '/offline'

const PRECACHE = [OFFLINE_URL, '/icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Never cache API traffic. A cached AI answer or a cached due-card list is worse than an
  // honest failure — the whole product is about what is true right now.
  if (url.pathname.startsWith('/api/')) return

  // Navigations: network first, fall back to the last copy of that page, then the offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(PAGE_CACHE).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(async () => {
          const cached = await caches.match(request)
          return cached ?? caches.match(OFFLINE_URL)
        }),
    )
    return
  }

  // Static assets: cache first, they are content-hashed by the build.
  if (url.pathname.startsWith('/_next/static/') || url.pathname.endsWith('.svg')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            const copy = response.clone()
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy))
            return response
          }),
      ),
    )
  }
})

// The page tells the worker when a new version should take over, rather than the worker
// deciding to reload someone mid-review.
self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting()
})
