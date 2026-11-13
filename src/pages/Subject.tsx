import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useData } from '../data/store'
import { isDue, statusOf, useStudy, dayIndex, type Status } from '../features/study'
import { nextEntry, subjectStats } from '../lib/stats'
import { itemPath } from '../lib/paths'
import { search, tokenize } from '../lib/search'
import { useMeta } from '../lib/meta'
import { Bar, Crumbs, Dot, Empty, NotFoundBlock } from '../components/Parts'
import { Highlight } from '../components/Highlight'
import type { Entry } from '../types'

type Filter = 'all' | Status

export default function SubjectPage() {
  const { sid } = useParams()
  const { t, count } = useI18n()
  const { data } = useData()
  const study = useStudy()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const subject = data?.bySubjectId.get(sid ?? '')
  useMeta(subject?.title, subject?.description)
  const tokens = useMemo(() => tokenize(q), [q])

  const entries = useMemo(() => (data && subject ? data.entries.filter((e) => e.subject.id === subject.id) : []), [data, subject])

  const visible = useMemo(() => {
    if (!data || !subject) return []
    let list: Entry[] = entries
    if (tokens.length) list = search(data.searchIndex, q, { subjectId: subject.id }).map((h) => h.entry)
    if (filter !== 'all') list = list.filter((e) => statusOf(study.cards[e.item.id]) === filter)
    return list
  }, [data, subject, entries, tokens, q, filter, study.cards])

  if (!data) return null
  if (!subject) return <NotFoundBlock title={t('subj.notFound')} />

  const st = subjectStats(subject, study.cards)
  const isQa = subject.items.some((i) => i.kind === 'qa')
  const next = nextEntry(entries, study.cards)
  const started = st.known + st.learning > 0
  const today = dayIndex()
  const flat = tokens.length > 0 || filter !== 'all'

  const groups = subject.groups.length ? subject.groups : [{ id: '', title: '' }]
  const sections = flat
    ? [{ id: 'flat', title: '', list: visible }]
    : groups
        .map((g) => ({ id: g.id, title: g.title, list: entries.filter((e) => (g.id ? e.item.group === g.id : true)) }))
        .filter((g) => g.list.length)
  const ungrouped = flat ? [] : subject.groups.length ? entries.filter((e) => !e.item.group || !subject.groups.some((g) => g.id === e.item.group)) : []
  if (ungrouped.length) sections.unshift({ id: 'rest', title: '', list: ungrouped })

  const label = (e: Entry) => {
    const c = study.cards[e.item.id]
    const s = statusOf(c)
    if (e.item.kind !== 'qa') return s === 'new' ? '' : t('status.read')
    return isDue(c, today) ? t('status.due') : s === 'new' ? t('status.new') : t(`status.${s}` as 'status.known')
  }

  return (
    <div className="page">
      <Crumbs items={[{ to: '/learn', label: t('nav.subjects') }, { label: subject.title }]} />
      <span className="lx-eyebrow">{t('subj.eyebrow')}</span>
      <h1 className="lx-h1 sm">{subject.title}</h1>
      {subject.description && <p className="lx-sub lead">{subject.description}</p>}

      <div className="lx-card summary">
        <div>
          <b className="big">{st.pct}%</b>
          <span>{t('subj.progress', { done: st.known, total: st.total })}</span>
        </div>
        <Bar pct={st.pct} label={t('subj.progress', { done: st.known, total: st.total })} />
        <div className="lx-cta">
          {next && (
            <Link className="btn p" to={itemPath(subject.id, next.item.id)}>
              {started ? t('subj.continue') : t('subj.start')}
            </Link>
          )}
          {isQa && (
            <>
              <Link className="btn s" to={`/learn/study/${subject.id}`}>
                {st.due > 0 ? t('subj.review', { n: st.due }) : t('subj.learn')}
              </Link>
              <Link className="btn s" to={`/learn/exam/${subject.id}`}>{t('subj.exam')}</Link>
            </>
          )}
        </div>
      </div>

      <div className="lx-tools">
        <input
          className="lx-field"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('subj.filter')}
          aria-label={t('subj.filter')}
        />
      </div>
      <div className="lx-chips" role="group" aria-label={t('item.status')}>
        {(['all', 'new', 'learning', 'known'] as const).map((f) => (
          <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f === 'all' ? t('subj.all') : t(`status.${f}` as 'status.new')}
          </button>
        ))}
      </div>

      {visible.length === 0 && flat ? (
        <Empty title={t('subj.noMatch')} />
      ) : (
        <div className="lx-modules">
          {sections.map((sec) => {
            const done = sec.list.filter((e) => statusOf(study.cards[e.item.id]) === 'known').length
            return (
              <section className="lx-card module" key={sec.id}>
                {sec.title && (
                  <>
                    <header>
                      <h2>{sec.title}</h2>
                      <span>{t('subj.groupCount', { done, total: sec.list.length })}</span>
                    </header>
                    <Bar pct={sec.list.length ? (done / sec.list.length) * 100 : 0} thin />
                  </>
                )}
                <ul className="lx-rows">
                  {sec.list.map((e) => {
                    const c = study.cards[e.item.id]
                    return (
                      <li key={e.item.id}>
                        <Link to={itemPath(subject.id, e.item.id)}>
                          <span className="n">{e.item.kind === 'qa' ? `№${e.item.num ?? e.pos + 1}` : (e.item.title.match(/^§\s*[\d.]+/)?.[0] ?? `№${e.pos + 1}`)}</span>
                          <span className="t">
                            <Highlight text={e.item.kind === 'qa' ? e.item.title : e.item.title.replace(/^§\s*[\d.]+\s*/, '')} tokens={tokens} />
                            {study.notes[e.item.id] && <small>{t('subj.withNotes')}</small>}
                          </span>
                          <span className="st">
                            <Dot status={statusOf(c)} due={e.item.kind === 'qa' && isDue(c, today)} />
                            <span>{label(e)}</span>
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </div>
      )}
      <p className="lx-note">{count(isQa ? 'plural.questions' : 'plural.topics', subject.items.length)}</p>
    </div>
  )
}
