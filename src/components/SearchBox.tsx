import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useData } from '../data/store'
import { search, tokenize } from '../lib/search'
import { itemPath, searchPath } from '../lib/paths'
import { Highlight } from './Highlight'

/** Строка поиска с подсказками. Enter — перейти на страницу всех результатов. */
export function SearchBox({ initial = '', autoFocus, subjectId }: { initial?: string; autoFocus?: boolean; subjectId?: string }) {
  const { t } = useI18n()
  const { data } = useData()
  const navigate = useNavigate()
  const [value, setValue] = useState(initial)
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLFormElement>(null)

  useEffect(() => {
    setValue(initial)
  }, [initial])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const tokens = useMemo(() => tokenize(value), [value])
  const suggestions = useMemo(
    () => (data && tokens.length ? search(data.searchIndex, value, { limit: 5, subjectId }) : []),
    [data, tokens, value, subjectId],
  )

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const q = value.trim().replace(/\s+/g, ' ')
    if (!q) return
    setOpen(false)
    navigate(searchPath(q))
  }

  return (
    <form ref={wrap} onSubmit={submit} role="search" className="sbox">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.5 4.5" />
      </svg>
      <input
        className="lx-field"
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => {
          setValue(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        placeholder={t('search.placeholder')}
        aria-label={t('search.placeholder')}
        enterKeyHint="search"
        autoComplete="off"
      />
      <button type="submit" className="btn p">
        {t('search.button')}
      </button>

      {open && suggestions.length > 0 && (
        <div className="suggest" role="listbox" aria-label={t('search.suggest')}>
          {suggestions.map(({ entry }) => (
            <button
              key={entry.item.id}
              type="button"
              role="option"
              aria-selected="false"
              onClick={() => {
                setOpen(false)
                navigate(itemPath(entry.subject.id, entry.item.id))
              }}
            >
              <span>
                <Highlight text={entry.item.title} tokens={tokens} />
              </span>
              <small>{entry.subject.title}</small>
            </button>
          ))}
        </div>
      )}
    </form>
  )
}
