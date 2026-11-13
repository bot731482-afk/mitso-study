// Импорт учебника из .docx в content/<id>.json (уроки по параграфам «§ N. Название»).
// Формулы в Word хранятся картинками WMF/EMF; они конвертируются в PNG через Windows (System.Drawing),
// поэтому скрипт запускается на Windows.
//
//   node scripts/import-docx.mjs scripts/specs/analysis.json
import mammoth from 'mammoth'
import { parse } from 'node-html-parser'
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
if (!process.argv[2]) {
  console.error('Использование: node scripts/import-docx.mjs <spec.json>')
  process.exit(1)
}
const specPath = resolve(process.argv[2])
const spec = JSON.parse(readFileSync(specPath, 'utf8'))
let docxPath = resolve(dirname(specPath), spec.src)
if (!existsSync(docxPath)) {
  // имя файла может храниться в другой форме Unicode («й» одним символом или двумя) — ищем по нормализованному имени
  const dir = dirname(docxPath)
  const want = docxPath.slice(dir.length + 1).normalize('NFC')
  const found = existsSync(dir) && readdirSync(dir).find((f) => f.normalize('NFC') === want)
  if (!found) {
    console.error(`Файл не найден: ${docxPath}`)
    process.exit(1)
  }
  docxPath = join(dir, found)
}
const id = spec.meta.id

// --- 1. docx -> html, картинки во временную папку
const tmp = join(tmpdir(), `mitso-${id}`)
rmSync(tmp, { recursive: true, force: true })
mkdirSync(join(tmp, 'raw'), { recursive: true })
let n = 0
const result = await mammoth.convertToHtml(
  { path: docxPath },
  {
    convertImage: mammoth.images.imgElement(async (img) => {
      n++
      const kind = img.contentType.split('/')[1].replace('x-', '')
      const name = `${id}-${String(n).padStart(4, '0')}.${kind}`
      writeFileSync(join(tmp, 'raw', name), await img.readAsBuffer())
      return { src: name }
    }),
  },
)
console.log(`  картинок в документе: ${n}`)

// --- 2. WMF/EMF -> PNG (Windows)
const outImg = join(root, 'public', 'lessons', id)
rmSync(outImg, { recursive: true, force: true })
mkdirSync(outImg, { recursive: true })
execFileSync(
  'powershell',
  ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', join(root, 'scripts', 'wmf2png.ps1'), '-In', join(tmp, 'raw'), '-Out', outImg],
  { stdio: 'inherit' },
)
// картинки, которые уже были растровыми (png/jpeg), копируем как есть
for (const f of readdirSync(join(tmp, 'raw'))) {
  if (/\.(png|jpeg|jpg|gif)$/.test(f)) copyFileSync(join(tmp, 'raw', f), join(outImg, f))
}
const sizes = existsSync(join(outImg, 'sizes.json'))
  ? JSON.parse(readFileSync(join(outImg, 'sizes.json'), 'utf8').replace(/^\uFEFF/, ''))
  : {}
rmSync(join(outImg, 'sizes.json'), { force: true })

// --- 3. html -> markdown
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/([*_`[\]|])/g, '\\$1').replace(/^(\s*)([#>+-])/gm, '$1\\$2')

function img(node) {
  const src = node.getAttribute('src')
  const png = src.replace(/\.(wmf|emf)$/, '.png')
  if (!existsSync(join(outImg, png))) return ''
  const [w, h] = sizes[png] ?? []
  return `![f${w ? `:${Math.round(w)}x${Math.round(h)}` : ''}](lessons/${id}/${png})`
}

function inline(node) {
  let out = ''
  for (const c of node.childNodes) {
    if (c.nodeType === 3) out += esc(c.rawText.replace(/\u00a0/g, ' '))
    else {
      const tag = c.tagName?.toLowerCase()
      if (tag === 'img') out += img(c)
      else if (tag === 'br') out += '  \n'
      else if (tag === 'strong' || tag === 'b' || tag === 'em' || tag === 'i') {
        const mark = tag === 'strong' || tag === 'b' ? '**' : '*'
        const inner = inline(c)
        const t = inner.trim()
        if (!t || /^!\[/.test(t) && !/[А-Яа-яA-Za-z0-9]/.test(inner.replace(/!\[[^\]]*\]\([^)]*\)/g, ''))) out += inner
        else out += `${inner.match(/^\s*/)[0]}${mark}${t}${mark}${inner.match(/\s*$/)[0]}`
      } else out += inline(c)
    }
  }
  return out
}
const plain = (node) => node.text.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
const hasImg = (node) => node.querySelectorAll?.('img').length > 0 || node.tagName === 'IMG'

function table(node) {
  const rows = node.querySelectorAll('tr').map((tr) => tr.querySelectorAll('td,th').map((td) => inline(td).replace(/\s+/g, ' ').trim() || ' '))
  if (!rows.length) return ''
  const w = Math.max(...rows.map((r) => r.length))
  const pad = (r) => [...r, ...Array(w - r.length).fill(' ')]
  const line = (r) => `| ${pad(r).join(' | ')} |`
  return [line(rows[0]), `|${' --- |'.repeat(w)}`, ...rows.slice(1).map(line)].join('\n')
}

function list(node, ordered) {
  return node
    .querySelectorAll(':scope > li')
    .map((li, i) => `${ordered ? `${i + 1}.` : '-'} ${inline(li).replace(/\s+/g, ' ').trim()}`)
    .join('\n')
}

const lessons = []
const groups = []
let group = null
let lesson = null
let pending = null // подпись раздела (РАЗДЕЛ …) — не группа

const isCaps = (t) => t.length >= 6 && t === t.toUpperCase() && /[А-ЯЁ]/.test(t) && !/[а-яё]/.test(t)

for (const el of parse(result.value).childNodes) {
  if (el.nodeType !== 1) continue
  const tag = el.tagName.toLowerCase()
  const text = plain(el)

  if ((tag === 'p' || tag === 'h2' || tag === 'h1') && /^§\s*\d+/.test(text) && text.length < 220) {
    lesson = { title: text.replace(/\.$/, '').trim(), group: group?.id, blocks: [] }
    lessons.push(lesson)
    continue
  }
  if ((tag === 'p' || tag === 'h2' || tag === 'h1') && isCaps(text) && !hasImg(el)) {
    if (/^РАЗДЕЛ/.test(text)) {
      pending = text
      continue
    }
    group = { id: `g${groups.length + 1}`, title: text.charAt(0) + text.slice(1).toLowerCase() }
    groups.push(group)
    lesson = null
    continue
  }
  if (!lesson) continue

  let md = ''
  if (tag === 'p' || tag === 'h2') md = inline(el).trim()
  else if (tag === 'img') md = img(el)
  else if (tag === 'ol') md = list(el, true)
  else if (tag === 'ul') md = list(el, false)
  else if (tag === 'table') md = table(el)
  if (md && md !== '\\' ) lesson.blocks.push(md)
}

const fix = (t) => spec.titleFixes?.[t] ?? t
const pad = (v) => String(v).padStart(3, '0')
const usedGroups = new Set(lessons.filter((l) => l.blocks.length).map((l) => l.group))
const keptGroups = groups.filter((g) => usedGroups.has(g.id))
const out = {
  schemaVersion: 2,
  ...spec.meta,
  groups: keptGroups.map((g) => ({ id: g.id, title: fix(g.title) })),
  items: lessons
    .filter((l) => l.blocks.length)
    .map((l, i) => ({
      id: `${id}-${pad(i + 1)}`,
      num: i + 1,
      title: fix(l.title),
      group: l.group,
      kind: 'lesson',
      body: l.blocks.join('\n\n'),
      updatedAt: spec.updatedAt,
    })),
}
if (!keptGroups.length) delete out.groups

writeFileSync(join(root, 'content', `${id}.json`), JSON.stringify(out, null, 2) + '\n', 'utf8')
console.log(`✔ ${id}: уроков — ${out.items.length}, групп — ${keptGroups.length}${pending ? `, раздел: ${pending}` : ''}`)
rmSync(tmp, { recursive: true, force: true })
