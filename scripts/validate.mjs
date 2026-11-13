// Проверка файлов в content/. Запуск: npm run validate (также выполняется перед сборкой).
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = join(root, 'content')
const SUPPORTED = [2]
const KINDS = ['qa', 'lesson', 'pages']
const ID = /^[a-z0-9-]+$/
const errors = []
const sIds = new Set()
const iIds = new Set()
let total = 0

const files = readdirSync(dir).filter((f) => f.endsWith('.json'))
if (!files.length) errors.push('В папке content/ нет ни одного .json файла')

for (const f of files) {
  let s
  try {
    s = JSON.parse(readFileSync(join(dir, f), 'utf8'))
  } catch (e) {
    errors.push(`${f}: невалидный JSON (${e.message})`)
    continue
  }
  const at = (m) => errors.push(`${f}: ${m}`)
  if (!SUPPORTED.includes(s.schemaVersion)) at(`schemaVersion должен быть одним из ${SUPPORTED}`)
  if (typeof s.id !== 'string' || !ID.test(s.id)) at('id: строка из a-z, 0-9 и дефиса')
  else if (sIds.has(s.id)) at(`повторяющийся id предмета «${s.id}»`)
  else sIds.add(s.id)
  if (typeof s.title !== 'string' || !s.title.trim()) at('нужен title')
  if (!Array.isArray(s.items)) {
    at('items должен быть массивом')
    continue
  }
  const groupIds = new Set((s.groups ?? []).map((g) => g.id))
  for (const [i, it] of s.items.entries()) {
    const w = `items[${i}]`
    if (typeof it.id !== 'string' || !ID.test(it.id)) at(`${w}.id: строка из a-z, 0-9 и дефиса`)
    else if (iIds.has(it.id)) at(`${w}: повторяющийся id темы «${it.id}»`)
    else iIds.add(it.id)
    if (typeof it.title !== 'string' || !it.title.trim()) at(`${w}.title пустой`)
    if (!KINDS.includes(it.kind)) at(`${w}.kind должен быть одним из ${KINDS}`)
    if (it.kind === 'pages') {
      if (!Array.isArray(it.pages) || !it.pages.length) at(`${w}.pages: нужен список картинок`)
      else for (const p of it.pages) if (!existsSync(join(root, 'public', p))) at(`${w}: нет файла public/${p}`)
    } else if (typeof it.body !== 'string' || !it.body.trim()) at(`${w}.body пустой`)
    else {
      // картинки формул в тексте должны существовать
      for (const m of it.body.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
        if (!existsSync(join(root, 'public', m[1]))) {
          at(`${w}: нет картинки public/${m[1]}`)
          break
        }
      }
    }
    if (it.group && !groupIds.has(it.group)) at(`${w}.group «${it.group}» не описана в groups`)
    if (it.updatedAt && !/^\d{4}-\d{2}-\d{2}$/.test(it.updatedAt)) at(`${w}.updatedAt: формат ГГГГ-ММ-ДД`)
    total++
  }
}

if (errors.length) {
  console.error('\n✖ Ошибки в контенте:\n' + errors.slice(0, 40).map((e) => '  - ' + e).join('\n') + (errors.length > 40 ? `\n  … и ещё ${errors.length - 40}` : '') + '\n')
  process.exit(1)
}
console.log(`✔ Контент в порядке: предметов — ${sIds.size}, тем — ${total}`)
