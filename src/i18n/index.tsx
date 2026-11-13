import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ru, type TKey } from './ru'
import { en } from './en'
import { readString, writeString } from '../lib/storage'

export type Lang = 'ru' | 'en'
const dictionaries: Record<Lang, Record<TKey, string>> = { ru, en }
const LANG_KEY = 'mitso.lang'

type Plural = 'plural.questions' | 'plural.topics' | 'plural.subjects' | 'plural.results' | 'plural.cards' | 'plural.days'

interface I18n {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: TKey, vars?: Record<string, string | number>) => string
  /** Текст с выделением: фрагмент между {em} и {/em} оборачивается в <em> */
  rich: (key: TKey, vars?: Record<string, string | number>) => ReactNode
  /** «5 вопросов» / «1 question» — форма слова подбирается по числу */
  count: (key: Plural, n: number) => string
  locale: string
}

const Ctx = createContext<I18n | null>(null)

function initialLang(): Lang {
  const saved = readString(LANG_KEY)
  if (saved === 'ru' || saved === 'en') return saved
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'ru'
}

function pluralIndex(lang: Lang, n: number): number {
  if (lang === 'en') return n === 1 ? 0 : 1
  const a = Math.abs(n) % 100
  const b = a % 10
  if (a > 10 && a < 20) return 2
  if (b > 1 && b < 5) return 1
  if (b === 1) return 0
  return 2
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    writeString(LANG_KEY, l)
  }, [])

  const value = useMemo<I18n>(() => {
    const dict = dictionaries[lang]
    const t: I18n['t'] = (key, vars) => {
      let s = dict[key] ?? key
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
      return s
    }
    const rich: I18n['rich'] = (key, vars) => {
      const s = t(key, vars)
      const m = /^(.*?)\{em\}(.*?)\{\/em\}(.*)$/s.exec(s)
      if (!m) return s
      return (
        <>
          {m[1]}
          <em>{m[2]}</em>
          {m[3]}
        </>
      )
    }
    const count: I18n['count'] = (key, n) => {
      const forms = dict[key].split('|')
      return `${n} ${forms[pluralIndex(lang, n)] ?? forms[0]}`
    }
    return { lang, setLang, t, rich, count, locale: lang === 'ru' ? 'ru-RU' : 'en-GB' }
  }, [lang, setLang])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n(): I18n {
  const v = useContext(Ctx)
  if (!v) throw new Error('useI18n вне I18nProvider')
  return v
}
