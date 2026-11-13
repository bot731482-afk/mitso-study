import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Entry, Subject } from '../types'
import { flatten, parseSubjects } from './parse'
import { buildIndex, type SearchEntry } from '../lib/search'

export interface Data {
  subjects: Subject[]
  entries: Entry[]
  searchIndex: SearchEntry[]
  byItemId: Map<string, Entry>
  bySubjectId: Map<string, Subject>
}

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: Data }

const Ctx = createContext<{ state: State; reload: () => void } | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    import('./content')
      .then(({ rawContent }) => {
        if (cancelled) return
        const subjects = parseSubjects(rawContent)
        const entries = flatten(subjects)
        setState({
          status: 'ready',
          data: {
            subjects,
            entries,
            searchIndex: buildIndex(entries),
            byItemId: new Map(entries.map((e) => [e.item.id, e])),
            bySubjectId: new Map(subjects.map((s) => [s.id, s])),
          },
        })
      })
      .catch((e) => {
        console.error('[content] не удалось загрузить материалы', e)
        if (!cancelled) setState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])
  const value = useMemo(() => ({ state, reload }), [state, reload])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useData() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useData вне DataProvider')
  return { status: v.state.status, data: v.state.status === 'ready' ? v.state.data : null, reload: v.reload }
}
