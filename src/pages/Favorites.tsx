import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useData } from '../data/store'
import { useFavorites } from '../features/favorites'
import { itemPath } from '../lib/paths'
import { useMeta } from '../lib/meta'
import { Empty } from '../components/Parts'

export default function Favorites() {
  const { t } = useI18n()
  const { data } = useData()
  const fav = useFavorites()
  useMeta(t('fav.title'))
  if (!data) return null

  // Темы, которых больше нет в базе, просто не показываются
  const entries = fav.ids.map((id) => data.byItemId.get(id)).filter((e) => !!e)

  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <span className="lx-eyebrow">{t('nav.favorites')}</span>
      <h1 className="lx-h1 sm">{t('fav.title')}</h1>
      <p className="lx-sub lead">{t('fav.subtitle')}</p>
      {entries.length === 0 ? (
        <Empty title={t('fav.empty')} hint={t('fav.emptyHint')}>
          <Link className="btn p" to="/learn">{t('nav.subjects')}</Link>
        </Empty>
      ) : (
        <div className="lx-card list">
          <ul className="lx-rows">
            {entries.map((e) => (
              <li key={e.item.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', alignItems: 'center' }}>
                <Link to={itemPath(e.subject.id, e.item.id)} style={{ gridTemplateColumns: 'minmax(0,1fr)', gap: 2 }}>
                  <span className="lx-pill a" style={{ justifySelf: 'start', fontSize: 12 }}>{e.subject.title}</span>
                  <span className="t">{e.item.title}</span>
                </Link>
                <button className="btn s sm" onClick={() => fav.remove(e.item.id)} aria-label={`${t('fav.remove')}: ${e.item.title}`}>
                  {t('fav.remove')}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
