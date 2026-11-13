import { useCallback, useState } from 'react'
import { writeString } from '../lib/storage'

// Начальная тема выставляется скриптом в index.html (до отрисовки); здесь только переключатель.
const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark'

export function useTheme() {
  const [dark, setDark] = useState(isDark)
  const toggle = useCallback(() => {
    const next = !isDark()
    if (next) document.documentElement.setAttribute('data-theme', 'dark')
    else document.documentElement.removeAttribute('data-theme')
    writeString('mitso.theme', next ? 'dark' : 'light')
    setDark(next)
  }, [])
  return { dark, toggle }
}
