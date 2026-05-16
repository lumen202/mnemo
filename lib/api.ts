import { NextResponse } from 'next/server'
import type { SubjectId } from '@/types'

export function apiError(err: unknown, status = 500): NextResponse {
  const message = err instanceof Error ? err.message : 'Internal error'
  return NextResponse.json({ error: message }, { status })
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 })
}

const SUBJECT_IDS: SubjectId[] = [
  'mathematics', 'computer-science', 'physics', 'literature',
  'machine-learning', 'history', 'biology', 'chemistry',
  'economics', 'philosophy', 'other',
]

export function parseSubject(value: unknown): SubjectId {
  return SUBJECT_IDS.includes(value as SubjectId) ? (value as SubjectId) : 'other'
}
