import { useState } from 'react'
import { Filter } from 'lucide-react'
import { useRecords, deleteRecord, createRecord, updateRecord } from '../hooks/useRecords'
import { useClients } from '../hooks/useClients'
import { PageHeader } from '../components/PageHeader'
import { RecordCard } from '../components/RecordCard'
import { formatMoney, toInputDate } from '../lib/format'
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

  async function handleStatusChange(id: string, status: 'paid' | 'pending') {
    await updateRecord(id, { status })
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
        {records.map(record => (
          <RecordCard
            key={record.id}
            record={record}
            expanded={expandedId === record.id}
            onToggle={() => setExpandedId(expandedId === record.id ? null : record.id)}
            onDelete={handleDelete}
            onCopy={handleCopy}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>
    </div>
  )
}
