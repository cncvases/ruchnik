import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2, Filter } from 'lucide-react'
import { useRecords, deleteRecord } from '../hooks/useRecords'
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
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState(toInputDate())
  const [showFilters, setShowFilters] = useState(false)

  const { from, to } = period === 'custom' ? { from: customFrom, to: customTo } : getPeriodDates(period)
  const { records, loading, refetch } = useRecords({
    type: typeFilter || undefined,
    dateFrom: from || undefined,
    dateTo: to || undefined,
  })

  const totalIncome = records.filter(r => r.type === 'income').reduce((s, r) => s + Number(r.amount), 0)
  const totalExpense = records.filter(r => r.type === 'expense').reduce((s, r) => s + Number(r.amount), 0)

  async function handleDelete(id: string) {
    if (!confirm('Видалити запис?')) return
    await deleteRecord(id)
    refetch()
  }

  const periods: [Period, string][] = [['today', 'Сьогодні'], ['week', 'Тиждень'], ['month', 'Місяць'], ['custom', 'Вибрати']]

  return (
    <div className="flex flex-col h-full">
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

      {/* Type filter */}
      {showFilters && (
        <div className="px-4 py-2 flex gap-2 bg-white border-b border-gray-100">
          {([['', 'Всі'], ['income', 'Доходи'], ['expense', 'Витрати']] as [RecordType | '', string][]).map(([v, l]) => (
            <button key={v} onClick={() => setTypeFilter(v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${typeFilter === v ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {l}
            </button>
          ))}
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

      {/* List */}
      <div className="flex-1 overflow-y-auto pb-20 px-4 pt-3 flex flex-col gap-2">
        {loading && <div className="text-center text-gray-400 py-12 text-sm">Завантаження...</div>}
        {!loading && records.length === 0 && (
          <div className="text-center text-gray-400 py-12 text-sm">
            <p className="text-4xl mb-3">📭</p>
            <p>Немає записів</p>
          </div>
        )}
        {records.map(record => (
          <div key={record.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-3">
            <div className="flex items-start gap-3">
              {record.photos?.length > 0
                ? <img src={record.photos[0]} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-0.5" />
                : <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 mt-0.5 ${record.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {record.type === 'income' ? '↑' : '↓'}
                  </div>
              }
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {record.category?.name ?? (record.type === 'income' ? 'Дохід' : 'Витрата')}
                  </span>
                  <span className={`text-sm font-semibold ml-2 flex-shrink-0 ${record.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                    {record.type === 'income' ? '+' : '−'}{formatMoney(Number(record.amount))}
                  </span>
                </div>
                {record.client && <div className="text-xs text-gray-400 mt-0.5">{record.client.name}</div>}
                {record.description && <div className="text-xs text-gray-500 mt-0.5 truncate">{record.description}</div>}
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs text-gray-400">{formatDateShort(record.date)}</span>
                  {record.type === 'income' && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${record.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-500'}`}>
                      {record.status === 'paid' ? 'Оплачено' : 'Очікує'}
                    </span>
                  )}
                  {record.photos?.length > 0 && <span className="text-xs text-gray-400">📷 {record.photos.length}</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-2 pt-2 border-t border-gray-50">
              <button onClick={() => navigate(`/records/${record.id}/edit`)} className="flex items-center gap-1 text-xs text-blue-500 px-2 py-1 rounded-lg bg-blue-50">
                <Pencil size={12} /> Редагувати
              </button>
              <button onClick={() => handleDelete(record.id)} className="flex items-center gap-1 text-xs text-red-500 px-2 py-1 rounded-lg bg-red-50">
                <Trash2 size={12} /> Видалити
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
