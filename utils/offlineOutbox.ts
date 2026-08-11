import type { Flashcard } from '@/types'

/**
 * Durable queue for review grades taken while offline.
 *
 * A review is a small, ordered, idempotent-per-card write, and it is also the one action a
 * student will be doing on a train. Losing it is the worst possible failure for this app —
 * it silently corrupts the schedule, which is the product.
 *
 * IndexedDB rather than localStorage: localStorage is synchronous (it blocks the review UI),
 * capped at a few megabytes, and — as this project already learned once — is not reliably
 * present in every JS environment the code runs through.
 */

const DB_NAME = 'mnemo-offline'
const DB_VERSION = 1
const STORE = 'pending-reviews'

export interface PendingReview {
  /** Card id — also the key, so a second grade for the same card supersedes the first. */
  id: string
  updates: Partial<Flashcard>
  /** When the student actually graded it, so a replay does not backdate the schedule. */
  queuedAt: number
}

function isAvailable(): boolean {
  return typeof indexedDB !== 'undefined'
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode)
        const request = run(transaction.objectStore(STORE))
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
        transaction.oncomplete = () => db.close()
      }),
  )
}

/**
 * Record a grade that could not be persisted.
 *
 * Keyed by card id on purpose: if a student grades the same card twice offline, the later grade
 * is the true one, and replaying both would apply an interval computed from stale state.
 */
export async function queueReview(id: string, updates: Partial<Flashcard>): Promise<void> {
  if (!isAvailable()) return
  try {
    await tx('readwrite', (store) => store.put({ id, updates, queuedAt: Date.now() } as PendingReview))
  } catch {
    // A failed queue write must not break the review session the student is in.
  }
}

export async function pendingReviews(): Promise<PendingReview[]> {
  if (!isAvailable()) return []
  try {
    const all = await tx<PendingReview[]>('readonly', (store) => store.getAll() as IDBRequest<PendingReview[]>)
    return (all ?? []).sort((a, b) => a.queuedAt - b.queuedAt)
  } catch {
    return []
  }
}

export async function clearReview(id: string): Promise<void> {
  if (!isAvailable()) return
  try {
    await tx('readwrite', (store) => store.delete(id) as unknown as IDBRequest<undefined>)
  } catch {
    /* nothing to do — it will be retried and deleted next flush */
  }
}

export async function pendingCount(): Promise<number> {
  return (await pendingReviews()).length
}

/**
 * Replay everything queued.
 *
 * `send` is injected rather than imported so this module stays free of the Supabase client and
 * remains testable. Entries are removed only on success, so a partial failure keeps the rest of
 * the queue intact instead of dropping grades to make the queue look clean.
 */
export async function flushOutbox(
  send: (id: string, updates: Partial<Flashcard>) => Promise<unknown>,
): Promise<{ flushed: number; remaining: number }> {
  const queued = await pendingReviews()
  let flushed = 0

  for (const entry of queued) {
    try {
      await send(entry.id, entry.updates)
      await clearReview(entry.id)
      flushed++
    } catch {
      // Stop at the first failure: the network is almost certainly still down, and hammering it
      // for every remaining entry just burns battery.
      break
    }
  }

  return { flushed, remaining: (await pendingReviews()).length }
}
