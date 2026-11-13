import { useSyncExternalStore } from 'react'
import { readJson, writeJson } from '../lib/storage'

// Весь прогресс хранится в localStorage одним объектом. Доступ идёт только через этот модуль,
// поэтому позже его можно заменить на синхронизацию с аккаунтом, не трогая интерфейс.
const KEY = 'mitso.study.v1'

/** Карточка: коробка Лейтнера (0–5), день следующего повторения, сколько раз видели и сколько раз ответили верно */
export interface Card {
  b: number
  d: number
  s: number
  r: number
}

export interface ExamRecord {
  at: number
  subjectId: string
  total: number
  /** баллы: полный ответ = 1, частичный = 0.5 */
  score: number
  seconds: number
}

export interface StudyState {
  cards: Record<string, Card>
  /** ГГГГ-ММ-ДД → число оценённых карточек и прочитанных тем */
  days: Record<string, number>
  notes: Record<string, string>
  exams: ExamRecord[]
  goal: number
}

/** Оценка ответа: 0 — снова, 1 — трудно, 2 — хорошо, 3 — легко */
export type Grade = 0 | 1 | 2 | 3

/** Интервалы повторения по коробкам, в днях */
const INTERVALS = [0, 1, 3, 7, 16, 35]

const empty = (): StudyState => ({ cards: {}, days: {}, notes: {}, exams: [], goal: 10 })

function sanitize(v: unknown): StudyState {
  const base = empty()
  if (!v || typeof v !== 'object') return base
  const o = v as Partial<StudyState>
  if (o.cards && typeof o.cards === 'object') {
    for (const [id, c] of Object.entries(o.cards)) {
      if (c && typeof c.b === 'number' && typeof c.d === 'number') {
        base.cards[id] = { b: clamp(c.b, 0, 5), d: c.d, s: c.s | 0, r: c.r | 0 }
      }
    }
  }
  if (o.days && typeof o.days === 'object') {
    for (const [k, n] of Object.entries(o.days)) if (/^\d{4}-\d{2}-\d{2}$/.test(k) && typeof n === 'number') base.days[k] = n
  }
  if (o.notes && typeof o.notes === 'object') {
    for (const [k, t] of Object.entries(o.notes)) if (typeof t === 'string' && t) base.notes[k] = t.slice(0, 4000)
  }
  if (Array.isArray(o.exams)) {
    base.exams = o.exams
      .filter((e) => e && typeof e.at === 'number' && typeof e.score === 'number' && typeof e.total === 'number')
      .slice(-50)
  }
  if (typeof o.goal === 'number' && o.goal >= 1 && o.goal <= 200) base.goal = Math.round(o.goal)
  return base
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

let state: StudyState = sanitize(readJson<unknown>(KEY, null))
const listeners = new Set<() => void>()

function commit(next: StudyState) {
  state = next
  writeJson(KEY, state)
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return
    state = sanitize(readJson<unknown>(KEY, null))
    listeners.forEach((l) => l())
  })
}

// ---- время
export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
/** Номер дня по местному времени */
export const dayIndex = (d = new Date()) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000)

// ---- статусы
export type Status = 'new' | 'learning' | 'known'
export const statusOf = (c?: Card): Status => (!c || c.b === 0 ? 'new' : c.b >= 3 ? 'known' : 'learning')
export const isDue = (c: Card | undefined, today = dayIndex()) => !!c && c.b > 0 && c.d <= today

// ---- действия
function bump(days: Record<string, number>) {
  const k = dayKey()
  return { ...days, [k]: (days[k] ?? 0) + 1 }
}

/** Оценка карточки: двигает её по коробкам и назначает день следующего повторения */
export function rate(id: string, grade: Grade) {
  const today = dayIndex()
  const c = state.cards[id] ?? { b: 0, d: today, s: 0, r: 0 }
  let b = c.b
  if (grade === 0) b = 1
  else if (grade === 1) b = Math.max(1, b)
  else if (grade === 2) b = Math.min(5, b + 1)
  else b = Math.min(5, b + 2)
  // «снова» остаётся на сегодня; «трудно» — повтор завтра
  const wait = grade === 0 ? 0 : grade === 1 ? 1 : INTERVALS[b]
  const next: Card = { b, d: today + wait, s: c.s + 1, r: c.r + (grade >= 2 ? 1 : 0) }
  commit({ ...state, cards: { ...state.cards, [id]: next }, days: bump(state.days) })
}

/** Для уроков: «прочитано» ставит коробку 3 с повтором через 16 дней, снятие отметки сбрасывает прогресс */
export function setRead(id: string, read: boolean) {
  if (read) {
    const today = dayIndex()
    const c = state.cards[id]
    if (c && c.b >= 3) return
    commit({ ...state, cards: { ...state.cards, [id]: { b: 3, d: today + INTERVALS[4], s: (c?.s ?? 0) + 1, r: (c?.r ?? 0) + 1 } }, days: bump(state.days) })
  } else {
    const { [id]: _drop, ...rest } = state.cards
    commit({ ...state, cards: rest })
  }
}

export function setNote(id: string, text: string) {
  const notes = { ...state.notes }
  if (text.trim()) notes[id] = text.slice(0, 4000)
  else delete notes[id]
  commit({ ...state, notes })
}

export function setGoal(goal: number) {
  commit({ ...state, goal: clamp(Math.round(goal), 1, 200) })
}

export function addExam(rec: ExamRecord) {
  commit({ ...state, exams: [...state.exams, rec].slice(-50) })
}

export function resetProgress() {
  commit(empty())
}

export const exportProgress = () => JSON.stringify({ app: 'mitso-study', version: 1, data: state }, null, 2)

/** Загружает резервную копию. Возвращает false, если файл не похож на копию прогресса. */
export function importProgress(text: string): boolean {
  try {
    const o = JSON.parse(text)
    if (!o || o.app !== 'mitso-study' || !o.data) return false
    commit(sanitize(o.data))
    return true
  } catch {
    return false
  }
}

// ---- производные величины
export function streakOf(days: Record<string, number>): number {
  let n = 0
  const d = new Date()
  // если сегодня ещё не занимались, серия не обрывается — считаем со вчерашнего дня
  if (!days[dayKey(d)]) d.setDate(d.getDate() - 1)
  while (days[dayKey(d)] > 0) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

export function lastDays(days: Record<string, number>, count = 7) {
  const out: { key: string; n: number; label: string; today: boolean }[] = []
  const d = new Date()
  d.setDate(d.getDate() - (count - 1))
  for (let i = 0; i < count; i++) {
    const key = dayKey(d)
    out.push({ key, n: days[key] ?? 0, label: new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(d), today: i === count - 1 })
    d.setDate(d.getDate() + 1)
  }
  return out
}

export function useStudy(): StudyState {
  return useSyncExternalStore(subscribe, () => state)
}
