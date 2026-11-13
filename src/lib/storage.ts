// Безопасная обёртка над localStorage: не падает в приватном режиме или при очищенных данных.
export function readString(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeString(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* хранилище недоступно — работаем без сохранения */
  }
}

export function readJson<T>(key: string, fallback: T): T {
  const raw = readString(key)
  if (raw == null) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJson(key: string, value: unknown): void {
  writeString(key, JSON.stringify(value))
}
