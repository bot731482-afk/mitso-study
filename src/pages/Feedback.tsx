import { useState, type FormEvent } from 'react'
import { useI18n } from '../i18n'
import { useMeta } from '../lib/meta'
import { site } from '../config/site'

const TYPES = ['error', 'fix', 'missing', 'subject', 'tech'] as const
type Status = 'idle' | 'sending' | 'sent' | 'mail' | 'fail'

export default function Feedback() {
  const { t } = useI18n()
  useMeta(t('fb.title'), t('fb.subtitle'))
  const [type, setType] = useState<(typeof TYPES)[number]>('error')
  const [message, setMessage] = useState('')
  const [contact, setContact] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [touched, setTouched] = useState(false)

  const { endpoint, email } = site.feedback
  const configured = !!endpoint || !!email
  const subject = `MITSO Study: ${t(`fb.type.${type}` as 'fb.type.error')}`
  const body = `${message.trim()}${contact.trim() ? `\n\n${contact.trim()}` : ''}`

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!message.trim() || !configured) return
    if (endpoint) {
      setStatus('sending')
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ type: subject, message: message.trim(), contact: contact.trim(), page: location.href }),
        })
        if (!res.ok) throw new Error(String(res.status))
        setStatus('sent')
        setMessage('')
        setTouched(false)
      } catch {
        setStatus('fail')
      }
    } else {
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      setStatus('mail')
    }
  }

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <span className="lx-eyebrow">{t('nav.feedback')}</span>
      <h1 className="lx-h1 sm">{t('fb.title')}</h1>
      <p className="lx-sub lead">{t('fb.subtitle')}</p>

      {!configured && (
        <p className="lx-card" role="alert" style={{ marginBottom: 16, fontSize: 14, borderColor: 'var(--warn)' }}>
          {t('fb.notConfigured')}
        </p>
      )}

      <form onSubmit={submit} className="lx-card" style={{ padding: 24 }} noValidate>
        <div className="form-grid">
          <label className="fl">
            {t('fb.type')}
            <select className="lx-field" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
              {TYPES.map((k) => (
                <option key={k} value={k}>{t(`fb.type.${k}` as 'fb.type.error')}</option>
              ))}
            </select>
          </label>
          <label className="fl">
            {t('fb.message')}
            <textarea
              className="lx-field"
              style={{ minHeight: 150 }}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('fb.messagePh')}
              aria-invalid={touched && !message.trim()}
              maxLength={4000}
            />
            {touched && !message.trim() && <span style={{ color: 'var(--err)', fontWeight: 400, fontSize: 14 }}>{t('fb.required')}</span>}
          </label>
          <label className="fl">
            {t('fb.contact')}
            <input className="lx-field" value={contact} onChange={(e) => setContact(e.target.value)} maxLength={200} />
          </label>
          <div>
            <button type="submit" className="btn p" disabled={!configured || status === 'sending'}>
              {status === 'sending' ? t('fb.sending') : t('fb.send')}
            </button>
          </div>
          <div aria-live="polite" style={{ fontSize: 14 }}>
            {status === 'sent' && <p style={{ color: 'var(--ok)' }}>{t('fb.sentOk')}</p>}
            {status === 'mail' && <p className="lx-sub">{t('fb.sentMail')}</p>}
            {status === 'fail' && <p style={{ color: 'var(--err)' }}>{t('fb.fail')}</p>}
          </div>
        </div>
      </form>
    </div>
  )
}
