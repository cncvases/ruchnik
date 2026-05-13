import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { HomePage } from './pages/HomePage'
import { RecordsPage } from './pages/RecordsPage'
import { StatisticsPage } from './pages/StatisticsPage'
import { ClientsPage } from './pages/ClientsPage'
import { ClientDetailPage } from './pages/ClientDetailPage'
import { SettingsPage } from './pages/SettingsPage'
import { EditRecordPage } from './pages/EditRecordPage'
import { initTelegram, getTelegramInitData, isDev } from './lib/telegram'
import { signInWithTelegram } from './lib/supabase'

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
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/records" element={<RecordsPage />} />
            <Route path="/records/:id/edit" element={<EditRecordPage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/clients/:id" element={<ClientDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </HashRouter>
  )
}

export default App
