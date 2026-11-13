import { useEffect } from 'react'

const BASE = 'MITSO Study'

/** Обновляет title и description страницы (для вкладки, закладок и репостов). */
export function useMeta(title?: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} — ${BASE}` : `${BASE} — подготовка к сессии`
    if (description) document.querySelector('meta[name="description"]')?.setAttribute('content', description.slice(0, 200))
  }, [title, description])
}
