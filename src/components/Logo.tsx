// Знак MITSO Study: раскрытая книга из двух «лепестков». Определён один раз в SvgDefs и подключается через <use>.
const LEFT = 'M60 19C44 6 20 5 5 11v67c15-6 40-6 55 6z'
const RIGHT = 'M70 19C86 6 110 5 125 11v67c-15-6-40-6-55 6z'

export function SvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="lg-right" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--accent)', stopOpacity: 0.95 }} />
          <stop offset="1" style={{ stopColor: 'var(--accent)', stopOpacity: 0.55 }} />
        </linearGradient>
      </defs>
      <symbol id="mark" viewBox="0 0 130 100">
        <path fill="var(--accent)" fillOpacity=".3" d={LEFT} />
        <path fill="url(#lg-right)" d={RIGHT} />
      </symbol>
      <symbol id="mark-flat" viewBox="0 0 130 100">
        <path fill="currentColor" fillOpacity=".34" d={LEFT} />
        <path fill="currentColor" d={RIGHT} />
      </symbol>
    </svg>
  )
}

export function Logo({ mark = false }: { mark?: boolean }) {
  return (
    <span className="logo">
      <svg viewBox="0 0 130 100" aria-hidden="true">
        <use href="#mark" />
      </svg>
      {!mark && (
        <b translate="no">
          MITSO <i>Study</i>
        </b>
      )}
    </span>
  )
}
