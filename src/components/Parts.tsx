import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { Subject } from '../types'
import { useI18n } from '../i18n'
import { useData } from '../data/store'
import { SubjectIcon } from '../lib/icons'
import type { Status } from '../features/study'

export function Bar({ pct, thin, label }: { pct: number; thin?: boolean; label?: string }) {
  return (
    <div
      className={`lx-bar${thin ? ' thin' : ''}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <i style={{ width: `${pct}%` }} data-zero={pct === 0 ? '' : undefined} />
    </div>
  )
}

export function Dot({ status, due }: { status: Status; due?: boolean }) {
  return <span className={`dot ${due ? 'due' : status === 'new' ? '' : status}`} aria-hidden="true" />
}

const COVER_CLASS = ['', 'c2', 'c3', 'c4', 'c5']

/** Обложка предмета: плоская, из фирменных форм. Без фотографий. */
export function Cover({ subject, index, label }: { subject: Subject; index: number; label: string }) {
  return (
    <div className={`lx-cover ${COVER_CLASS[index % COVER_CLASS.length]}`}>
      <span className="lx-cover-grid" aria-hidden="true" />
      <SubjectIcon name={subject.icon} className="lx-cover-icon" />
      <span className="lx-badge">{label}</span>
    </div>
  )
}

export function Loading() {
  const { t } = useI18n()
  return (
    <div className="state" role="status">
      <span className="spin" />
      {t('common.loading')}
    </div>
  )
}

export function ErrorState() {
  const { t } = useI18n()
  const { reload } = useData()
  return (
    <div className="state" role="alert">
      <p>{t('common.error')}</p>
      <button className="btn p" onClick={reload}>
        {t('common.retry')}
      </button>
    </div>
  )
}

export function Empty({ title, hint, children }: { title: string; hint?: string; children?: ReactNode }) {
  return (
    <div className="lx-card empty">
      <h2>{title}</h2>
      {hint && <p className="lx-sub">{hint}</p>}
      {children}
    </div>
  )
}

export function NotFoundBlock({ title }: { title: string }) {
  const { t } = useI18n()
  return (
    <Empty title={title}>
      <Link to="/learn" className="btn p">
        {t('nav.subjects')}
      </Link>
    </Empty>
  )
}

export function Crumbs({ items }: { items: { to?: string; label: string }[] }) {
  return (
    <nav className="lx-crumbs" aria-label="breadcrumb">
      {items.map((c, i) => (
        <span key={i} style={{ display: 'contents' }}>
          {i > 0 && <span aria-hidden="true">/</span>}
          {c.to ? <Link to={c.to}>{c.label}</Link> : <b>{c.label}</b>}
        </span>
      ))}
    </nav>
  )
}
