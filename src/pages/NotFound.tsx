import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useMeta } from '../lib/meta'

export default function NotFound() {
  const { t } = useI18n()
  useMeta(t('nf.title'))
  return (
    <div className="wrap">
      <div className="state" style={{ paddingTop: 140 }}>
        <p className="lead" style={{ color: 'var(--accent)' }}>404</p>
        <h1 style={{ fontSize: 28 }}>{t('nf.title')}</h1>
        <p>{t('nf.text')}</p>
        <Link to="/" className="btn p">{t('common.home')}</Link>
      </div>
    </div>
  )
}
