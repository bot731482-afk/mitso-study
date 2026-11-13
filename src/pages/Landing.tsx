import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useData } from '../data/store'
import { useMeta } from '../lib/meta'
import { itemPath, subjectPath } from '../lib/paths'
import { Logo } from '../components/Logo'
import { Toggles } from '../components/Toggles'
import { Icon, ICONS } from '../lib/icons'
import { site } from '../config/site'

const Check = () => (
  <svg className="chk" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3.5 8.5l3 3 6-7" />
  </svg>
)
const Arrow = () => (
  <svg className="arr" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
)

/** Плавная прокрутка к секции без смены адреса (адрес — это маршрут HashRouter) */
function scrollTo(id: string) {
  return (e: React.MouseEvent) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
  }
}

export default function Landing() {
  const { t, rich, count } = useI18n()
  const { data } = useData()
  const [open, setOpen] = useState(false)
  useMeta(undefined, t('land.sub'))

  // Живой пример: настоящий вопрос из базы (одинаковый на протяжении визита)
  const sample = useMemo(() => {
    const qa = data?.entries.filter((e) => e.item.kind === 'qa' && e.plain.length > 160 && e.plain.length < 900) ?? []
    return qa.length ? qa[(new Date().getDate() * 7) % qa.length] : undefined
  }, [data])

  const features = [1, 2, 3, 4, 5, 6] as const

  return (
    <>
      <div className="wash" aria-hidden="true" />
      <a className="skip" href="#/" onClick={scrollTo('main')}>
        {t('nav.skip')}
      </a>
      <header className="top rise">
        <Link to="/" aria-label="MITSO Study">
          <Logo />
        </Link>
        <nav aria-label={t('nav.menu')}>
          <a href="#/" onClick={scrollTo('features')}>{t('nav.features')}</a>
          <a href="#/" onClick={scrollTo('subjects')}>{t('land.subjects.label')}</a>
          <a href="#/" onClick={scrollTo('how')}>{t('nav.how')}</a>
          <a href="#/" onClick={scrollTo('plans')}>{t('nav.plans')}</a>
        </nav>
        <div className="top-actions">
          <Toggles />
          <Link className="btn p sm" to="/learn">
            {t('nav.cabinet')}
          </Link>
        </div>
      </header>

      <div className="wrap">
        <main id="main" tabIndex={-1} style={{ outline: 'none' }}>
          <section className="hero">
            <div className="hero-copy leaf-a has-photo">
              {/* Фото здания: public/hero.webp. Чтобы заменить, положите файл с тем же именем. */}
              <img
                className="hero-photo"
                src="hero.webp"
                alt={t('land.photoAlt')}
                fetchPriority="high"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
              <div className="hero-text">
                <span className="eyebrow rise" style={{ ['--i' as string]: 0 }}>{t('land.eyebrow')}</span>
                <h1 className="rise" style={{ ['--i' as string]: 1 }}>{rich('land.title')}</h1>
                <p className="hero-sub rise" style={{ ['--i' as string]: 2 }}>{t('land.sub')}</p>
                <div className="row rise" style={{ ['--i' as string]: 3 }}>
                  <Link className="btn p" to="/learn">
                    {t('land.cta')} <Arrow />
                  </Link>
                  <a className="btn w" href="#/" onClick={scrollTo('features')}>{t('land.what')}</a>
                </div>
              </div>
              <ul className="hero-chips rise" style={{ ['--i' as string]: 5 }}>
                {([['chip1', ICONS.courses], ['chip2', ICONS.layers], ['chip3', ICONS.chart]] as const).map(([k, d]) => (
                  <li key={k}>
                    <Icon d={d} />
                    <span>
                      {t(`land.${k}` as 'land.chip1').split('|').map((line, i) => (
                        <span key={i} style={{ display: 'block' }}>{line}</span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="hero-card glass rise" style={{ ['--i' as string]: 3 }}>
              <span className="label">{t('land.try')}</span>
              {sample ? (
                <>
                  <span className="lx-pill a" style={{ justifySelf: 'start' }}>{sample.subject.title}</span>
                  <p className="q">{sample.item.title}</p>
                  {open && <p className="a">{sample.plain}</p>}
                  <div className="row">
                    <button className="btn s" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
                      {open ? t('land.tryHide') : t('land.tryReveal')}
                    </button>
                    {open && (
                      <Link className="btn g" to={itemPath(sample.subject.id, sample.item.id)}>
                        {t('land.tryMore')} <Arrow />
                      </Link>
                    )}
                  </div>
                </>
              ) : (
                <p className="sub">{t('common.loading')}</p>
              )}
            </div>
          </section>

          <p className="free-line"><span className="free-badge"><Check />{t('land.free')}</span></p>

          <section id="features" className="block leaf-b">
            <header>
              <span className="label">{t('land.features.label')}</span>
              <h2>{t('land.features.title')}</h2>
            </header>
            <div className="rows">
              {features.map((n) => (
                <div className="row-item" key={n}>
                  <b>{t(`land.f${n}.t` as 'land.f1.t')}</b>
                  <span>{t(`land.f${n}.d` as 'land.f1.d')}</span>
                </div>
              ))}
            </div>
          </section>

          <section id="subjects" className="block leaf-a">
            <header>
              <span className="label">{t('land.subjects.label')}</span>
              <h2>{t('land.subjects.title')}</h2>
            </header>
            <div className="rows">
              {(data?.subjects ?? []).map((s) => (
                <Link className="row-item" key={s.id} to={subjectPath(s.id)}>
                  <b>{s.title}</b>
                  <span>
                    {count(s.items[0]?.kind === 'qa' ? 'plural.questions' : 'plural.topics', s.items.length)}
                    {s.description ? `. ${s.description}` : ''}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section id="how" className="block leaf-c">
            <header>
              <span className="label">{t('land.how.label')}</span>
              <h2>{t('land.how.title')}</h2>
            </header>
            <div className="cols">
              {([1, 2, 3] as const).map((n) => (
                <div className="col" key={n}>
                  <h3>{t(`land.s${n}.t` as 'land.s1.t')}</h3>
                  <p className="sub">{t(`land.s${n}.d` as 'land.s1.d')}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="plans" className="block leaf-d">
            <header>
              <span className="label">{t('land.plans.label')}</span>
              <h2>{t('land.plans.title')}</h2>
            </header>
            <div>
              <div className="cols">
                <div className="col">
                  <h3>{t('land.plans.free')}</h3>
                  <ul className="list">
                    {(['p1', 'p2', 'p3'] as const).map((k) => (
                      <li key={k}><Check />{t(`land.plans.${k}` as 'land.plans.p1')}</li>
                    ))}
                  </ul>
                </div>
                <div className="col">
                  <h3>{t('land.plans.later')}</h3>
                  <ul className="list">
                    {(['l1', 'l2'] as const).map((k) => (
                      <li key={k}><Check />{t(`land.plans.${k}` as 'land.plans.l1')}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="note">{t('land.plans.note')}</p>
            </div>
          </section>

          <section className="block leaf-b" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
            <div style={{ display: 'grid', gap: 14, justifyItems: 'start' }}>
              <span className="label">{t('land.start.label')}</span>
              <p className="lead">{t('land.start.title')}</p>
              <p className="sub">{t('land.start.sub')}</p>
              <Link className="btn p" to="/learn">
                {t('land.cta')} <Arrow />
              </Link>
            </div>
          </section>
        </main>

        <footer className="foot">
          <Logo />
          <nav>
            <Link to="/learn/feedback">{t('nav.feedback')}</Link>
            <span>{site.name} · {new Date().getFullYear()} · {t('land.foot')}</span>
          </nav>
        </footer>
      </div>
    </>
  )
}
