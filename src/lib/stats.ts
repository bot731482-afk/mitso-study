import type { Entry, Subject } from '../types'
import { dayIndex, isDue, statusOf, type Card } from '../features/study'

export interface SubjectStats {
  total: number
  known: number
  learning: number
  due: number
  pct: number
}

export function subjectStats(subject: Subject, cards: Record<string, Card>): SubjectStats {
  const today = dayIndex()
  let known = 0
  let learning = 0
  let due = 0
  for (const it of subject.items) {
    const c = cards[it.id]
    const st = statusOf(c)
    if (st === 'known') known++
    else if (st === 'learning') learning++
    if (isDue(c, today)) due++
  }
  const total = subject.items.length
  return { total, known, learning, due, pct: total ? Math.round((known / total) * 100) : 0 }
}

/** Следующая тема для продолжения: первая не освоенная, иначе первая */
export function nextEntry(entries: Entry[], cards: Record<string, Card>): Entry | undefined {
  return entries.find((e) => statusOf(cards[e.item.id]) !== 'known') ?? entries[0]
}

export function dueCount(entries: Entry[], cards: Record<string, Card>): number {
  const today = dayIndex()
  let n = 0
  for (const e of entries) if (isDue(cards[e.item.id], today)) n++
  return n
}

export const isCardKind = (e: Entry) => e.item.kind === 'qa'
