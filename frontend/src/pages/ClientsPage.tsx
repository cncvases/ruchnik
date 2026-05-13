import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, ChevronRight } from 'lucide-react'
import { useClients, createClient } from '../hooks/useClients'
import { PageHeader } from '../components/PageHeader'

export function ClientsPage() {
  const navigate = useNavigate()
  const { clients, loading, refetch } = useClients()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newTg, setNewTg] = useState('')
  const [saving, setSaving] = useState(false)

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.telegram_username?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    try {
      await createClient({ name: newName.trim(), phone: newPhone || null, telegram_username: newTg || null })
      await refetch()
      setShowForm(false)
      setNewName(''); setNewPhone(''); setNewTg('')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors'

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Замовники" right={
        <button onClick={() => setShowForm(p => !p)} className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center">
          <Plus size={18} />
        </button>
      } />

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleCreate} className="px-4 py-3 border-b border-gray-100 bg-blue-50 flex flex-col gap-2">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ім'я замовника *" className={inputCls} required />
          <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Телефон" type="tel" className={inputCls} />
          <input value={newTg} onChange={e => setNewTg(e.target.value)} placeholder="Telegram @username" className={inputCls} />
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">Скасувати</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium disabled:opacity-50">
              {saving ? '...' : 'Додати'}
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="px-4 py-2 border-b border-gray-100">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук..." className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none" />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pb-20 px-4 pt-2 flex flex-col gap-2">
        {loading && <div className="text-center text-gray-400 py-12 text-sm">Завантаження...</div>}
        {!loading && filtered.length === 0 && (
          <div className="text-center text-gray-400 py-12 text-sm">
            <p className="text-4xl mb-3">👥</p>
            <p>{search ? 'Нічого не знайдено' : 'Немає замовників'}</p>
          </div>
        )}
        {filtered.map(client => (
          <button key={client.id} onClick={() => navigate(`/clients/${client.id}`)}
            className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3 text-left w-full">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900">{client.name}</div>
              {client.phone && <div className="text-xs text-gray-400 mt-0.5">{client.phone}</div>}
              {client.telegram_username && <div className="text-xs text-gray-400">@{client.telegram_username}</div>}
            </div>
            <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  )
}
