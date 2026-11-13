import MarkdownIt from 'markdown-it'

// html: false — сырой HTML из контента не пропускается, javascript:-ссылки markdown-it блокирует сам.
const md = new MarkdownIt({ html: false, linkify: true, breaks: false })

md.renderer.rules.table_open = () => '<div class="table-wrap"><table>'
md.renderer.rules.table_close = () => '</table></div>'

const defaultLinkOpen =
  md.renderer.rules.link_open ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet('target', '_blank')
  tokens[idx].attrSet('rel', 'noopener noreferrer')
  return defaultLinkOpen(tokens, idx, options, env, self)
}

// Формулы из учебников — картинки вида ![f:34x28](путь). Размер в alt (в пикселях Word) уменьшаем под размер текста сайта.
const FORMULA_SCALE = 1
md.renderer.rules.image = (tokens, idx) => {
  const t = tokens[idx]
  const src = String(t.attrGet('src') ?? '')
  const m = /^f(?::(\d+)x(\d+))?$/.exec(t.content)
  if (!m) return `<img src="${md.utils.escapeHtml(src)}" alt="${md.utils.escapeHtml(t.content)}" loading="lazy" decoding="async">`
  const size = m[1] ? ` width="${Math.round(Number(m[1]) * FORMULA_SCALE)}" height="${Math.round(Number(m[2]) * FORMULA_SCALE)}"` : ''
  return `<img class="f" src="${md.utils.escapeHtml(src)}"${size} alt="формула" loading="lazy" decoding="async">`
}

// Абзац, в котором только формулы, — «выключная» формула: по центру
md.core.ruler.push('display_formulas', (state) => {
  const toks = state.tokens
  for (let i = 0; i < toks.length - 2; i++) {
    if (toks[i].type !== 'paragraph_open' || toks[i + 1].type !== 'inline') continue
    const kids = toks[i + 1].children ?? []
    const onlyImages = kids.length > 0 && kids.every((k) => k.type === 'image' || (k.type === 'text' && /^[\s.,;]*$/.test(k.content)) || k.type === 'softbreak')
    if (onlyImages && kids.some((k) => k.type === 'image')) toks[i].attrJoin('class', 'fd')
  }
})

export function renderMarkdown(source: string): string {
  return md.render(source)
}
