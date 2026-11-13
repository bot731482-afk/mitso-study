import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'
import '@fontsource-variable/onest'
import '@fontsource-variable/jetbrains-mono'
import './styles/base.css'
import './styles/learn.css'
import { I18nProvider } from './i18n'
import { DataProvider } from './data/store'
import { SvgDefs } from './components/Logo'
import { LearnShell } from './components/LearnShell'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import SubjectPage from './pages/Subject'
import ItemPage from './pages/ItemPage'
import SearchPage from './pages/SearchPage'
import Favorites from './pages/Favorites'
import NotFound from './pages/NotFound'

// Редко используемые страницы грузятся по требованию
const Study = lazy(() => import('./pages/Study'))
const Exam = lazy(() => import('./pages/Exam'))
const Settings = lazy(() => import('./pages/Settings'))
const Feedback = lazy(() => import('./pages/Feedback'))

const lazyPage = (el: React.ReactNode) => <Suspense fallback={null}>{el}</Suspense>

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <DataProvider>
        <SvgDefs />
        {/* HashRouter: сайт работает на любом адресе (GitHub Pages, свой домен) без настройки сервера */}
        <HashRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="learn" element={<LearnShell />}>
              <Route index element={<Dashboard />} />
              <Route path="s/:sid" element={<SubjectPage />} />
              <Route path="s/:sid/:iid" element={<ItemPage />} />
              <Route path="study" element={lazyPage(<Study />)} />
              <Route path="study/:sid" element={lazyPage(<Study />)} />
              <Route path="exam" element={lazyPage(<Exam />)} />
              <Route path="exam/:sid" element={lazyPage(<Exam />)} />
              <Route path="search" element={<SearchPage />} />
              <Route path="favorites" element={<Favorites />} />
              <Route path="settings" element={lazyPage(<Settings />)} />
              <Route path="feedback" element={lazyPage(<Feedback />)} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </DataProvider>
    </I18nProvider>
  </StrictMode>,
)
