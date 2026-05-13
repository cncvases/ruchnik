import { useEffect, useState, lazy, Suspense } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { HomePage } from './pages/HomePage'
import { initTelegram, getTelegramInitData, isDev } from './lib/telegram'
import { signInWithTelegram } from './lib/supabase'

const RecordsPage = lazy(() => import('./pages/RecordsPage').then(m => ({ default: m.RecordsPage })))
const StatisticsPage = lazy(() => import('./pages/StatisticsPage').then(m => ({ default: m.StatisticsPage })))
const ContactsPage = lazy(() => import('./pages/ContactsPage').then(m => ({ default: m.ContactsPage })))
const ClientDetailPage = lazy(() => import('./pages/ClientDetailPage').then(m => ({ default: m.ClientDetailPage })))
const WorkerDetailPage = lazy(() => import('./pages/WorkerDetailPage').then(m => ({ default: m.WorkerDetailPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const EditRecordPage = lazy(() => import('./pages/EditRecordPage').then(m => ({ default: m.EditRecordPage })))

function App() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      initTelegram()
      try {
        if (isDev) {
          setReady(true)
          return
        }
        const initData = getTelegramInitData()
        if (!initData) throw new Error('No Telegram initData')
        await signInWithTelegram(initData)
        setReady(true)
      } catch (e: any) {
        setError(e.message)
      }
    }
    init()
  }, [])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh text-center px-6 gap-4">
        <div className="text-5xl">⚠️</div>
        <p className="text-gray-600 text-sm">Помилка авторизації</p>
        <p className="text-gray-400 text-xs">{error}</p>
        <p className="text-gray-400 text-xs">Відкрийте додаток через Telegram бота</p>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh gap-3">
        <div className="text-5xl">💎</div>
        <p className="text-gray-600 font-medium">Ручнік</p>
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <HashRouter>
      <div className="flex flex-col h-dvh overflow-hidden">
        <main className="flex-1 overflow-hidden">
          <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/records" element={<RecordsPage />} />
              <Route path="/records/:id/edit" element={<EditRecordPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
              <Route path="/contacts" element={<ContactsPage />} />
              <Route path="/clients/:id" element={<ClientDetailPage />} />
              <Route path="/workers/:id" element={<WorkerDetailPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </Suspense>
        </main>
        <BottomNav />
      </div>
    </HashRouter>
  )
}

export default App
