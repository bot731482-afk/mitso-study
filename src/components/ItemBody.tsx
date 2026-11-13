import { memo, useMemo, forwardRef } from 'react'
import type { Item } from '../types'
import { renderMarkdown } from '../lib/markdown'

/** Тело темы: Markdown-текст или страницы конспекта. Сырой HTML из контента отключён в lib/markdown.ts. */
export const ItemBody = memo(
  forwardRef<HTMLDivElement, { item: Item }>(function ItemBody({ item }, ref) {
    const html = useMemo(() => (item.kind === 'pages' ? '' : renderMarkdown(item.body ?? '')), [item])
    if (item.kind === 'pages') {
      return (
        <div className="pages" ref={ref}>
          {item.pages!.map((src, i) => (
            <img key={src} src={src} alt={`${item.title}, стр. ${i + 1}`} loading={i < 2 ? 'eager' : 'lazy'} decoding="async" />
          ))}
        </div>
      )
    }
    return <div ref={ref} className="prose" dangerouslySetInnerHTML={{ __html: html }} />
  }),
)
