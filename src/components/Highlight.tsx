import { useMemo } from 'react'
import { highlightRegex } from '../lib/search'

export function Highlight({ text, tokens }: { text: string; tokens: string[] }) {
  const parts = useMemo(() => {
    const re = highlightRegex(tokens)
    return re ? text.split(re) : [text]
  }, [text, tokens])
  // split с одной группой захвата: нечётные элементы — совпадения
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <mark className="hl" key={i}>
            {p}
          </mark>
        ) : (
          p
        ),
      )}
    </>
  )
}
