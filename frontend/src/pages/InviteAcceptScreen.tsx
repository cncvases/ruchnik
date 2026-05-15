import { useState } from 'react'
import { UserPlus, CheckCircle, XCircle } from 'lucide-react'
import { acceptInvite } from '../hooks/useContacts'

interface Props {
  code: string
  onDone: () => void
}

export function InviteAcceptScreen({ code, onDone }: Props) {
  const [state, setState] = useState<'loading' | 'confirm' | 'success' | 'error'>('confirm')
  const [inviterName, setInviterName] = useState('')
  const [error, setError] = useState('')

  async function handleAccept() {
    setState('loading')
    try {
      const { inviterName: name } = await acceptInvite(code)
      setInviterName(name)
      setState('success')
    } catch (e: any) {
      setError(e.message)
      setState('error')
    }
  }

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-dvh gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Обробка запрошення...</p>
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div className="flex flex-col items-center justify-center h-dvh gap-4 px-6 text-center">
        <CheckCircle size={64} className="text-green-500" />
        <h1 className="text-xl font-bold text-gray-900">Запрошення прийнято!</h1>
        <p className="text-gray-500 text-sm">Ви тепер в контактах з <span className="font-medium text-gray-800">{inviterName}</span></p>
        <button onClick={onDone} className="mt-4 px-8 py-3 bg-blue-500 text-white rounded-2xl font-medium text-sm">
          Відкрити додаток
        </button>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-dvh gap-4 px-6 text-center">
        <XCircle size={64} className="text-red-400" />
        <h1 className="text-xl font-bold text-gray-900">Помилка</h1>
        <p className="text-gray-500 text-sm">{error}</p>
        <button onClick={onDone} className="mt-4 px-8 py-3 bg-gray-100 text-gray-700 rounded-2xl font-medium text-sm">
          Відкрити додаток
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-dvh gap-6 px-6 text-center">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
        <UserPlus size={36} className="text-blue-500" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Запрошення до Ручнік</h1>
        <p className="text-gray-500 text-sm">Хтось запрошує вас до своїх контактів</p>
        <p className="text-xs text-gray-400 mt-1">Код: <span className="font-mono font-medium">{code}</span></p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button onClick={handleAccept} className="w-full py-3 bg-blue-500 text-white rounded-2xl font-medium">
          Прийняти запрошення
        </button>
        <button onClick={onDone} className="w-full py-3 bg-gray-100 text-gray-600 rounded-2xl font-medium text-sm">
          Пропустити
        </button>
      </div>
    </div>
  )
}
