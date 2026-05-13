import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Copy, Trash2, Filter, ChevronDown } from 'lucide-react'
import { useRecords, deleteRecord, createRecord } from '../hooks/useRecords'
import { useClients } from '../hooks/useClients'
import { PageHeader } from '../components/PageHeader'
import { formatMoney, formatDateShort, toInputDate } from '../lib/format'
import type { RecordType } from '../types'

type Period = 'today' | 'week' | 'month' | 'custom'

function getPeriodDates(period: Period): { from: string; to: string } {
  const now = new Date()
  const today = toInputDate(now)
  if (period === 'today') return { from: today, to: today }
  if (period === 'week') {
    const d = new Date(now)
    d.setDate(d.getDate() - 6)
    return { from: toInputDate(d), to: today }
  }
  if (period === 'month') {
    const d = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: toInputDate(d), to: today }
  }
  return { from: '', to: '' }
}

export function RecordsPage() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<Period>('month')
  const [typeFilter, setTypeFilter] = useState<RecordType | ''>('')
  const [clientFilter, setClientFilter] = useState('')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState(toInputDate())
  const [showFilters, setShowFilters] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { from, to } = period === 'custom' ? { from: customFrom, to: customTo } : getPeriodDates(period)
  const { records, loading, refetch } = useRecords({
    type: typeFilter || undefined,
    clientId: clientFilter || undefined,
    dateFrom: from || undefined,
    dateTo: to || undefined,
  })
  const { clients } = useClients()

  const totalIncome = records.filter(r => r.type === 'income' && r.status === 'paid').reduce((s, r) => s + Number(r.amount), 0)
  const totalExpense = records.filter(r => r.type === 'expense').reduce((s, r) => s + Number(r.amount), 0)

  async function handleDelete(id: string) {
    if (!confirm('Видалити запис?')) return
    await deleteRecord(id)
    setExpandedId(null)
    refetch()
  }

  async function handleCopy(record: any) {
    await createRecord({
      type: record.type,
      amount: Number(record.amount),
      date: new Date().toISOString().slice(0, 10),
      description: record.description,
      category_id: record.category_id,
      subcategory_id: record.subcategory_id,
      client_id: record.client_id,
      payment_method: record.payment_method,
      status: record.status,
      dimensions: record.dimensions,
      photos: [],
      tag_ids: record.tags?.map((t: any) => t.id) ?? [],
    })
    refetch()
  }

  const periods: [Period, string][] = [['today', 'Сьогодні'], ['week', 'Тиждень'], ['month', 'Місяць'], ['custom', 'Вибрати']]

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24">
      <div className="bg-white">
      <PageHeader title="Записи" right={
        <button onClick={() => setShowFilters(p => !p)} className={`p-2 rounded-xl ${showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}>
          <Filter size={20} />
        </button>
      } />

      {/* Period selector */}
      <div className="px-4 py-2 flex gap-1.5 bg-white border-b border-gray-100 overflow-x-auto">
        {periods.map(([p, l]) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${period === p ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      {period === 'custom' && (
        <div className="px-4 py-2 flex gap-2 bg-white border-b border-gray-100">
          <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
          <span className="self-center text-gray-400">—</span>
          <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="px-4 py-2 flex flex-col gap-2 bg-white border-b border-gray-100">
          <div className="flex gap-2">
            {([['', 'Всі'], ['income', 'Доходи'], ['expense', 'Витрати']] as [RecordType | '', string][]).map(([v, l]) => (
              <button key={v} onClick={() => setTypeFilter(v)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${typeFilter === v ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {l}
              </button>
            ))}
          </div>
          <select value={clientFilter} onChange={e => setClientFilter(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400">
            <option value="">Всі замовники</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}

      {/* Summary bar */}
      <div className="px-4 py-2.5 flex gap-4 bg-gray-50 border-b border-gray-100 text-sm">
        <span className="text-green-600 font-medium">↑ {formatMoney(totalIncome)}</span>
        <span className="text-red-500 font-medium">↓ {formatMoney(totalExpense)}</span>
        <span className={`font-semibold ml-auto ${totalIncome - totalExpense >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          = {formatMoney(totalIncome - totalExpense)}
        </span>
      </div>

      </div>

      {/* List */}
      <div className="px-4 pt-3 pb-4 flex flex-col gap-2">
        {loading && <div className="text-center text-gray-400 py-12 text-sm">Завантаження...</div>}
        {!loading && records.length === 0 && (
          <div className="text-center text-gray-400 py-12 text-sm">
            <p className="text-4xl mb-3">📭</p>
            <p>Немає записів</p>
          </div>
        )}
        {records.map(record => {
          const expanded = expandedId === record.id
          return (
            <div key={record.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <button className="w-full px-4 py-3 flex items-center gap-3 text-left" onClick={() => setExpandedId(expanded ? null : record.id)}>
                {record.photos?.length > 0
                  ? <img src={record.photos[0]} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                  : <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 ${record.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}>
                      {record.type === 'income' ? '↑' : '↓'}
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {record.category?.name ?? (record.type === 'income' ? 'Дохід' : 'Витрата')}
                  </div>
                  <div className="text-xs text-gray-400 truncate">{record.client?.name ?? record.description ?? ''}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <div className={`font-semibold text-sm ${record.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                      {record.type === 'income' ? '+' : '−'}{formatMoney(Number(record.amount))}
                    </div>
                    {record.type === 'income' && (
                      <div className={`text-xs ${record.status === 'paid' ? 'text-green-500' : 'text-orange-400'}`}>
                        {record.status === 'paid' ? 'Оплачено' : 'Очікує'}
                      </div>
                    )}
                  </div>
                  <ChevronDown size={16} className={`text-gray-300 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {expanded && (
                <div className="px-4 pb-3 border-t border-gray-50">
                  <div className="py-2 flex flex-col gap-1.5 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Дата</span>
                      <span className="text-gray-800">{formatDateShort(record.date)}</span>
                    </div>
                    {record.category && (
                      <div className="flex justify-between">
                        <span>Категорія</span>
                        <span className="text-gray-800">{record.category.name}</span>
                      </div>
                    )}
                    {record.client && (
                      <div className="flex justify-between">
                        <span>Замовник</span>
                        <span className="text-gray-800">{record.client.name}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Оплата</span>
                      <span className="text-gray-800">{{ cash: 'Готівка', card: 'Картка', fop: 'ФОП' }[record.payment_method]}</span>
                    </div>
                    {record.description && (
                      <div className="flex justify-between gap-4">
                        <span>Опис</span>
                        <span className="text-gray-800 text-right">{record.description}</span>
                      </div>
                    )}
                    {record.dimensions && Object.keys(record.dimensions).length > 0 && (
                      <div className="flex justify-between">
                        <span>Розміри</span>
                        <span className="text-gray-800">
                          {[record.dimensions.width, record.dimensions.height, record.dimensions.thickness].filter(Boolean).join(' × ')} см
                        </span>
                      </div>
                    )}
                  </div>
                  {record.photos?.length > 0 && (
                    <div className="flex gap-2 mb-2 flex-wrap">
                      {record.photos.map((url: string, i: number) => (
                        <img key={i} src={url} alt="" className="w-16 h-16 rounded-xl object-cover" />
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2 border-t border-gray-50">
                    <button onClick={() => navigate(`/records/${record.id}/edit`)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs text-blue-500 py-2 rounded-xl bg-blue-50">
                      <Pencil size={13} /> Редагувати
                    </button>
                    <button onClick={() => handleCopy(record)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs text-gray-600 py-2 rounded-xl bg-gray-100">
                      <Copy size={13} /> Копіювати
                    </button>
                    <button onClick={() => handleDelete(record.id)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs text-red-500 py-2 rounded-xl bg-red-50">
                      <Trash2 size={13} /> Видалити
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
