import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Pencil, Trash2, ChevronLeft, Send } from 'lucide-react'
import { useWorkers, updateWorker, deleteWorker } from '../hooks/useWorkers'

export function WorkerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { workers, refetch } = useWorkers()
  const worker = workers.find(w => w.id === id)

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(worker?.name ?? '')
  const [editPhone, setEditPhone] = useState(worker?.phone ?? '')
  const [editRole, setEditRole] = useState(worker?.role ?? '')
  const [editNotes, setEditNotes] = useState(worker?.notes ?? '')
  const [editTg, setEditTg] = useState(worker?.telegram_username ?? '')

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors'

  async function handleSave() {
    if (!id || !editName.trim()) return
    await updateWorker(id, {
      name: editName.trim(),
      phone: editPhone || null,
      role: editRole || null,
      notes: editNotes || null,
      telegram_username: editTg.replace('@', '') || null,
    })
    await refetch()
    setEditing(false)
  }

  async function handleDelete() {
    if (!id || !confirm(`Видалити працівника "${worker?.name}"?`)) return
    await deleteWorker(id)
    navigate('/contacts')
  }

  function handleInvite() {
    if (!worker?.telegram_username) return
    const text = encodeURIComponent('Привіт! Запрошую тебе приєднатися до мене як працівник у додатку Ручнік. Напиши мені для підтвердження.')
    window.open(`https://t.me/${worker.telegram_username}?text=${text}`, '_blank')
  }

  if (!worker) return (
    <div className="flex flex-col h-full items-center justify-center text-gray-400">
      <p>Працівника не знайдено</p>
      <button onClick={() => navigate('/contacts')} className="mt-3 text-blue-500 text-sm">← Назад</button>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-28">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-40">
        <button onClick={() => navigate('/contacts')} className="text-blue-500"><ChevronLeft size={22} /></button>
        <h1 className="text-lg font-semibold text-gray-900 flex-1 truncate">{worker.name}</h1>
        <button onClick={() => setEditing(p => !p)} className="text-gray-500 p-1"><Pencil size={18} /></button>
        <button onClick={handleDelete} className="text-red-400 p-1"><Trash2 size={18} /></button>
      </header>

      <div className="px-4 pt-4 flex flex-col gap-4">
        {editing ? (
          <div className="bg-purple-50 rounded-2xl p-4 flex flex-col gap-2">
            <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Ім'я *" className={inputCls} />
            <input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Телефон" type="tel" className={inputCls} />
            <input value={editRole} onChange={e => setEditRole(e.target.value)} placeholder="Роль / посада" className={inputCls} />
            <input value={editTg} onChange={e => setEditTg(e.target.value)} placeholder="Telegram @username" className={inputCls} />
            <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Нотатки" rows={3} className={inputCls + ' resize-none'} />
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">Скасувати</button>
              <button onClick={handleSave} className="flex-1 py-2 rounded-xl bg-purple-500 text-white text-sm font-medium">Зберегти</button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-2xl font-bold">
                {worker.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{worker.name}</div>
                {worker.role && <div className="text-sm text-purple-500">{worker.role}</div>}
                {worker.phone && <div className="text-sm text-gray-500">{worker.phone}</div>}
                {worker.telegram_username && <div className="text-sm text-blue-500">@{worker.telegram_username}</div>}
              </div>
            </div>
            {worker.notes && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-400 mb-1">Нотатки</div>
                <div className="text-sm text-gray-700">{worker.notes}</div>
              </div>
            )}
          </div>
        )}

        {worker.telegram_username && (
          <button onClick={handleInvite}
            className="flex items-center justify-center gap-2 bg-blue-500 text-white py-3 rounded-2xl font-medium text-sm">
            <Send size={16} /> Запросити у Telegram
          </button>
        )}
      </div>
    </div>
  )
}
