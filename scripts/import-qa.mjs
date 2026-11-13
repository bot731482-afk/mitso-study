// Импорт «вопрос — ответ» из текста (например, из PDF с ответами к экзамену) в content/<id>.json.
//
//   pdftotext -enc UTF-8 ответы.pdf ответы.txt
//   node scripts/import-qa.mjs scripts/specs/economic-theory.json
//
// Спецификация (json) описывает исходный файл, предмет и группы вопросов.
// Заголовок вопроса — строка вида «12. Название». Номера должны идти подряд (пропуски перечисляются в skip).
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const specPath = resolve(process.argv[2] ?? '')
if (!process.argv[2]) {
  console.error('Использование: node scripts/import-qa.mjs <spec.json>')
  process.exit(1)
}
const spec = JSON.parse(readFileSync(specPath, 'utf8'))
const srcPath = resolve(dirname(specPath), spec.src)

const skip = new Set(spec.skip ?? [])
const headers = new Set(spec.headerLines ?? [])
const raw = readFileSync(srcPath, 'utf8').replace(/\r/g, '').split('\n')

const lines = raw
  .map((l) => l.replace(/ /g, ' ').replace(/\f/g, '').trim())
  .filter((l) => l && !/^Page \d+ of \d+$/.test(l) && !headers.has(l))

// --- разбор на вопросы по подряд идущим номерам
const items = []
let expected = 1
let cur = null
for (const line of lines) {
  while (skip.has(expected)) expected++
  const m = line.match(/^(\d{1,3})\.\s+(\S.*)$/)
  if (m && Number(m[1]) === expected && expected <= (spec.count ?? 999)) {
    cur = { num: expected, title: m[2].trim(), lines: [] }
    items.push(cur)
    expected++
  } else if (cur) {
    cur.lines.push(line)
  }
}

const END = /[.!?:;»)”"…]$/

function toBlocks(ls) {
  // склеиваем строки, оборванные переносом: если строка не заканчивается знаком, продолжение — в следующей
  const paras = []
  let buf = ''
  for (const l of ls) {
    buf = buf ? `${buf} ${l}` : l
    if (END.test(l)) {
      paras.push(buf)
      buf = ''
    }
  }
  if (buf) paras.push(buf)
  return paras
}

function splitLong(p) {
  if (p.length < 520) return [p]
  const sentences = p.split(/(?<=[.!?»)])\s+(?=[А-ЯЁA-Z«„(])/)
  const out = []
  let acc = ''
  for (const s of sentences) {
    if (acc && acc.length + s.length > 380) {
      out.push(acc)
      acc = s
    } else acc = acc ? `${acc} ${s}` : s
  }
  if (acc) out.push(acc)
  return out
}

function listify(p) {
  // «1. ... 2. ... 3. ...» внутри абзаца → нумерованный список
  if (!/(^|\s)1\.\s\S/.test(p)) return [p]
  const parts = []
  let n = 1
  let rest = p
  let head = ''
  const first = rest.search(/(^|\s)1\.\s\S/)
  head = rest.slice(0, first).trim()
  rest = rest.slice(first).trim()
  while (rest) {
    const next = rest.search(new RegExp(`\\s${n + 1}\\.\\s(?=\\S)`))
    if (next < 0) {
      parts.push(rest)
      break
    }
    parts.push(rest.slice(0, next).trim())
    rest = rest.slice(next).trim()
    n++
  }
  if (parts.length < 2) return [p]
  return [head, parts.join('\n')].filter(Boolean)
}

function boldLeadIn(p) {
  // «Предмет: ...», «Функции: ...» в начале абзаца и после точки
  return p.replace(/(^|[.;]\s)([А-ЯЁ][а-яёА-ЯЁ-]*(?:\s[а-яёА-ЯЁ-]+){0,4}):\s/g, (_, a, w) => `${a}**${w}:** `)
}

function toMarkdown(ls) {
  const blocks = []
  for (const p of toBlocks(ls)) {
    for (const piece of listify(p)) {
      if (/^\d+\.\s/.test(piece)) blocks.push(piece)
      else for (const s of splitLong(piece)) blocks.push(boldLeadIn(s))
    }
  }
  return blocks.join('\n\n')
}

const pad = (n) => String(n).padStart(3, '0')
const groupOf = (n) => spec.groups.find((g) => g.numbers.some((r) => (Array.isArray(r) ? n >= r[0] && n <= r[1] : n === r)))

const out = {
  schemaVersion: 2,
  ...spec.meta,
  groups: spec.groups.map((g) => ({ id: g.id, title: g.title })),
  items: items.map((it) => ({
    id: `${spec.meta.id}-${pad(it.num)}`,
    num: it.num,
    title: it.title.replace(/\s+/g, ' '),
    group: groupOf(it.num)?.id,
    kind: 'qa',
    body: toMarkdown(it.lines),
    updatedAt: spec.updatedAt,
  })),
}

const missing = out.items.filter((i) => !i.group).map((i) => i.num)
if (missing.length) console.warn('Нет группы у вопросов:', missing.join(', '))
const empty = out.items.filter((i) => !i.body.trim()).map((i) => i.num)
if (empty.length) console.warn('Пустой ответ у вопросов:', empty.join(', '))

const dest = resolve(root, 'content', `${spec.meta.id}.json`)
writeFileSync(dest, JSON.stringify(out, null, 2) + '\n', 'utf8')
console.log(`✔ ${spec.meta.id}: вопросов — ${out.items.length}, записано в ${dest}`)
