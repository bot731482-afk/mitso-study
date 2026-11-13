import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useData } from '../data/store'
import { useStudy } from '../features/study'
import { useFavorites } from '../features/favorites'
import { dueCount, isCardKind } from '../lib/stats'
import { Icon, ICONS } from '../lib/icons'
import { Logo } from './Logo'
import { Toggles } from './Toggles'
import { Loading, ErrorState } from './Parts'

export function LearnShell() {
  const { t, rich } = useI18n()
  const { status, data } = useData()
  const study = useStudy()
  const fav = useFavorites()
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  const due = data ? dueCount(data.entries.filter(isCardKind), study.cards) : 0

  const items = [
    { to: '/learn', end: true, icon: ICONS.courses, label: t('nav.subjects') },
    { to: '/learn/study', icon: ICONS.repeat, label: t('nav.review'), badge: due },
    { to: '/learn/exam', icon: ICONS.exam, label: t('nav.exam') },
    { to: '/learn/search', icon: ICONS.search, label: t('nav.search') },
    { to: '/learn/favorites', icon: ICONS.bookmark, label: t('nav.favorites'), badge: fav.ids.length },
    { to: '/learn/settings', icon: ICONS.settings, label: t('nav.settings') },
  ]

  return (
    <div className="lx">
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus() }}>
        {t('nav.skip')}
      </a>
      <div className="lx-wrap">
        <header className="lx-top">
          <Link to="/learn" className="lx-brand" aria-label="MITSO Study">
            <Logo />
            <small>{t('brand.sub')}</small>
          </Link>
          <div className="lx-actions">
            <Link to="/learn/search" className="lx-search-link" aria-label={t('nav.search')}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4.5 4.5" />
              </svg>
              <span>{t('search.placeholder')}</span>
            </Link>
            <Toggles />
          </div>
        </header>
        <div className="lx-body">
          <aside className="lx-aside">
            <nav className="lx-nav" aria-label={t('nav.menu')}>
              {items.map((it) =>
                it.end ? (
                  // «Предметы» активны и на странице предмета/темы
                  <Link key={it.to} to={it.to} aria-current={pathname === '/learn' || pathname.startsWith('/learn/s/') ? 'page' : undefined}>
                    <Icon d={it.icon} />
                    <span>{it.label}</span>
                  </Link>
                ) : (
                  <NavLink key={it.to} to={it.to}>
                    <Icon d={it.icon} />
                    <span>{it.label}</span>
                    {!!it.badge && <span className="cnt">{it.badge}</span>}
                  </NavLink>
                ),
              )}
            </nav>
            <p className="lx-slogan">
              {rich('brand.slogan')}
              <small>{t('brand.sloganSmall')}</small>
            </p>
          </aside>
          <main id="main" tabIndex={-1} className="lx-main" style={{ outline: 'none' }}>
            {status === 'loading' ? <Loading /> : status === 'error' ? <ErrorState /> : <Outlet />}
          </main>
        </div>
      </div>
    </div>
  )
}
