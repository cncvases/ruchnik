import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Pencil, Trash2, Send, ChevronLeft } from 'lucide-react'
import { useClients, updateClient, deleteClient } from '../hooks/useClients'
import { useRecords, deleteRecord } from '../hooks/useRecords'
import { formatMoney, formatDateShort, toInputDate } from '../lib/format'

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { clients, refetch: refetchClients } = useClients()
  const client = clients.find(c => c.id === id)

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(client?.name ?? '')
  const [editPhone, setEditPhone] = useState(client?.phone ?? '')
  const [editTg, setEditTg] = useState(client?.telegram_username ?? '')
  const [period, setPeriod] = useState<'all' | 'month' | 'week'>('all')

  const now = new Date()
  const dateFrom = period === 'week'
    ? toInputDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6))
    : period === 'month'
    ? toInputDate(new Date(now.getFullYear(), now.getMonth(), 1))
    : undefined

  const { records, refetch: refetchRecords } = useRecords({ clientId: id, dateFrom })

  const totalPaid = records.filter(r => r.type === 'income' && r.status === 'paid').reduce((s, r) => s + Number(r.amount), 0)
  const totalPending = records.filter(r => r.type === 'income' && r.status === 'pending').reduce((s, r) => s + Number(r.amount), 0)

  async function handleSaveEdit() {
    if (!id || !editName.trim()) return
    await updateClient(id, { name: editName.trim(), phone: editPhone || null, telegram_username: editTg || null })
    await refetchClients()
    setEditing(false)
  }

  async function handleDelete() {
    if (!id || !confirm(`Видалити замовника "${client?.name}"?`)) return
    await deleteClient(id)
    navigate('/clients')
  }

  async function handleDeleteRecord(recordId: string) {
    if (!confirm('Видалити запис?')) return
    await deleteRecord(recordId)
    refetchRecords()
  }

  function handleSendReport() {
    if (!client?.telegram_username) {
      alert('У замовника не вказано Telegram username')
      return
    }
    const lines = [
      `📋 Звіт для ${client.name}`,
      '',
      ...records.filter(r => r.type === 'income').map(r =>
        `• ${formatDateShort(r.date)} — ${r.category?.name ?? 'Робота'}: ${formatMoney(Number(r.amount))} [${r.status === 'paid' ? '✓ Оплачено' : '⏳ Очікує'}]${r.description ? `\n  ${r.description}` : ''}`
      ),
      '',
      `Оплачено: ${formatMoney(totalPaid)}`,
      `Очікує: ${formatMoney(totalPending)}`,
    ]
    const text = encodeURIComponent(lines.join('\n'))
    window.open(`https://t.me/${client.telegram_username}?text=${text}`, '_blank')
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors'

  if (!client) return (
    <div className="flex flex-col h-full items-center justify-center text-gray-400">
      <p>Замовника не знайдено</p>
      <button onClick={() => navigate('/contacts')} className="mt-3 text-blue-500 text-sm">← Назад</button>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-28">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-40">
        <button onClick={() => navigate('/contacts')} className="text-blue-500"><ChevronLeft size={22} /></button>
        <h1 className="text-lg font-semibold text-gray-900 flex-1 truncate">{client.name}</h1>
        <button onClick={() => setEditing(p => !p)} className="text-gray-500 p-1"><Pencil size={18} /></button>
        <button onClick={handleDelete} className="text-red-400 p-1"><Trash2 size={18} /></button>
      </header>

      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* Edit form */}
        {editing ? (
          <div className="bg-blue-50 rounded-2xl p-4 flex flex-col gap-2">
            <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Ім'я *" className={inputCls} />
            <input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Телефон" className={inputCls} />
            <input value={editTg} onChange={e => setEditTg(e.target.value)} placeholder="@telegram" className={inputCls} />
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">Скасувати</button>
              <button onClick={handleSaveEdit} className="flex-1 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium">Зберегти</button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{client.name}</div>
                {client.phone && <div className="text-sm text-gray-500">{client.phone}</div>}
                {client.telegram_username && <div className="text-sm text-blue-500">@{client.telegram_username}</div>}
              </div>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <div className="text-xs text-green-600 mb-1">Оплачено</div>
                <div className="font-bold text-green-700 text-sm">{formatMoney(totalPaid)}</div>
              </div>
              <div className="bg-orange-50 rounded-xl p-3 text-center">
                <div className="text-xs text-orange-500 mb-1">Очікує</div>
                <div className="font-bold text-orange-600 text-sm">{formatMoney(totalPending)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Send report */}
        <button onClick={handleSendReport}
          className="flex items-center justify-center gap-2 bg-blue-500 text-white py-3 rounded-2xl font-medium text-sm">
          <Send size={16} /> Надіслати звіт у Telegram
        </button>

        {/* Period filter */}
        <div className="flex gap-2">
          {([['all', 'Всі'], ['month', 'Місяць'], ['week', 'Тиждень']] as ['all' | 'month' | 'week', string][]).map(([p, l]) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === p ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Records */}
        {records.length === 0 ? (
          <div className="text-center text-gray-400 py-8 text-sm">
            <p className="text-3xl mb-2">📋</p>
            <p>Немає записів</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {records.map(record => (
              <div key={record.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 ${record.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {record.type === 'income' ? '↑' : '↓'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900">{record.category?.name ?? 'Запис'}</span>
                      <span className={`text-sm font-semibold ${record.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                        {record.type === 'income' ? '+' : '−'}{formatMoney(Number(record.amount))}
                      </span>
                    </div>
                    {record.description && <div className="text-xs text-gray-500 mt-0.5">{record.description}</div>}
                    {record.dimensions && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        {[record.dimensions.width && `${record.dimensions.width}×`, record.dimensions.height && `${record.dimensions.height}`, record.dimensions.thickness && `×${record.dimensions.thickness}`].filter(Boolean).join('')} см
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">{formatDateShort(record.date)}</span>
                      {record.type === 'income' && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${record.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-500'}`}>
                          {record.status === 'paid' ? '✓ Оплачено' : '⏳ Очікує'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-2 pt-2 border-t border-gray-50">
                  <button onClick={() => handleDeleteRecord(record.id)} className="flex items-center gap-1 text-xs text-red-500 px-2 py-1 rounded-lg bg-red-50">
                    <Trash2 size={12} /> Видалити
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
