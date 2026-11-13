import type { Entry, Group, Item, Kind, Subject } from '../types'

export const SUPPORTED_SCHEMAS = [2]
const KINDS: Kind[] = ['qa', 'lesson', 'pages']

const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0

/** Убирает Markdown-разметку и картинки для поиска и сниппетов */
export function toPlain(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/^\s*\|?[\s:|-]+\|[\s:|-]*$/gm, ' ')
    .replace(/^\s*>+\s?/gm, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\\([\\*_`[\]|#>+-])/g, '$1')
    .replace(/[#*_`|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Проверяет сырые данные. Невалидные предметы и темы пропускаются с предупреждением в консоли. */
export function parseSubjects(files: { file: string; data: unknown }[]): Subject[] {
  const result: Subject[] = []
  const sIds = new Set<string>()
  const iIds = new Set<string>()

  for (const { file, data } of files) {
    const s = data as Partial<Subject> | null
    if (!s || typeof s !== 'object' || !isStr(s.id) || !isStr(s.title) || !Array.isArray(s.items)) {
      console.warn(`[content] ${file}: пропущен — неверная структура`)
      continue
    }
    if (!SUPPORTED_SCHEMAS.includes(s.schemaVersion as number)) {
      console.warn(`[content] ${file}: неподдерживаемая schemaVersion ${String(s.schemaVersion)}`)
      continue
    }
    if (sIds.has(s.id)) {
      console.warn(`[content] ${file}: повторяющийся id предмета ${s.id}`)
      continue
    }
    sIds.add(s.id)

    const groups: Group[] = Array.isArray(s.groups) ? s.groups.filter((g) => isStr(g?.id) && isStr(g?.title)) : []
    const items: Item[] = []
    for (const it of s.items as Partial<Item>[]) {
      const ok =
        it &&
        isStr(it.id) &&
        isStr(it.title) &&
        KINDS.includes(it.kind as Kind) &&
        !iIds.has(it.id) &&
        (it.kind === 'pages' ? Array.isArray(it.pages) && it.pages.length > 0 : isStr(it.body))
      if (!ok) {
        console.warn(`[content] ${file}: тема пропущена (${String(it?.id)})`)
        continue
      }
      iIds.add(it.id!)
      items.push(it as Item)
    }
    result.push({ ...(s as Subject), groups, items })
  }
  return result
}

export function flatten(subjects: Subject[]): Entry[] {
  const entries: Entry[] = []
  for (const subject of subjects) {
    const titles = new Map(subject.groups.map((g) => [g.id, g.title]))
    subject.items.forEach((item, pos) => {
      entries.push({
        item,
        subject,
        pos,
        index: entries.length,
        groupTitle: item.group ? titles.get(item.group) : undefined,
        plain: item.kind === 'pages' ? (item.search ?? '') : toPlain(item.body ?? ''),
      })
    })
  }
  return entries
}
