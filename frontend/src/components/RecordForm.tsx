import { useState, useRef } from 'react'
import { X, Camera, ChevronDown } from 'lucide-react'
import type { RecordType, PaymentMethod, RecordStatus, Dimensions } from '../types'
import { useCategories, useTags } from '../hooks/useCategories'
import { useClients, createClient } from '../hooks/useClients'
import { supabase } from '../lib/supabase'
import { toInputDate } from '../lib/format'
import { haptic } from '../lib/telegram'

interface FormValues {
  type: RecordType
  title: string
  amount: string
  date: string
  description: string
  category_id: string
  subcategory_id: string
  client_id: string
  payment_method: PaymentMethod
  status: RecordStatus
  tag_ids: string[]
  photos: string[]
  dimensions: Dimensions
}

interface Props {
  initialType?: RecordType
  initialValues?: Partial<FormValues>
  onSubmit: (values: FormValues) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

export function RecordForm({ initialType = 'income', initialValues, onSubmit, onCancel, submitLabel = 'Зберегти' }: Props) {
  const [values, setValues] = useState<FormValues>({
    type: initialType,
    title: '',
    amount: '',
    date: toInputDate(),
    description: '',
    category_id: '',
    subcategory_id: '',
    client_id: '',
    payment_method: 'cash',
    status: 'pending',
    tag_ids: [],
    photos: [],
    dimensions: {},
    ...initialValues,
  })
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [showNewClient, setShowNewClient] = useState(false)
  const [showDimensions, setShowDimensions] = useState(!!initialValues?.dimensions)
  const fileRef = useRef<HTMLInputElement>(null)

  const { categories } = useCategories(values.type)
  const { tags } = useTags()
  const { clients, refetch: refetchClients } = useClients()

  const selectedCategory = categories.find(c => c.id === values.category_id)

  function set<K extends keyof FormValues>(key: K, val: FormValues[K]) {
    setValues(prev => ({ ...prev, [key]: val }))
  }

  async function uploadPhoto(file: File) {
    setUploadingPhoto(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `records/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('photos').upload(path, file)
      if (error) throw error
      const { data } = supabase.storage.from('photos').getPublicUrl(path)
      set('photos', [...values.photos, data.publicUrl])
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handleAddClient() {
    if (!newClientName.trim()) return
    const client = await createClient({ name: newClientName.trim() })
    await refetchClients()
    set('client_id', client.id)
    setNewClientName('')
    setShowNewClient(false)
    haptic('light')
  }

  function toggleTag(id: string) {
    set('tag_ids', values.tag_ids.includes(id)
      ? values.tag_ids.filter(t => t !== id)
      : [...values.tag_ids, id])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!values.amount || isNaN(Number(values.amount))) return
    setSaving(true)
    try {
      await onSubmit(values)
      haptic('medium')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors'
  const labelCls = 'block text-xs font-medium text-gray-500 mb-1'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 pb-36">

      {/* Type toggle */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200">
        {(['income', 'expense'] as RecordType[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => { set('type', t); set('category_id', ''); set('subcategory_id', '') }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              values.type === t
                ? t === 'income' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                : 'bg-white text-gray-500'
            }`}
          >
            {t === 'income' ? '+ Дохід' : '− Витрата'}
          </button>
        ))}
      </div>

      {/* Title */}
      <div>
        <label className={labelCls}>Назва</label>
        <input
          type="text"
          placeholder={values.type === 'income' ? 'Назва доходу...' : 'Назва витрати...'}
          value={values.title}
          onChange={e => set('title', e.target.value)}
          className={inputCls}
        />
      </div>

      {/* Amount + Date */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Сума (₴)</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={values.amount}
            onChange={e => set('amount', e.target.value)}
            className={inputCls + ' text-xl font-bold'}
            required
          />
        </div>
        <div>
          <label className={labelCls}>Дата</label>
          <input type="date" value={values.date} onChange={e => set('date', e.target.value)} className={inputCls} required />
        </div>
      </div>

      {/* Category + Client */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Категорія</label>
          <select value={values.category_id} onChange={e => { set('category_id', e.target.value); set('subcategory_id', '') }} className={inputCls}>
            <option value="">— оберіть —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {values.type === 'income' && !showNewClient && (
          <div>
            <label className={labelCls}>Замовник</label>
            <div className="flex gap-1">
              <select value={values.client_id} onChange={e => set('client_id', e.target.value)} className={inputCls}>
                <option value="">— оберіть —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="button" onClick={() => setShowNewClient(true)} className="px-2 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium whitespace-nowrap">+</button>
            </div>
          </div>
        )}
      </div>

      {/* New client input */}
      {values.type === 'income' && showNewClient && (
        <div>
          <label className={labelCls}>Новий замовник</label>
          <div className="flex gap-2">
            <input value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="Ім'я замовника" className={inputCls} />
            <button type="button" onClick={handleAddClient} className="px-3 py-2 bg-green-500 text-white rounded-xl text-sm font-medium">Додати</button>
            <button type="button" onClick={() => setShowNewClient(false)} className="px-2 py-2 text-gray-400"><X size={18} /></button>
          </div>
        </div>
      )}

      {/* Subcategory */}
      {selectedCategory?.subcategories?.length ? (
        <div>
          <label className={labelCls}>Підкатегорія</label>
          <select value={values.subcategory_id} onChange={e => set('subcategory_id', e.target.value)} className={inputCls}>
            <option value="">— оберіть —</option>
            {selectedCategory.subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      ) : null}


      {/* Payment method */}
      <div>
        <label className={labelCls}>Спосіб оплати</label>
        <div className="flex gap-2">
          {([['cash', 'Готівка'], ['card', 'Картка']] as [PaymentMethod, string][]).map(([v, l]) => (
            <button key={v} type="button" onClick={() => set('payment_method', v)}
              className={`flex-1 py-2 text-sm rounded-xl border transition-colors ${values.payment_method === v ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Status (income only) */}
      {values.type === 'income' && (
        <div>
          <label className={labelCls}>Статус оплати</label>
          <div className="flex gap-2">
            {([['paid', '✓ Оплачено'], ['pending', '⏳ Очікує']] as [RecordStatus, string][]).map(([v, l]) => (
              <button key={v} type="button" onClick={() => set('status', v)}
                className={`flex-1 py-2 text-sm rounded-xl border transition-colors ${values.status === v ? (v === 'paid' ? 'bg-green-500 text-white border-green-500' : 'bg-orange-400 text-white border-orange-400') : 'bg-white text-gray-600 border-gray-200'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div>
        <label className={labelCls}>Опис (необов'язково)</label>
        <textarea value={values.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Деталі роботи..." className={inputCls + ' resize-none'} />
      </div>

      {/* Dimensions toggle */}
      <button type="button" onClick={() => setShowDimensions(p => !p)} className="flex items-center gap-1.5 text-sm text-blue-500 font-medium self-start">
        <ChevronDown size={16} className={`transition-transform ${showDimensions ? 'rotate-180' : ''}`} />
        Розміри виробу
      </button>

      {showDimensions && (
        <div className="grid grid-cols-3 gap-2">
          {(['width', 'height', 'thickness'] as const).map(dim => (
            <div key={dim}>
              <label className={labelCls}>{dim === 'width' ? 'Ширина' : dim === 'height' ? 'Висота' : 'Товщина'} (см)</label>
              <input type="number" inputMode="decimal" placeholder="0"
                value={values.dimensions[dim] ?? ''}
                onChange={e => set('dimensions', { ...values.dimensions, [dim]: e.target.value ? Number(e.target.value) : undefined })}
                className={inputCls} />
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div>
          <label className={labelCls}>Теги</label>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${values.tag_ids.includes(tag.id) ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200'}`}
                style={values.tag_ids.includes(tag.id) ? { backgroundColor: tag.color, borderColor: tag.color } : {}}>
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Photos */}
      <div>
        <label className={labelCls}>Фото (до 5)</label>
        <div className="flex gap-2 flex-wrap">
          {values.photos.map((url, i) => (
            <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => set('photos', values.photos.filter((_, j) => j !== i))}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                <X size={12} className="text-white" />
              </button>
            </div>
          ))}
          {values.photos.length < 5 && (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingPhoto}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 text-xs">
              <Camera size={20} />
              {uploadingPhoto ? '...' : 'Фото'}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.target.value = '' }} />
        </div>
      </div>

      {/* Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex gap-3 z-40" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 72px)' }}>
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium">Скасувати</button>
        <button type="submit" disabled={saving}
          className={`flex-1 py-3 rounded-xl font-medium text-white transition-colors ${values.type === 'income' ? 'bg-green-500' : 'bg-red-500'} disabled:opacity-50`}>
          {saving ? 'Збереження...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
