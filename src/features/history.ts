import { useCallback, useState } from 'react'
import { readJson, writeJson } from '../lib/storage'

const KEY = 'mitso.searchHistory'
const MAX = 8

function load(): string[] {
  const v = readJson<unknown>(KEY, [])
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, MAX) : []
}

/** Добавляет запрос в историю (без обновления интерфейса — для вызова из эффектов). */
export function pushHistory(query: string) {
  const q = query.trim().replace(/\s+/g, ' ')
  if (q.length < 2) return
  writeJson(KEY, [q, ...load().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, MAX))
}

export function useSearchHistory() {
  const [list, setList] = useState<string[]>(load)
  const refresh = useCallback(() => setList(load()), [])
  const clear = useCallback(() => {
    writeJson(KEY, [])
    setList([])
  }, [])
  return { list, refresh, clear }
}
