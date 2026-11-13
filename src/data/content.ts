// Все файлы из /content подключаются автоматически: добавили файл — он появился на сайте.
// Модуль грузится отдельным чанком (динамический import в store.tsx), чтобы не тормозить первую отрисовку.
const modules = import.meta.glob('../../content/*.json', { eager: true, import: 'default' })

export const rawContent: { file: string; data: unknown }[] = Object.entries(modules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([file, data]) => ({ file, data }))
