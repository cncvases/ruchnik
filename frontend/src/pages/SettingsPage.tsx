import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Share2, ToggleLeft, ToggleRight } from 'lucide-react'
import {
  useCategories, useTags,
  createCategory, deleteCategory,
  createSubcategory, deleteSubcategory,
  createTag, deleteTag,
} from '../hooks/useCategories'
import { useCatalog, createCatalogItem, updateCatalogItem, deleteCatalogItem } from '../hooks/useCatalog'
import { createInvite } from '../hooks/useContacts'
import { formatMoney } from '../lib/format'
import { PageHeader } from '../components/PageHeader'
import type { RecordType } from '../types'

const COLORS = ['#2481cc', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {COLORS.map(c => (
        <button key={c} type="button" onClick={() => onChange(c)}
          className={`w-6 h-6 rounded-full transition-transform ${value === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''}`}
          style={{ backgroundColor: c }} />
      ))}
    </div>
  )
}

function CategorySection({ type, label }: { type: RecordType; label: string }) {
  const { categories, refetch } = useCategories(type)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(COLORS[0])
  const [showAdd, setShowAdd] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [subName, setSubName] = useState('')

  async function handleAddCategory() {
    if (!newName.trim()) return
    await createCategory({ name: newName.trim(), type, color: newColor })
    setNewName(''); setShowAdd(false)
    refetch()
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('Видалити категорію?')) return
    await deleteCategory(id)
    refetch()
  }

  async function handleAddSub(categoryId: string) {
    if (!subName.trim()) return
    await createSubcategory({ category_id: categoryId, name: subName.trim() })
    setSubName('')
    refetch()
  }

  async function handleDeleteSub(id: string) {
    if (!confirm('Видалити підкатегорію?')) return
    await deleteSubcategory(id)
    refetch()
  }

  const inputCls = 'flex-1 border border-gray-200 rounded-lg px-2.5 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
        <button onClick={() => setShowAdd(p => !p)} className="text-blue-500 p-1"><Plus size={18} /></button>
      </div>

      {showAdd && (
        <div className="px-4 py-3 bg-blue-50 border-b border-gray-100 flex flex-col gap-2">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Назва категорії" className={inputCls + ' w-full'} />
          <ColorPicker value={newColor} onChange={setNewColor} />
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600">Скасувати</button>
            <button onClick={handleAddCategory} className="flex-1 py-1.5 rounded-lg bg-blue-500 text-white text-sm font-medium">Додати</button>
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-50">
        {categories.map(cat => (
          <div key={cat.id}>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="flex-1 text-sm text-gray-800">{cat.name}</span>
              <button onClick={() => setExpandedId(expandedId === cat.id ? null : cat.id)} className="text-gray-400 p-1">
                {expandedId === cat.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-400 p-1"><Trash2 size={15} /></button>
            </div>

            {expandedId === cat.id && (
              <div className="px-4 pb-3 bg-gray-50">
                {cat.subcategories?.map(sub => (
                  <div key={sub.id} className="flex items-center gap-2 py-1.5 pl-5">
                    <span className="text-xs text-gray-500 flex-1">• {sub.name}</span>
                    <button onClick={() => handleDeleteSub(sub.id)} className="text-red-400"><Trash2 size={13} /></button>
                  </div>
                ))}
                <div className="flex gap-2 mt-2 pl-5">
                  <input value={subName} onChange={e => setSubName(e.target.value)} placeholder="+ Підкатегорія" className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none" />
                  <button onClick={() => handleAddSub(cat.id)} className="px-2 py-1.5 bg-blue-500 text-white rounded-lg text-xs">Додати</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {categories.length === 0 && (
          <div className="text-center text-gray-400 py-4 text-xs">Немає категорій</div>
        )}
      </div>
    </div>
  )
}

function TagsSection() {
  const { tags, refetch } = useTags()
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(COLORS[0])
  const [showAdd, setShowAdd] = useState(false)

  async function handleAdd() {
    if (!newName.trim()) return
    await createTag({ name: newName.trim(), color: newColor })
    setNewName('')
    setShowAdd(false)
    refetch()
  }

  async function handleDelete(id: string) {
    if (!confirm('Видалити тег?')) return
    await deleteTag(id)
    refetch()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <h3 className="text-sm font-semibold text-gray-700">Теги</h3>
        <button onClick={() => setShowAdd(p => !p)} className="text-blue-500 p-1"><Plus size={18} /></button>
      </div>

      {showAdd && (
        <div className="px-4 py-3 bg-blue-50 border-b border-gray-100 flex flex-col gap-2">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Назва тегу"
            className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none" />
          <ColorPicker value={newColor} onChange={setNewColor} />
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600">Скасувати</button>
            <button onClick={handleAdd} className="flex-1 py-1.5 rounded-lg bg-blue-500 text-white text-sm font-medium">Додати</button>
          </div>
        </div>
      )}

      <div className="px-4 py-3 flex flex-wrap gap-2">
        {tags.map(tag => (
          <div key={tag.id} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-white text-xs font-medium" style={{ backgroundColor: tag.color }}>
            {tag.name}
            <button onClick={() => handleDelete(tag.id)} className="ml-1 opacity-80"><Trash2 size={11} /></button>
          </div>
        ))}
        {tags.length === 0 && <span className="text-xs text-gray-400">Немає тегів</span>}
      </div>
    </div>
  )
}

function InviteSection() {
  const [myCode, setMyCode] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    try {
      const code = await createInvite()
      setMyCode(code)
    } finally {
      setGenerating(false)
    }
  }

  function handleShare() {
    if (!myCode) return
    const url = `https://t.me/R0003_bot?start=${myCode}`
    if ((window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent('Запрошую в Ручнік!')}`)
    } else {
      navigator.clipboard.writeText(url)
      alert('Посилання скопійовано!')
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50">
        <h3 className="text-sm font-semibold text-gray-700">Запрошення</h3>
        <p className="text-xs text-gray-400 mt-0.5">Запросити людину до своїх контактів</p>
      </div>
      <div className="px-4 py-3 flex flex-col gap-3">
        {myCode ? (
          <div className="flex items-center gap-3 bg-blue-50 rounded-xl px-3 py-2.5">
            <span className="font-mono text-lg font-bold text-blue-600 tracking-widest">{myCode}</span>
            <button onClick={handleShare} className="ml-auto flex items-center gap-1.5 text-sm text-blue-500 font-medium">
              <Share2 size={15} /> Поділитися
            </button>
          </div>
        ) : (
          <button onClick={handleGenerate} disabled={generating}
            className="w-full py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium disabled:opacity-50">
            {generating ? 'Генерація...' : '+ Створити інвайт-код'}
          </button>
        )}
      </div>
    </div>
  )
}

function CatalogSection() {
  const { items, refetch } = useCatalog()
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [saving, setSaving] = useState(false)

  const inputCls = 'w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400'

  async function handleAdd() {
    if (!newName.trim()) return
    setSaving(true)
    try {
      await createCatalogItem({ name: newName.trim(), price: newPrice ? Number(newPrice) : null, description: newDesc || null })
      setNewName(''); setNewPrice(''); setNewDesc(''); setShowForm(false)
      refetch()
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(id: string, current: boolean) {
    await updateCatalogItem(id, { is_active: !current })
    refetch()
  }

  async function handleDelete(id: string) {
    if (!confirm('Видалити позицію?')) return
    await deleteCatalogItem(id)
    refetch()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Каталог послуг</h3>
          <p className="text-xs text-gray-400 mt-0.5">Товари та послуги вашої фірми</p>
        </div>
        <button onClick={() => setShowForm(p => !p)} className="text-blue-500 p-1"><Plus size={18} /></button>
      </div>

      {showForm && (
        <div className="px-4 py-3 bg-blue-50 border-b border-gray-100 flex flex-col gap-2">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Назва *" className={inputCls} />
          <input value={newPrice} onChange={e => setNewPrice(e.target.value)} type="number" inputMode="decimal" placeholder="Ціна (₴)" className={inputCls} />
          <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Опис (необов'язково)" className={inputCls} />
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600">Скасувати</button>
            <button onClick={handleAdd} disabled={saving} className="flex-1 py-1.5 rounded-lg bg-blue-500 text-white text-sm font-medium disabled:opacity-50">
              {saving ? '...' : 'Додати'}
            </button>
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-50">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium ${item.is_active ? 'text-gray-900' : 'text-gray-400'}`}>{item.name}</div>
              {item.price && <div className="text-xs text-gray-500">{formatMoney(item.price)}</div>}
            </div>
            <button onClick={() => handleToggle(item.id, item.is_active)} className={item.is_active ? 'text-blue-500' : 'text-gray-300'}>
              {item.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
            </button>
            <button onClick={() => handleDelete(item.id)} className="text-red-400 p-1"><Trash2 size={15} /></button>
          </div>
        ))}
        {items.length === 0 && <div className="text-center text-gray-400 py-4 text-xs">Немає позицій</div>}
      </div>
    </div>
  )
}

export function SettingsPage() {
  return (
    <div className="flex flex-col h-full overflow-y-auto pb-28">
      <PageHeader title="Налаштування" />
      <div className="px-4 py-4 flex flex-col gap-4">
        <InviteSection />
        <CatalogSection />
        <CategorySection type="income" label="Категорії доходів" />
        <CategorySection type="expense" label="Категорії витрат" />
        <TagsSection />

        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Про додаток</h3>
          <p className="text-xs text-gray-400">Ручнік — фінансовий записник майстра по граніту</p>
          <p className="text-xs text-gray-400 mt-0.5">Версія 1.0.0</p>
        </div>
      </div>
    </div>
  )
}
