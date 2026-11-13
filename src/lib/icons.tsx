// Иконки для обложек предметов и навигации. Имя иконки в JSON предмета → рисунок. Новую иконку добавьте сюда.
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const paths: Record<string, React.ReactNode> = {
  book: (
    <>
      <path d="M5 4.5h10a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3V4.5z" />
      <path d="M5 17a3 3 0 0 1 3-3h10M9.5 8h5" />
    </>
  ),
  landmark: (
    <>
      <path d="M3 9.5 12 4l9 5.5H3z" />
      <path d="M5.5 12v6M10 12v6M14 12v6M18.5 12v6M3.5 20.5h17" />
    </>
  ),
  gavel: (
    <>
      <path d="m13.5 4.5 6 6M10.5 7.5l6 6M7.5 10.5l6 6" />
      <path d="m5 15.5 3.5 3.5M3.5 20.5l6-6" />
      <path d="M14 20h7" />
    </>
  ),
  calculator: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="3" />
      <path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  'trending-up': (
    <>
      <path d="M3.5 17 9.5 11l4 4 7-8" />
      <path d="M15 7h5.5v5.5" />
    </>
  ),
  scale: (
    <>
      <path d="M12 4v16M7 20h10M5 7.5h14" />
      <path d="m5 7.5-2.5 6a3 3 0 0 0 5 0L5 7.5zM19 7.5l-2.5 6a3 3 0 0 0 5 0l-2.5-6z" />
    </>
  ),
}

export function SubjectIcon({ name, className }: { name?: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      {paths[(name && paths[name] ? name : 'book')]}
    </svg>
  )
}

export function Icon({ d, className }: { d: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      {d}
    </svg>
  )
}

export const ICONS = {
  layers: (
    <>
      <path d="m12 3.5 9 4.5-9 4.5L3 8z" />
      <path d="m3 12.5 9 4.5 9-4.5M3 16.5l9 4.5 9-4.5" />
    </>
  ),
  chart: (
    <>
      <path d="M5 20V12M10 20V5M15 20V9M20 20V14" />
    </>
  ),
  book: (
    <>
      <path d="M5 4.5h10a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3V4.5z" />
      <path d="M5 17a3 3 0 0 1 3-3h10M9.5 8h5" />
    </>
  ),
  home: (
    <>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 10v9h12v-9M10 19v-5h4v5" />
    </>
  ),
  courses: (
    <>
      <path d="M2.5 9.5 12 5l9.5 4.5L12 14 2.5 9.5z" />
      <path d="M6.5 11.8v4.2c0 1.2 2.5 2.5 5.5 2.5s5.5-1.3 5.5-2.5v-4.2" />
      <path d="M21.5 9.5v5" />
    </>
  ),
  repeat: (
    <>
      <path d="M4 10V8a3 3 0 0 1 3-3h11l-3-2.5M20 14v2a3 3 0 0 1-3 3H6l3 2.5" />
    </>
  ),
  exam: (
    <>
      <path d="M6 3.5h9l3.5 3.5v13.5H6z" />
      <path d="M14.5 3.5V7.5h4M9 12.5h6M9 16h4" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  bookmark: <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.5M12 18.5V21M4.2 7.5l2.2 1.3M17.6 15.2l2.2 1.3M4.2 16.5l2.2-1.3M17.6 8.8l2.2-1.3" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  lang: (
    <>
      <path d="M4 6h9M8.5 4v2M6 6c.5 3 2.5 5.5 5.5 7M12 6c-.5 3-3 6-7 7.5" />
      <path d="M13 20l4-10 4 10M14.5 17h5" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="3" />
      <path d="m4 8 8 5.5L20 8" />
    </>
  ),
} as const
