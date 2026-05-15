import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, ChevronRight, UserPlus, Check, X } from 'lucide-react'
import { useClients, createClient } from '../hooks/useClients'
import { useWorkers, createWorker } from '../hooks/useWorkers'
import { useConnections, useContactsByRole, searchUsers, sendContactRequest, acceptContactRequest, rejectContactRequest } from '../hooks/useContacts'

type Tab = 'clients' | 'workers' | 'connections'

const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors'

export function ContactsPage() {
  const [tab, setTab] = useState<Tab>('clients')
  const { incoming } = useConnections()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-3 pb-0">
        <h1 className="text-lg font-semibold text-gray-900 mb-3">Контакти</h1>
        <div className="flex gap-1">
          {(['clients', 'workers', 'connections'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-medium rounded-t-xl transition-colors border-b-2 relative ${
                tab === t
                  ? 'text-blue-500 border-blue-500 bg-blue-50'
                  : 'text-gray-500 border-transparent'
              }`}
            >
              {t === 'clients' ? 'Замовники' : t === 'workers' ? 'Працівники' : 'Зв\'язки'}
              {t === 'connections' && incoming.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {incoming.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {tab === 'clients' && <ClientsList />}
      {tab === 'workers' && <WorkersList />}
      {tab === 'connections' && <ConnectionsList />}
    </div>
  )
}

function ClientsList() {
  const navigate = useNavigate()
  const { clients, loading, refetch } = useClients()
  const { contacts: linkedClients } = useContactsByRole('is_client')
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

  return (
    <>
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

      <div className="px-4 py-2 border-b border-gray-100 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук..." className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none" />
        </div>
        <button onClick={() => setShowForm(p => !p)} className="w-9 h-9 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
          <Plus size={18} />
        </button>
      </div>

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
        {linkedClients.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map(c => (
          <button key={c.id} onClick={() => navigate(`/contacts/${c.id}`)}
            className="bg-white rounded-2xl border border-blue-50 px-4 py-3 flex items-center gap-3 text-left w-full">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {c.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900">{c.name}</div>
              {c.phone && <div className="text-xs text-gray-400 mt-0.5">{c.phone}</div>}
              <div className="text-xs text-blue-400">З контактів</div>
            </div>
            <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
          </button>
        ))}
      </div>
    </>
  )
}

function WorkersList() {
  const navigate = useNavigate()
  const { workers, loading, refetch } = useWorkers()
  const { contacts: linkedWorkers } = useContactsByRole('is_worker')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newRole, setNewRole] = useState('')
  const [newTg, setNewTg] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtered = workers.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.phone?.includes(search) ||
    w.role?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    setError(null)
    try {
      await createWorker({ name: newName.trim(), phone: newPhone || null, role: newRole || null, telegram_username: newTg.replace('@', '') || null })
      await refetch()
      setShowForm(false)
      setNewName(''); setNewPhone(''); setNewRole(''); setNewTg('')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {showForm && (
        <form onSubmit={handleCreate} className="px-4 py-3 border-b border-gray-100 bg-purple-50 flex flex-col gap-2">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ім'я працівника *" className={inputCls} required />
          <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Телефон" type="tel" className={inputCls} />
          <input value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="Роль / посада" className={inputCls} />
          <input value={newTg} onChange={e => setNewTg(e.target.value)} placeholder="Telegram @username" className={inputCls} />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => { setShowForm(false); setError(null) }} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">Скасувати</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-xl bg-purple-500 text-white text-sm font-medium disabled:opacity-50">
              {saving ? '...' : 'Додати'}
            </button>
          </div>
        </form>
      )}

      <div className="px-4 py-2 border-b border-gray-100 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук..." className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none" />
        </div>
        <button onClick={() => setShowForm(p => !p)} className="w-9 h-9 bg-purple-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
          <Plus size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 px-4 pt-2 flex flex-col gap-2">
        {loading && <div className="text-center text-gray-400 py-12 text-sm">Завантаження...</div>}
        {!loading && filtered.length === 0 && (
          <div className="text-center text-gray-400 py-12 text-sm">
            <p className="text-4xl mb-3">👷</p>
            <p>{search ? 'Нічого не знайдено' : 'Немає працівників'}</p>
          </div>
        )}
        {filtered.map(worker => (
          <div key={worker.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3">
            <button onClick={() => navigate(`/workers/${worker.id}`)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
              <div className="relative w-10 h-10 flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold">
                  {worker.name.charAt(0).toUpperCase()}
                </div>
                {worker.worker_user_id && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{worker.name}</div>
                {worker.role && <div className="text-xs text-purple-400 mt-0.5">{worker.role}</div>}
                {worker.phone && <div className="text-xs text-gray-400">{worker.phone}</div>}
                {worker.telegram_username && (
                  <div className="text-xs mt-0.5">
                    <span className="text-blue-400">@{worker.telegram_username}</span>
                    {worker.worker_user_id
                      ? <span className="text-green-500 ml-1.5">● в додатку</span>
                      : <span className="text-gray-300 ml-1.5">● не підключений</span>
                    }
                  </div>
                )}
              </div>
            </button>
            {worker.telegram_username && !worker.worker_user_id && (
              <button
                onClick={() => window.open(`https://t.me/${worker.telegram_username}?text=${encodeURIComponent('Привіт! Запрошую тебе приєднатися до мене як працівник у додатку Ручнік.\n\nВідкрий додаток через бота: https://t.me/R0003_bot')}`, '_blank')}
                className="flex-shrink-0 px-2 py-1.5 bg-blue-50 text-blue-500 rounded-xl text-xs font-medium"
              >
                Запросити
              </button>
            )}
            <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
          </div>
        ))}
        {linkedWorkers.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map(c => (
          <button key={c.id} onClick={() => navigate(`/contacts/${c.id}`)}
            className="bg-white rounded-2xl border border-purple-50 px-4 py-3 flex items-center gap-3 text-left w-full">
            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {c.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900">{c.name}</div>
              {c.phone && <div className="text-xs text-gray-400 mt-0.5">{c.phone}</div>}
              <div className="text-xs text-purple-400">З контактів</div>
            </div>
            <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
          </button>
        ))}
      </div>
    </>
  )
}

function ConnectionsList() {
  const navigate = useNavigate()
  const { accepted, incoming, loading, refetch } = useConnections()
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [requestSent, setRequestSent] = useState<Set<string>>(new Set())

  async function handleSearch(q: string) {
    setSearch(q)
    if (q.trim().length < 2) { setSearchResults([]); return }
    setSearching(true)
    try {
      const results = await searchUsers(q)
      setSearchResults(results)
    } finally {
      setSearching(false)
    }
  }

  async function handleSendRequest(userId: string, name: string) {
    try {
      await sendContactRequest(userId, name)
      setRequestSent(prev => new Set([...prev, userId]))
    } catch (e: any) {
      alert(e.message)
    }
  }

  async function handleAccept(contactId: string, requesterId: string, requesterName: string) {
    await acceptContactRequest(contactId, requesterId, requesterName)
    refetch()
  }

  async function handleReject(contactId: string) {
    await rejectContactRequest(contactId)
    refetch()
  }

  const acceptedIds = new Set(accepted.map((c: any) => c.linked_user_id))

  return (
    <>
      <div className="px-4 py-2 border-b border-gray-100">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Пошук за іменем..."
            className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 px-4 pt-2 flex flex-col gap-3">
        {/* Search results */}
        {search.trim().length >= 2 && (
          <div>
            <p className="text-xs text-gray-400 mb-2">Результати пошуку</p>
            {searching && <div className="text-center text-gray-400 py-4 text-sm">Пошук...</div>}
            {!searching && searchResults.length === 0 && (
              <div className="text-center text-gray-400 py-4 text-sm">Нікого не знайдено</div>
            )}
            {searchResults.map(u => (
              <div key={u.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{u.name}</div>
                </div>
                {acceptedIds.has(u.id) ? (
                  <span className="text-xs text-green-500 font-medium">У контактах</span>
                ) : requestSent.has(u.id) ? (
                  <span className="text-xs text-gray-400">Надіслано</span>
                ) : (
                  <button onClick={() => handleSendRequest(u.id, u.name)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-xl text-xs font-medium">
                    <UserPlus size={13} /> Додати
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Incoming requests */}
        {incoming.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-2">Вхідні запити ({incoming.length})</p>
            {incoming.map((c: any) => (
              <div key={c.id} className="bg-white rounded-2xl border border-orange-100 px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {(c.owner?.name ?? c.name ?? '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{c.owner?.name ?? c.name}</div>
                  <div className="text-xs text-gray-400">хоче додати вас до контактів</div>
                </div>
                <button onClick={() => handleAccept(c.id, c.owner_user_id, c.owner?.name ?? c.name)}
                  className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center">
                  <Check size={16} />
                </button>
                <button onClick={() => handleReject(c.id)}
                  className="w-8 h-8 bg-red-50 text-red-400 rounded-full flex items-center justify-center ml-1">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Accepted connections */}
        {loading && <div className="text-center text-gray-400 py-8 text-sm">Завантаження...</div>}
        {!loading && accepted.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-2">Мої контакти ({accepted.length})</p>
            {accepted.map((c: any) => (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3">
                <button onClick={() => navigate(`/contacts/${c.id}`)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{c.name}</div>
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {c.is_client && <span className="text-xs text-blue-500">Замовник</span>}
                      {c.is_worker && <span className="text-xs text-purple-500">Працівник</span>}
                      {c.is_partner && <span className="text-xs text-green-500">Напарник</span>}
                      {c.is_supplier && <span className="text-xs text-orange-500">Постачальник</span>}
                    </div>
                  </div>
                </button>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}

        {!loading && accepted.length === 0 && incoming.length === 0 && search.trim().length < 2 && (
          <div className="text-center text-gray-400 py-12 text-sm">
            <p className="text-4xl mb-3">🤝</p>
            <p>Знайдіть людей через пошук</p>
            <p className="text-xs mt-1">і надішліть їм запит на з'єднання</p>
          </div>
        )}
      </div>
    </>
  )
}
