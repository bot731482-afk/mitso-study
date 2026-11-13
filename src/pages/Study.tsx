import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useData } from '../data/store'
import { dayIndex, isDue, rate, statusOf, useStudy, type Grade } from '../features/study'
import { subjectPath, itemPath } from '../lib/paths'
import { useMeta } from '../lib/meta'
import { Bar, Crumbs, Empty, NotFoundBlock } from '../components/Parts'
import { ItemBody } from '../components/ItemBody'
import type { Entry } from '../types'

const NEW_PER_SESSION = 10
const GRADES: Grade[] = [0, 1, 2, 3]

export default function Study() {
  const { sid } = useParams()
  const { data } = useData()
  const { t } = useI18n()
  const [round, setRound] = useState(0)
  useMeta(t('study.title'))
  if (!data) return null
  const subject = sid ? data.bySubjectId.get(sid) : undefined
  if (sid && !subject) return <NotFoundBlock title={t('subj.notFound')} />
  // key — новая сессия при смене предмета или по кнопке «Ещё карточки»
  return <Session key={`${sid ?? 'all'}-${round}`} sid={sid} onRestart={() => setRound((n) => n + 1)} />
}

function Session({ sid, onRestart }: { sid?: string; onRestart: () => void }) {
  const { t, count } = useI18n()
  const { data } = useData()
  const study = useStudy()
  const navigate = useNavigate()
  const subject = sid ? data!.bySubjectId.get(sid) : undefined

  // Очередь собирается один раз при открытии: просроченные повторения, затем новые карточки
  const initial = useMemo(() => {
    const today = dayIndex()
    const pool = data!.entries.filter((e) => e.item.kind === 'qa' && (!sid || e.subject.id === sid))
    const due = pool
      .filter((e) => isDue(study.cards[e.item.id], today))
      .sort((a, b) => study.cards[a.item.id].d - study.cards[b.item.id].d || a.index - b.index)
    const fresh = pool.filter((e) => statusOf(study.cards[e.item.id]) === 'new').slice(0, NEW_PER_SESSION)
    return { queue: [...due, ...fresh], dueIds: new Set(due.map((e) => e.item.id)), pool }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [queue, setQueue] = useState<Entry[]>(initial.queue)
  const [i, setI] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [right, setRight] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [rated, setRated] = useState(0)
  const bodyRef = useRef<HTMLDivElement>(null)

  const cur = queue[i]
  const finished = i >= queue.length

  const grade = (g: Grade) => {
    if (!cur || !revealed) return
    rate(cur.item.id, g)
    if (g >= 2) setRight((n) => n + 1)
    else setWrong((n) => n + 1)
    setRated((n) => n + 1)
    // «снова»: карточка вернётся в конец очереди
    if (g === 0) setQueue((q) => [...q, cur])
    setRevealed(false)
    setI((n) => n + 1)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (/^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(el.tagName) && e.key === ' ') return
      if (e.metaKey || e.ctrlKey || e.altKey || finished || !cur) return
      if ((e.key === ' ' || e.key === 'Enter') && !revealed) {
        e.preventDefault()
        setRevealed(true)
      } else if (revealed && ['1', '2', '3', '4'].includes(e.key)) grade((Number(e.key) - 1) as Grade)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    if (revealed) bodyRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [revealed])

  const qaSubjects = data!.subjects.filter((s) => s.items.some((it) => it.kind === 'qa'))
  const noCards = initial.pool.length === 0

  const nextDue = useMemo(() => {
    const today = dayIndex()
    const future = initial.pool.map((e) => study.cards[e.item.id]).filter((c) => c && c.b > 0 && c.d > today).map((c) => c.d)
    if (!future.length) return null
    const d = Math.min(...future)
    return d === today + 1 ? t('item.tomorrow') : t('item.inDays', { n: d - today })
  }, [initial.pool, study.cards, t])

  const chips = (
    <div className="lx-chips" role="group" aria-label={t('study.title')}>
      <button aria-pressed={!sid} onClick={() => navigate('/learn/study')}>{t('study.all')}</button>
      {qaSubjects.map((s) => (
        <button key={s.id} aria-pressed={sid === s.id} onClick={() => navigate(`/learn/study/${s.id}`)}>{s.title}</button>
      ))}
    </div>
  )

  const header = (
    <>
      {subject ? (
        <Crumbs items={[{ to: '/learn', label: t('nav.subjects') }, { to: subjectPath(subject.id), label: subject.title }, { label: t('study.title') }]} />
      ) : null}
      <span className="lx-eyebrow">{t('study.eyebrow')}</span>
      <h1 className="lx-h1 sm">{subject ? subject.title : t('study.title')}</h1>
      {chips}
    </>
  )

  if (noCards) {
    return (
      <div className="page">
        {header}
        <Empty title={t('study.emptyTitle')} hint={t('study.noCards')}>
          <Link className="btn p" to={subject ? subjectPath(subject.id) : '/learn'}>{t('study.toSubject')}</Link>
        </Empty>
      </div>
    )
  }

  if (queue.length === 0) {
    return (
      <div className="page">
        {header}
        <Empty title={t('study.emptyTitle')} hint={t('study.emptyText')}>
          {nextDue && <p className="lx-sub">{t('study.nextDue', { when: nextDue })}</p>}
          <Link className="btn p" to={subject ? subjectPath(subject.id) : '/learn'}>{t('study.toSubject')}</Link>
        </Empty>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="page">
        {header}
        <div className="lx-card result">
          <h2>{t('study.doneTitle')}</h2>
          <p className="lx-sub">{t('study.doneSub', { n: rated })}</p>
          <div className="result-stats">
            <div><b>{right}</b><span>{t('study.right')}</span></div>
            <div><b>{wrong}</b><span>{t('study.wrong')}</span></div>
          </div>
          {nextDue && <p className="lx-sub">{t('study.nextDue', { when: nextDue })}</p>}
          <div className="lx-cta">
            <button className="btn p" onClick={onRestart}>{t('study.more')}</button>
            <Link className="btn s" to={subject ? subjectPath(subject.id) : '/learn'}>{t('study.toSubject')}</Link>
          </div>
        </div>
      </div>
    )
  }

  const isDueCard = initial.dueIds.has(cur.item.id)
  const pct = Math.round((i / queue.length) * 100)

  return (
    <div className="page">
      {header}
      <div className="study">
        <div className="study-top">
          <Bar pct={pct} thin label={t('study.progress', { n: i, total: queue.length })} />
          <span>{t('study.progress', { n: i + 1, total: queue.length })}</span>
        </div>

        <div className="lx-card flash" key={`${cur.item.id}-${i}`}>
          <div className="tag-row">
            <span className="lx-pill a">{cur.subject.title}</span>
            <span className="lx-pill">{isDueCard ? t('study.due') : t('study.new')}</span>
            {cur.groupTitle && <span className="lx-pill">{cur.groupTitle}</span>}
          </div>
          <h2>{cur.item.title}</h2>
          {!revealed ? (
            <div className="row">
              <button className="btn p" onClick={() => setRevealed(true)}>{t('study.reveal')}</button>
              <span className="study-hint" style={{ textAlign: 'left' }}>{t('study.hint')}</span>
            </div>
          ) : (
            <div className="answer">
              <ItemBody item={cur.item} ref={bodyRef} />
              <p style={{ marginTop: 14 }}>
                <Link to={itemPath(cur.subject.id, cur.item.id)} className="lx-sub" style={{ fontSize: 14 }}>{t('nav.open')} →</Link>
              </p>
            </div>
          )}
        </div>

        {revealed && (
          <div className="grade fade" role="group" aria-label={t('study.title')}>
            {GRADES.map((g) => (
              <button key={g} className={`g${g}`} onClick={() => grade(g)}>
                <span>{t(`study.g${g}` as 'study.g0')}</span>
                <small>{t(`study.g${g}d` as 'study.g0d')}</small>
                <kbd>{g + 1}</kbd>
              </button>
            ))}
          </div>
        )}
        <p className="lx-note" style={{ textAlign: 'center', margin: 0 }}>
          {count('plural.cards', queue.length - i)} · {t('study.newLimit', { n: NEW_PER_SESSION })}
        </p>
      </div>
    </div>
  )
}
