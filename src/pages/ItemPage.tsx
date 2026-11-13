import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useData } from '../data/store'
import { dayIndex, rate, setNote, setRead, statusOf, useStudy } from '../features/study'
import { useFavorites } from '../features/favorites'
import { itemPath, subjectPath } from '../lib/paths'
import { writeString } from '../lib/storage'
import { formatDate } from '../lib/format'
import { useMeta } from '../lib/meta'
import { Crumbs, NotFoundBlock } from '../components/Parts'
import { ItemBody } from '../components/ItemBody'
import { Icon, ICONS } from '../lib/icons'

export default function ItemPage() {
  const { sid, iid } = useParams()
  const { t, locale } = useI18n()
  const { data } = useData()
  const study = useStudy()
  const fav = useFavorites()
  const navigate = useNavigate()
  const bodyRef = useRef<HTMLDivElement>(null)
  const [recall, setRecall] = useState(false)
  const [copied, setCopied] = useState<'ok' | 'fail' | null>(null)

  const entry = data?.byItemId.get(iid ?? '')
  const valid = !!entry && entry.subject.id === sid
  useMeta(valid ? entry.item.title : undefined, valid ? entry.plain.slice(0, 160) : undefined)

  // запоминаем последний открытый предмет — для «Продолжить» на главной учебной среды
  useEffect(() => {
    if (valid) writeString('mitso.last', entry.subject.id)
    setRecall(false)
  }, [valid, entry?.subject.id, iid])

  const siblings = valid ? entry.subject.items : []
  const prev = valid ? siblings[entry.pos - 1] : undefined
  const next = valid ? siblings[entry.pos + 1] : undefined

  // ← → — соседние темы (если фокус не в поле ввода)
  useEffect(() => {
    if (!valid) return
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowLeft' && prev) navigate(itemPath(entry.subject.id, prev.id))
      if (e.key === 'ArrowRight' && next) navigate(itemPath(entry.subject.id, next.id))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [valid, prev, next, entry, navigate])

  if (!data) return null
  if (!valid) return <NotFoundBlock title={t('item.notFound')} />

  const { item, subject } = entry
  const card = study.cards[item.id]
  const status = statusOf(card)
  const isQa = item.kind === 'qa'
  const saved = fav.has(item.id)
  const date = formatDate(item.updatedAt, locale)
  const today = dayIndex()
  const when = card && card.b > 0 ? (card.d <= today ? t('item.today') : card.d === today + 1 ? t('item.tomorrow') : t('item.inDays', { n: card.d - today })) : null

  const copy = async () => {
    const text = `${item.title}\n\n${bodyRef.current?.innerText ?? entry.plain}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied('ok')
    } catch {
      setCopied('fail')
    }
    setTimeout(() => setCopied(null), 2000)
  }

  const showBody = !(isQa && recall)

  return (
    <div className="page">
      <Crumbs
        items={[
          { to: '/learn', label: t('nav.subjects') },
          { to: subjectPath(subject.id), label: subject.title },
          { label: isQa ? `№${item.num ?? entry.pos + 1}` : (item.title.match(/^[^.]*\./)?.[0] ?? item.title).slice(0, 24) },
        ]}
      />
      <div className="lx-split">
        <article className="lx-card task">
          <div style={{ display: 'grid', gap: 10 }}>
            <div className="lx-pills-row">
              {entry.groupTitle && <span className="lx-pill a">{entry.groupTitle}</span>}
              <span className={`lx-pill${status === 'known' ? ' ok' : ''}`}>
                {isQa ? t(`status.${status}` as 'status.new') : status === 'known' ? t('status.read') : t('status.unread')}
              </span>
              {when && isQa && <span className="lx-pill">{t('item.nextReview', { when })}</span>}
            </div>
            <h1 className="lx-ttitle">{item.title}</h1>
            {date && <small className="lx-sub" style={{ fontSize: 13 }}>{t('common.updated')}: {date}</small>}
          </div>

          {showBody ? (
            <ItemBody item={item} ref={bodyRef} />
          ) : (
            <div className="recall">
              <strong>{t('item.recall')}</strong>
              <p>{t('item.recallHint')}</p>
              <button className="btn p" onClick={() => setRecall(false)}>{t('item.show')}</button>
            </div>
          )}

          {item.kind === 'pages' && <p className="lx-note" style={{ marginTop: 0 }}>{t('item.pagesNote')}</p>}

          {isQa && showBody && recall === false && (
            <div className="row" style={{ borderTop: '1px solid var(--lx-line)', paddingTop: 18 }}>
              <button className="btn p" onClick={() => rate(item.id, 2)}>{t('item.knowIt')}</button>
              <button className="btn s" onClick={() => rate(item.id, 0)}>{t('item.again')}</button>
            </div>
          )}
        </article>

        <aside className="lx-side">
          <div className="lx-card side">
            <div className="lx-actions-col">
              {isQa ? (
                <button className="btn s" onClick={() => setRecall((v) => !v)} aria-pressed={recall}>
                  <Icon d={ICONS.repeat} />
                  {recall ? t('item.show') : t('item.recallMode')}
                </button>
              ) : (
                <button className={`btn ${status === 'known' ? 's' : 'p'}`} onClick={() => setRead(item.id, status !== 'known')}>
                  {status === 'known' ? t('item.markUnread') : t('item.markRead')}
                </button>
              )}
              <button className={`btn ${saved ? 'p' : 's'}`} onClick={() => fav.toggle(item.id)} aria-pressed={saved}>
                <Icon d={ICONS.bookmark} />
                {saved ? t('item.fav.remove') : t('item.fav.add')}
              </button>
              {item.kind !== 'pages' && (
                <button className="btn s" onClick={copy} aria-live="polite">
                  {copied === 'ok' ? t('item.copied') : copied === 'fail' ? t('item.copyFail') : t('item.copy')}
                </button>
              )}
            </div>
          </div>

          <div className="lx-card side note-box">
            <label htmlFor="note">{t('item.note')}</label>
            <textarea
              id="note"
              className="lx-field"
              value={study.notes[item.id] ?? ''}
              onChange={(e) => setNote(item.id, e.target.value)}
              placeholder={t('item.notePh')}
              maxLength={4000}
            />
            <small>{t('item.noteHint')}</small>
          </div>
          <Link to="/learn/feedback" className="lx-sub" style={{ fontSize: 14, textDecoration: 'none' }}>
            {t('item.report')}
          </Link>
        </aside>
      </div>

      <div className="lx-pager">
        {prev ? (
          <Link to={itemPath(subject.id, prev.id)} rel="prev">
            <small>← {t('item.prev')}</small>
            <span>{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={itemPath(subject.id, next.id)} rel="next" className="next">
            <small>{t('item.next')} →</small>
            <span>{next.title}</span>
          </Link>
        )}
      </div>
    </div>
  )
}
