import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { updateContact, deleteContact } from '../hooks/useContacts'
import type { Contact } from '../types'

const ROLES = [
  { key: 'is_client', label: 'Замовник', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'is_worker', label: 'Працівник', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { key: 'is_partner', label: 'Напарник', color: 'bg-green-100 text-green-700 border-green-200' },
  { key: 'is_supplier', label: 'Постачальник', color: 'bg-orange-100 text-orange-700 border-orange-200' },
] as const

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [roles, setRoles] = useState({ is_client: false, is_worker: false, is_partner: false, is_supplier: false })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    supabase.from('contacts').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setContact(data as Contact)
        setName(data.name)
        setPhone(data.phone ?? '')
        setNotes(data.notes ?? '')
        setRoles({
          is_client: data.is_client,
          is_worker: data.is_worker,
          is_partner: data.is_partner,
          is_supplier: (data as any).is_supplier ?? false,
        })
      }
      setLoading(false)
    })
  }, [id])

  async function handleSave() {
    if (!id || !name.trim()) return
    setSaving(true)
    try {
      await updateContact(id, { name: name.trim(), phone: phone || null, notes: notes || null, ...roles })
      navigate(-1)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!id || !confirm(`Видалити контакт "${contact?.name}"?`)) return
    await deleteContact(id)
    navigate('/contacts')
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors'

  if (loading) return <div className="flex items-center justify-center h-full text-gray-400 text-sm">Завантаження...</div>
  if (!contact) return <div className="flex items-center justify-center h-full text-gray-400 text-sm">Контакт не знайдено</div>

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-28">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-40">
        <button onClick={() => navigate(-1)} className="text-blue-500"><ChevronLeft size={22} /></button>
        <h1 className="text-lg font-semibold text-gray-900 flex-1 truncate">{contact.name}</h1>
        <button onClick={handleDelete} className="text-red-400 p-1"><Trash2 size={18} /></button>
      </header>

      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* Avatar */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl font-bold">
            {name.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Ім'я та прізвище</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ім'я" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Телефон</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+380..." type="tel" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Нотатки</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Додаткова інформація..." className={inputCls + ' resize-none'} />
          </div>
        </div>

        {/* Roles */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Ролі</label>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map(role => (
              <button
                key={role.key}
                type="button"
                onClick={() => setRoles(prev => ({ ...prev, [role.key]: !prev[role.key] }))}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  roles[role.key] ? role.color + ' border-current' : 'bg-white text-gray-400 border-gray-200'
                }`}
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                  roles[role.key] ? 'border-current bg-current' : 'border-gray-300'
                }`}>
                  {roles[role.key] && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                {role.label}
              </button>
            ))}
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="w-full py-3 bg-blue-500 text-white rounded-2xl font-medium disabled:opacity-50"
        >
          {saving ? 'Збереження...' : 'Зберегти'}
        </button>
      </div>
    </div>
  )
}
