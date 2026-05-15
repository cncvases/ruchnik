import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { getTelegramUser } from '../lib/telegram'

interface Props {
  userId: string
  onDone: () => void
}

export function RegistrationScreen({ userId, onDone }: Props) {
  const tgUser = getTelegramUser()
  const [name, setName] = useState(tgUser?.first_name ?? '')
  const [surname, setSurname] = useState(tgUser?.last_name ?? '')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      const fullName = [name.trim(), surname.trim()].filter(Boolean).join(' ')
      const { error: err } = await supabase
        .from('users')
        .update({ name: fullName, surname: surname.trim() || null, phone: phone.trim() || null, is_registered: true })
        .eq('id', userId)
      if (err) throw err
      onDone()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-3 text-sm bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors'

  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💎</div>
          <h1 className="text-2xl font-bold text-gray-900">Ласкаво просимо!</h1>
          <p className="text-gray-500 text-sm mt-2">Заповніть профіль щоб продовжити</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Ім'я *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ваше ім'я"
              className={inputCls}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Прізвище</label>
            <input
              value={surname}
              onChange={e => setSurname(e.target.value)}
              placeholder="Ваше прізвище"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Номер телефону</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+380..."
              type="tel"
              className={inputCls}
            />
          </div>

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="w-full py-3.5 bg-blue-500 text-white rounded-2xl font-semibold text-base disabled:opacity-50 mt-2"
          >
            {saving ? 'Збереження...' : 'Продовжити →'}
          </button>
        </form>
      </div>
    </div>
  )
}
