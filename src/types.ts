/** qa — вопрос и ответ (карточки, экзамен); lesson — текстовый урок; pages — урок из страниц PDF-конспекта */
export type Kind = 'qa' | 'lesson' | 'pages'

export interface Group {
  id: string
  title: string
}

export interface Item {
  id: string
  num?: number
  title: string
  group?: string
  kind: Kind
  /** Markdown (для qa и lesson) */
  body?: string
  /** Пути к картинкам страниц (для pages) */
  pages?: string[]
  /** Дополнительный текст только для поиска (для pages) */
  search?: string
  /** ГГГГ-ММ-ДД */
  updatedAt?: string
}

export interface Subject {
  schemaVersion: number
  id: string
  title: string
  description?: string
  /** Имя иконки из src/lib/icons.tsx */
  icon?: string
  course?: number
  groups: Group[]
  items: Item[]
}

/** Тема вместе с контекстом — для поиска, списков и повторения */
export interface Entry {
  item: Item
  subject: Subject
  /** Порядковый номер во всей базе */
  index: number
  /** Позиция внутри предмета */
  pos: number
  groupTitle?: string
  /** Текст без Markdown-разметки */
  plain: string
}
