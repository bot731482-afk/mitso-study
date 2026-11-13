import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { exportProgress, importProgress, resetProgress, setGoal, useStudy } from '../features/study'
import { dayKey } from '../features/study'
import { useMeta } from '../lib/meta'

const GOALS = [5, 10, 20, 30]

export default function Settings() {
  const { t } = useI18n()
  const study = useStudy()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  useMeta(t('set.title'))

  const download = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mitso-study-${dayKey()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const onFile = async (file?: File) => {
    if (!file) return
    const ok = file.size < 5_000_000 && importProgress(await file.text())
    setMsg({ ok, text: ok ? t('set.importOk') : t('set.importFail') })
    if (fileRef.current) fileRef.current.value = ''
  }

  const reset = () => {
    if (window.confirm(t('set.resetConfirm'))) {
      resetProgress()
      setMsg({ ok: true, text: t('set.resetDone') })
    }
  }

  const cards = Object.values(study.cards)
  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <span className="lx-eyebrow">{t('set.eyebrow')}</span>
      <h1 className="lx-h1 sm">{t('set.title')}</h1>

      <div className="dash">
        <div className="lx-card stat"><span className="label">{t('set.studied')}</span><b className="big">{cards.reduce((n, c) => n + c.s, 0)}</b></div>
        <div className="lx-card stat"><span className="label">{t('set.notes')}</span><b className="big">{Object.keys(study.notes).length}</b></div>
        <div className="lx-card stat"><span className="label">{t('set.exams')}</span><b className="big">{study.exams.length}</b></div>
      </div>

      <section className="lx-card" style={{ marginTop: 20, display: 'grid', gap: 14, padding: 24 }}>
        <h2>{t('set.goal')}</h2>
        <p className="lx-sub">{t('set.goalHint')}</p>
        <div className="seg" role="group" aria-label={t('set.goal')}>
          {GOALS.map((g) => (
            <button key={g} aria-pressed={study.goal === g} onClick={() => setGoal(g)}>{g}</button>
          ))}
        </div>
      </section>

      <section className="lx-card" style={{ marginTop: 20, display: 'grid', gap: 14, padding: 24 }}>
        <h2>{t('set.backup')}</h2>
        <p className="lx-sub">{t('set.backupHint')}</p>
        <div className="lx-cta">
          <button className="btn p" onClick={download}>{t('set.export')}</button>
          <button className="btn s" onClick={() => fileRef.current?.click()}>{t('set.import')}</button>
          <button className="btn s" onClick={reset} style={{ color: 'var(--err)' }}>{t('set.reset')}</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
        <div aria-live="polite" style={{ minHeight: 22 }}>
          {msg && <p style={{ color: msg.ok ? 'var(--ok)' : 'var(--err)', fontSize: 14 }}>{msg.text}</p>}
        </div>
      </section>

      <p className="lx-note"><Link to="/learn/feedback" style={{ color: 'var(--accent)' }}>{t('nav.feedback')}</Link></p>
    </div>
  )
}
