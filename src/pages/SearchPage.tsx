import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useData } from '../data/store'
import { useMeta } from '../lib/meta'
import { makeSnippet, search, tokenize } from '../lib/search'
import { itemPath, searchPath } from '../lib/paths'
import { pushHistory, useSearchHistory } from '../features/history'
import { SearchBox } from '../components/SearchBox'
import { Highlight } from '../components/Highlight'
import { Empty } from '../components/Parts'
import { site } from '../config/site'

export default function SearchPage() {
  const { t, count } = useI18n()
  const { data } = useData()
  const [params] = useSearchParams()
  const q = (params.get('q') ?? '').trim()
  const history = useSearchHistory()
  useMeta(q ? `${t('search.title')}: ${q}` : t('search.title'))

  const tokens = useMemo(() => tokenize(q), [q])
  const hits = useMemo(() => (data && tokens.length ? search(data.searchIndex, q) : []), [data, q, tokens])
  const found = hits.length > 0

  useEffect(() => {
    if (q && found) {
      pushHistory(q)
      history.refresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, found])

  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <span className="lx-eyebrow">{t('nav.search')}</span>
      <h1 className="lx-h1 sm">{t('search.title')}</h1>
      <SearchBox initial={q} autoFocus={!q} />

      {!q && (
        <div style={{ marginTop: 28, display: 'grid', gap: 28 }}>
          <p className="lx-sub">{t('search.start')}</p>
          {history.list.length > 0 && (
            <section>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                <h2 style={{ fontSize: 17 }}>{t('search.history')}</h2>
                <button className="btn g" onClick={history.clear}>{t('search.clearHistory')}</button>
              </div>
              <div className="lx-chips">
                {history.list.map((h) => (
                  <Link key={h} to={searchPath(h)}>{h}</Link>
                ))}
              </div>
            </section>
          )}
          {site.popularQueries.length > 0 && (
            <section>
              <h2 style={{ fontSize: 17, marginBottom: 10 }}>{t('search.popular')}</h2>
              <div className="lx-chips">
                {site.popularQueries.map((p) => (
                  <Link key={p} to={searchPath(p)}>{p}</Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {q && (
        <div style={{ marginTop: 24 }}>
          {hits.length === 0 ? (
            <Empty title={t('search.empty')} hint={t('search.emptyHint')} />
          ) : (
            <>
              <p className="lx-sub" style={{ marginBottom: 14 }} aria-live="polite">
                {t('search.found', { n: count('plural.results', hits.length), q: t('search.forQuery', { q }) })}
              </p>
              <div className="lx-card list">
                <ul className="lx-rows">
                  {hits.slice(0, 100).map(({ entry }) => (
                    <li key={entry.item.id}>
                      <Link to={itemPath(entry.subject.id, entry.item.id)} style={{ gridTemplateColumns: 'minmax(0,1fr)', gap: 4, padding: '14px 10px' }}>
                        <span className="lx-pill a" style={{ justifySelf: 'start', fontSize: 12 }}>{entry.subject.title}</span>
                        <span className="t">
                          <Highlight text={entry.item.title} tokens={tokens} />
                        </span>
                        {entry.plain && (
                          <span className="lx-sub" style={{ fontSize: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            <Highlight text={makeSnippet(entry.plain, tokens)} tokens={tokens} />
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
