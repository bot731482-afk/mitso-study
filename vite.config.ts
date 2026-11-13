import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' + HashRouter => сайт работает на любом адресе (GitHub Pages, свой домен) без настроек.
export default defineConfig({
  base: './',
  plugins: [react()],
  // все материалы загружаются одним отдельным файлом (~150 КБ в сжатом виде) — это нормально
  build: { chunkSizeWarningLimit: 1200 },
})
