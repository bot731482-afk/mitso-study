import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useData } from '../data/store'
import { dayKey, lastDays, streakOf, useStudy } from '../features/study'
import { dueCount, isCardKind, nextEntry, subjectStats } from '../lib/stats'
import { itemPath, subjectPath } from '../lib/paths'
import { readString } from '../lib/storage'
import { useMeta } from '../lib/meta'
import { Bar, Cover, Empty } from '../components/Parts'
import { Icon, ICONS } from '../lib/icons'

export default function Dashboard() {
  const { t, count } = useI18n()
  const { data } = useData()
  const study = useStudy()
  useMeta(t('dash.title'))
  if (!data) return null

  const today = study.days[dayKey()] ?? 0
  const goalPct = Math.min(100, Math.round((today / study.goal) * 100))
  const streak = streakOf(study.days)
  const week = lastDays(study.days)
  const weekMax = Math.max(1, ...week.map((d) => d.n))
  const totalKnown = data.subjects.reduce((n, s) => n + subjectStats(s, study.cards).known, 0)
  const due = dueCount(data.entries.filter(isCardKind), study.cards)

  // «Продолжить»: следующая тема в последнем открытом предмете
  const lastId = readString('mitso.last')
  const subject = data.bySubjectId.get(lastId ?? '') ?? data.subjects[0]
  const next = subject ? nextEntry(data.entries.filter((e) => e.subject.id === subject.id), study.cards) : undefined
  const started = Object.keys(study.cards).length > 0

  return (
    <div className="page">
      <span className="lx-eyebrow">{t('dash.eyebrow')}</span>
      <h1 className="lx-h1">{t('dash.title')}</h1>

      {next && (
        <div className="lx-card next">
          <div>
            <span className="lx-eyebrow" style={{ marginBottom: 4 }}>{started ? t('dash.continue') : t('dash.start')}</span>
            <h2>{next.item.title}</h2>
            <p>{started ? t('dash.continueIn', { s: next.subject.title }) : t('dash.startHint')}</p>
          </div>
          <div className="lx-cta">
            <Link className="btn p" to={itemPath(next.subject.id, next.item.id)}>{started ? t('dash.continue') : t('nav.open')}</Link>
            {due > 0 && (
              <Link className="btn s" to="/learn/study">{t('dash.reviewDue', { n: due })}</Link>
            )}
          </div>
        </div>
      )}

      <div className="dash">
        <div className="lx-card stat goal">
          <span className="label">{t('dash.goal')}</span>
          <div className="row" style={{ gap: 16, flexWrap: 'nowrap' }}>
            <div className="ring" style={{ ['--p' as string]: goalPct }} aria-hidden="true">
              <span>{goalPct}%</span>
            </div>
            <div>
              <b className="big">{today}</b>
              <div className="lx-sub" style={{ fontSize: 14 }}>
                {today >= study.goal ? t('dash.goalDone') : t('dash.goalOf', { n: today, goal: study.goal })}
              </div>
            </div>
          </div>
        </div>

        <div className="lx-card stat">
          <span className="label">{t('dash.streak')}</span>
          <div className="row" style={{ gap: 8, alignItems: 'baseline' }}>
            <b className="big">{streak}</b>
            <span className="lx-sub" style={{ fontSize: 14 }}>{t('dash.streakHint')}</span>
          </div>
          <div className="week" role="img" aria-label={t('dash.week')}>
            {week.map((d) => (
              <i key={d.key} data-on={d.n > 0 ? '' : undefined} className={d.today ? 'today' : ''} style={{ height: `${Math.max(12, (d.n / weekMax) * 100)}%` }} title={`${d.label}: ${d.n}`} />
            ))}
          </div>
          <div className="week-days" aria-hidden="true">
            {week.map((d) => (
              <span key={d.key}>{d.label.slice(0, 2)}</span>
            ))}
          </div>
        </div>

        <div className="lx-card stat">
          <span className="label">{t('dash.known')}</span>
          <div className="row" style={{ gap: 8, alignItems: 'baseline' }}>
            <b className="big">{totalKnown}</b>
            <span className="lx-sub" style={{ fontSize: 14 }}>{t('dash.knownOf', { n: data.entries.length })}</span>
          </div>
          <Bar pct={data.entries.length ? Math.round((totalKnown / data.entries.length) * 100) : 0} label={t('dash.known')} />
          {due > 0 ? (
            <Link className="btn s sm" to="/learn/study" style={{ justifySelf: 'start' }}>
              <Icon d={ICONS.repeat} />
              {t('dash.reviewNow')}
            </Link>
          ) : (
            <span className="lx-sub" style={{ fontSize: 14 }}>{t('dash.reviewNone')}</span>
          )}
        </div>
      </div>

      <section className="lx-section">
        <h2>{t('nav.subjects')}</h2>
        {data.subjects.length === 0 ? (
          <Empty title={t('dash.empty')} />
        ) : (
          <div className="lx-grid">
            {data.subjects.map((s, i) => {
              const st = subjectStats(s, study.cards)
              const qa = s.items[0]?.kind === 'qa'
              return (
                <Link key={s.id} className="lx-card course" to={subjectPath(s.id)}>
                  <Cover subject={s} index={i} label={t(qa ? 'kind.qa' : 'kind.lesson')} />
                  <h2>{s.title}</h2>
                  <div className="lx-meta">
                    <span>
                      <Icon d={ICONS.courses} />
                      {count(qa ? 'plural.questions' : 'plural.topics', st.total)}
                    </span>
                    <b>{st.pct}%</b>
                  </div>
                  <Bar pct={st.pct} label={t('subj.progress', { done: st.known, total: st.total })} />
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
