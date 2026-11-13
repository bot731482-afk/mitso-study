import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useData } from '../data/store'
import { addExam, rate, useStudy } from '../features/study'
import { formatDuration } from '../lib/format'
import { itemPath, subjectPath } from '../lib/paths'
import { useMeta } from '../lib/meta'
import { Empty } from '../components/Parts'
import { ItemBody } from '../components/ItemBody'
import type { Entry } from '../types'

type Stage = 'setup' | 'run' | 'grade' | 'result'
type Mark = 'full' | 'part' | 'miss'

const COUNTS = [1, 2, 3, 5]
const TIMES = [0, 10, 20, 30]

const shuffle = <T,>(a: T[]) => {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

export default function Exam() {
  const { sid } = useParams()
  const navigate = useNavigate()
  const { t, locale } = useI18n()
  const { data } = useData()
  const study = useStudy()
  useMeta(t('exam.title'))

  const subjects = useMemo(() => (data ? data.subjects.filter((s) => s.items.some((i) => i.kind === 'qa')) : []), [data])
  const [subjectId, setSubjectId] = useState(sid && subjects.some((s) => s.id === sid) ? sid : (subjects[0]?.id ?? ''))
  const [count, setCount] = useState(2)
  const [minutes, setMinutes] = useState(0)
  const [stage, setStage] = useState<Stage>('setup')
  const [ticket, setTicket] = useState<Entry[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [keys, setKeys] = useState<Record<string, boolean>>({})
  const [marks, setMarks] = useState<Record<string, Mark>>({})
  const [left, setLeft] = useState(0)
  const [spent, setSpent] = useState(0)
  const started = useRef(0)

  const finishRun = () => {
    setSpent(Math.round((Date.now() - started.current) / 1000))
    setStage('grade')
    window.scrollTo(0, 0)
  }

  // таймер: обратный отсчёт, по нулю билет завершается
  useEffect(() => {
    if (stage !== 'run' || !minutes) return
    const id = setInterval(() => {
      const rest = minutes * 60 - Math.round((Date.now() - started.current) / 1000)
      setLeft(rest)
      if (rest <= 0) {
        clearInterval(id)
        finishRun()
      }
    }, 500)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, minutes])

  if (!data) return null

  const pool = data.entries.filter((e) => e.item.kind === 'qa' && e.subject.id === subjectId)

  const start = () => {
    const picked = shuffle(pool).slice(0, Math.min(count, pool.length))
    setTicket(picked)
    setAnswers({})
    setKeys({})
    setMarks({})
    setLeft(minutes * 60)
    started.current = Date.now()
    setStage('run')
    window.scrollTo(0, 0)
  }

  const score = ticket.reduce((n, e) => n + (marks[e.item.id] === 'full' ? 1 : marks[e.item.id] === 'part' ? 0.5 : 0), 0)
  const allMarked = ticket.length > 0 && ticket.every((e) => marks[e.item.id])

  const showResult = () => {
    for (const e of ticket) {
      const m = marks[e.item.id]
      rate(e.item.id, m === 'full' ? 2 : m === 'part' ? 1 : 0)
    }
    addExam({ at: Date.now(), subjectId, total: ticket.length, score, seconds: spent })
    setStage('result')
    window.scrollTo(0, 0)
  }

  const header = (
    <>
      <span className="lx-eyebrow">{t('exam.eyebrow')}</span>
      <h1 className="lx-h1 sm">{t('exam.title')}</h1>
    </>
  )

  if (subjects.length === 0) {
    return (
      <div className="page">
        {header}
        <Empty title={t('exam.noSubjects')} />
      </div>
    )
  }

  if (stage === 'setup') {
    const history = [...study.exams].reverse().slice(0, 5)
    return (
      <div className="page">
        {header}
        <p className="lx-sub lead">{t('exam.intro')}</p>
        <div className="lx-card" style={{ padding: 28 }}>
          <div className="form-grid">
            <label className="fl">
              {t('exam.subject')}
              <select
                className="lx-field"
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value)
                  navigate(`/learn/exam/${e.target.value}`, { replace: true })
                }}
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </label>
            <div className="fl" style={{ display: 'grid', gap: 8, fontWeight: 600, fontSize: 15 }}>
              {t('exam.count')}
              <div className="seg" role="group" aria-label={t('exam.count')}>
                {COUNTS.map((c) => (
                  <button key={c} aria-pressed={count === c} onClick={() => setCount(c)}>{c}</button>
                ))}
              </div>
            </div>
            <div className="fl" style={{ display: 'grid', gap: 8, fontWeight: 600, fontSize: 15 }}>
              {t('exam.time')}
              <div className="seg" role="group" aria-label={t('exam.time')}>
                {TIMES.map((m) => (
                  <button key={m} aria-pressed={minutes === m} onClick={() => setMinutes(m)}>
                    {m === 0 ? t('exam.noTimer') : t('exam.minutes', { n: m })}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <button className="btn p" onClick={start} disabled={pool.length === 0}>{t('exam.start')}</button>
            </div>
          </div>
        </div>

        {history.length > 0 && (
          <section className="lx-section">
            <h2>{t('exam.history')}</h2>
            <div className="lx-card list">
              <ul className="lx-rows">
                {history.map((h) => (
                  <li key={h.at} style={{ padding: '12px 8px', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span>
                      <b>{data.bySubjectId.get(h.subjectId)?.title ?? h.subjectId}</b>
                      <small style={{ display: 'block', color: 'var(--lx-mute)' }}>{new Date(h.at).toLocaleString(locale)}</small>
                    </span>
                    <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{h.score} / {h.total} · {formatDuration(h.seconds)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>
    )
  }

  if (stage === 'run') {
    return (
      <div className="page">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
          <div>{header}</div>
          {minutes > 0 && (
            <span className={`timer${left < 60 ? ' low' : ''}`} role="timer" aria-live="off">
              {t('exam.leftMin', { t: formatDuration(left) })}
            </span>
          )}
        </div>
        <div className="exam-q">
          {ticket.map((e, n) => (
            <section className="lx-card q-exam" key={e.item.id}>
              <span className="lx-eyebrow" style={{ marginBottom: 0 }}>{t('exam.ticket')} · {n + 1} / {ticket.length}</span>
              <h2>{e.item.title}</h2>
              <label className="sr-only" htmlFor={`a-${e.item.id}`}>{t('exam.yourAnswer')}</label>
              <textarea
                id={`a-${e.item.id}`}
                className="lx-field"
                value={answers[e.item.id] ?? ''}
                onChange={(ev) => setAnswers((a) => ({ ...a, [e.item.id]: ev.target.value }))}
                placeholder={t('exam.answerPh')}
                style={{ minHeight: 140 }}
              />
              <div>
                <button className="btn s" onClick={() => setKeys((k) => ({ ...k, [e.item.id]: !k[e.item.id] }))} aria-expanded={!!keys[e.item.id]}>
                  {keys[e.item.id] ? t('exam.hideKey') : t('exam.showKey')}
                </button>
              </div>
              {keys[e.item.id] && (
                <div style={{ borderTop: '1px solid var(--lx-line)', paddingTop: 16 }}>
                  <ItemBody item={e.item} />
                </div>
              )}
            </section>
          ))}
        </div>
        <div className="row" style={{ marginTop: 20 }}>
          <button className="btn p" onClick={finishRun}>{t('exam.finish')}</button>
        </div>
      </div>
    )
  }

  if (stage === 'grade') {
    return (
      <div className="page">
        {header}
        <p className="lx-sub lead">{t('exam.gradeHint')}</p>
        <div className="exam-q">
          {ticket.map((e) => (
            <section className="lx-card q-exam" key={e.item.id}>
              <h2>{e.item.title}</h2>
              {answers[e.item.id]?.trim() && (
                <div>
                  <span className="label">{t('exam.yourAnswer')}</span>
                  <p style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>{answers[e.item.id]}</p>
                </div>
              )}
              <details>
                <summary style={{ cursor: 'pointer', fontWeight: 600, minHeight: 32 }}>{t('exam.showKey')}</summary>
                <div style={{ paddingTop: 12 }}>
                  <ItemBody item={e.item} />
                </div>
              </details>
              <div className="seg" role="group" aria-label={t('exam.gradeTitle')}>
                {(['full', 'part', 'miss'] as const).map((m) => (
                  <button
                    key={m}
                    className={m === 'full' ? 'ok' : m === 'part' ? 'mid' : 'bad'}
                    aria-pressed={marks[e.item.id] === m}
                    onClick={() => setMarks((x) => ({ ...x, [e.item.id]: m }))}
                  >
                    {t(`exam.${m}` as 'exam.full')}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="row" style={{ marginTop: 20 }}>
          <button className="btn p" onClick={showResult} disabled={!allMarked}>{t('exam.finishGrade')}</button>
          {!allMarked && <span className="lx-sub" style={{ fontSize: 14 }}>{t('exam.unanswered')}</span>}
        </div>
      </div>
    )
  }

  // result
  const ratio = ticket.length ? score / ticket.length : 0
  const verdict = ratio >= 0.8 ? 'high' : ratio >= 0.5 ? 'mid' : 'low'
  const failed = ticket.filter((e) => marks[e.item.id] !== 'full')
  return (
    <div className="page">
      {header}
      <div className="lx-card result">
        <h2>{t('exam.result')}</h2>
        <div className="result-stats">
          <div><b>{score} / {ticket.length}</b><span>{t('exam.score')}</span></div>
          <div><b>{Math.round(ratio * 100)}%</b><span>{data.bySubjectId.get(subjectId)?.title}</span></div>
          <div><b>{formatDuration(spent)}</b><span>{t('exam.timeSpent')}</span></div>
        </div>
        <p className="lx-sub">{t(`exam.verdict.${verdict}` as 'exam.verdict.high')}</p>
        {failed.length > 0 && (
          <ul className="list" style={{ gap: 6 }}>
            {failed.map((e) => (
              <li key={e.item.id}>
                <Link to={itemPath(e.subject.id, e.item.id)} style={{ color: 'var(--accent)' }}>{e.item.title}</Link>
              </li>
            ))}
          </ul>
        )}
        <div className="lx-cta">
          <button className="btn p" onClick={() => setStage('setup')}>{t('exam.again')}</button>
          <Link className="btn s" to={subjectPath(subjectId)}>{t('study.toSubject')}</Link>
        </div>
      </div>
    </div>
  )
}
