import type { Entry } from '../types'

/** Нижний регистр, ё→е. Длина строки не меняется — это важно для сниппетов. */
export function normalize(s: string): string {
  return s.toLowerCase().replace(/ё/g, 'е')
}

export function tokenize(query: string): string[] {
  return normalize(query)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
}

export interface SearchEntry {
  entry: Entry
  title: string
  subj: string
  body: string
}

export interface SearchHit {
  entry: Entry
  score: number
}

export function buildIndex(entries: Entry[]): SearchEntry[] {
  return entries.map((entry) => ({
    entry,
    title: normalize(entry.item.title),
    subj: normalize(entry.subject.title),
    body: normalize(entry.plain),
  }))
}

const isWordStart = (text: string, pos: number) => pos === 0 || /[^\p{L}\p{N}]/u.test(text[pos - 1])

/** Все слова запроса должны встретиться (в названии, предмете или тексте); допускаются частичные совпадения. */
export function search(
  index: SearchEntry[],
  query: string,
  opts: { subjectId?: string; limit?: number } = {},
): SearchHit[] {
  const tokens = tokenize(query)
  if (!tokens.length) return []
  const phrase = tokens.join(' ')
  const hits: SearchHit[] = []

  for (const e of index) {
    if (opts.subjectId && e.entry.subject.id !== opts.subjectId) continue
    let score = 0
    let ok = true
    for (const t of tokens) {
      let s = 0
      const ti = e.title.indexOf(t)
      if (ti >= 0) s += isWordStart(e.title, ti) ? 12 : 8
      if (e.subj.includes(t)) s += 3
      const bi = e.body.indexOf(t)
      if (bi >= 0) s += isWordStart(e.body, bi) ? 2 : 1
      if (!s) {
        ok = false
        break
      }
      score += s
    }
    if (!ok) continue
    if (tokens.length > 1 && e.title.includes(phrase)) score += 10
    hits.push({ entry: e.entry, score })
  }

  hits.sort((a, b) => b.score - a.score || a.entry.index - b.entry.index)
  return opts.limit ? hits.slice(0, opts.limit) : hits
}

/** Фрагмент текста вокруг первого найденного слова (или начало). */
export function makeSnippet(plain: string, tokens: string[], length = 170): string {
  const norm = normalize(plain)
  let pos = -1
  for (const t of tokens) {
    const p = norm.indexOf(t)
    if (p >= 0 && (pos < 0 || p < pos)) pos = p
  }
  if (pos < 0) return plain.length > length ? plain.slice(0, length).trimEnd() + '…' : plain
  const start = Math.max(0, pos - Math.floor(length / 3))
  const end = Math.min(plain.length, start + length)
  return (start > 0 ? '…' : '') + plain.slice(start, end).trim() + (end < plain.length ? '…' : '')
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Регулярка для подсветки: е совпадает и с ё. Единственная группа захвата — совпадение. */
export function highlightRegex(tokens: string[]): RegExp | null {
  if (!tokens.length) return null
  const parts = [...tokens].sort((a, b) => b.length - a.length).map((t) => escapeRe(t).replace(/е/g, '[её]'))
  return new RegExp(`(${parts.join('|')})`, 'giu')
}
