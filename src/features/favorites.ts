import { useSyncExternalStore } from 'react'
import { readJson, writeJson } from '../lib/storage'

// Избранное хранится в localStorage. Весь доступ идёт через этот модуль.
const KEY = 'mitso.favorites'

const load = (): string[] => {
  const v = readJson<unknown>(KEY, [])
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

let ids = load()
const listeners = new Set<() => void>()

function commit(next: string[]) {
  ids = next
  writeJson(KEY, ids)
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return
    ids = load()
    listeners.forEach((l) => l())
  })
}

export function useFavorites() {
  const current = useSyncExternalStore(subscribe, () => ids)
  return {
    ids: current,
    has: (id: string) => current.includes(id),
    toggle: (id: string) => commit(current.includes(id) ? current.filter((x) => x !== id) : [id, ...current]),
    remove: (id: string) => commit(current.filter((x) => x !== id)),
  }
}
