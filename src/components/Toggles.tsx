import { useI18n } from '../i18n'
import { useTheme } from '../features/theme'
import { Icon, ICONS } from '../lib/icons'

/** Переключатели языка и темы — общие для лендинга и учебной среды */
export function Toggles() {
  const { t, lang, setLang } = useI18n()
  const { dark, toggle } = useTheme()
  return (
    <>
      <button className="tgl" onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')} aria-label={t('common.language')} title={t('common.language')}>
        <Icon d={ICONS.lang} />
        {lang === 'ru' ? 'EN' : 'RU'}
      </button>
      <button className="tgl" onClick={toggle} aria-label={t('common.theme')} title={t('common.theme')}>
        <Icon d={dark ? ICONS.sun : ICONS.moon} />
      </button>
    </>
  )
}
