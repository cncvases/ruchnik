import { useState } from 'react'
import { Plus, TrendingUp, TrendingDown } from 'lucide-react'
import { RecordForm } from '../components/RecordForm'
import { createRecord } from '../hooks/useRecords'
import { useRecords } from '../hooks/useRecords'
import { formatMoney } from '../lib/format'
import type { RecordType } from '../types'

export function HomePage() {
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<RecordType>('income')

  const today = new Date().toISOString().slice(0, 10)
  const { records, refetch } = useRecords({ dateFrom: today, dateTo: today })

  const todayIncome = records.filter(r => r.type === 'income').reduce((s, r) => s + Number(r.amount), 0)
  const todayExpense = records.filter(r => r.type === 'expense').reduce((s, r) => s + Number(r.amount), 0)

  function openForm(type: RecordType) {
    setFormType(type)
    setShowForm(true)
  }

  async function handleSubmit(values: any) {
    await createRecord({
      type: values.type,
      amount: Number(values.amount),
      date: values.date,
      description: values.description || null,
      category_id: values.category_id || null,
      subcategory_id: values.subcategory_id || null,
      client_id: values.client_id || null,
      payment_method: values.payment_method,
      status: values.status,
      dimensions: Object.keys(values.dimensions).length ? values.dimensions : null,
      photos: values.photos,
      tag_ids: values.tag_ids,
    })
    setShowForm(false)
    refetch()
  }

  if (showForm) {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-40">
          <button onClick={() => setShowForm(false)} className="text-blue-500 font-medium text-sm">← Назад</button>
          <h1 className="text-lg font-semibold text-gray-900">{formType === 'income' ? 'Новий дохід' : 'Нова витрата'}</h1>
        </header>
        <RecordForm
          initialType={formType}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Today summary */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 pt-6 pb-8">
        <p className="text-sm opacity-80 mb-1">Сьогодні</p>
        <div className="flex gap-6">
          <div>
            <div className="flex items-center gap-1 text-xs opacity-70 mb-0.5">
              <TrendingUp size={12} /> Дохід
            </div>
            <div className="text-2xl font-bold">{formatMoney(todayIncome)}</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs opacity-70 mb-0.5">
              <TrendingDown size={12} /> Витрата
            </div>
            <div className="text-2xl font-bold">{formatMoney(todayExpense)}</div>
          </div>
        </div>
      </div>

      {/* Quick add buttons */}
      <div className="px-4 -mt-4 flex gap-3 mb-4">
        <button onClick={() => openForm('income')} className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-3.5 rounded-2xl font-semibold text-base shadow-lg shadow-green-200">
          <Plus size={20} /> Дохід
        </button>
        <button onClick={() => openForm('expense')} className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-3.5 rounded-2xl font-semibold text-base shadow-lg shadow-red-200">
          <Plus size={20} /> Витрата
        </button>
      </div>

      {/* Today's records */}
      <div className="px-4 flex-1 overflow-y-auto pb-20">
        <h2 className="text-sm font-medium text-gray-500 mb-2">Записи за сьогодні</h2>
        {records.length === 0 ? (
          <div className="text-center text-gray-400 py-12 text-sm">
            <p className="text-4xl mb-3">📋</p>
            <p>Немає записів за сьогодні</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {records.map(record => (
              <div key={record.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 ${record.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}>
                  {record.type === 'income' ? '↑' : '↓'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {record.category?.name ?? (record.type === 'income' ? 'Дохід' : 'Витрата')}
                  </div>
                  <div className="text-xs text-gray-400 truncate">{record.client?.name ?? record.description ?? ''}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`font-semibold text-sm ${record.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                    {record.type === 'income' ? '+' : '−'}{formatMoney(Number(record.amount))}
                  </div>
                  {record.type === 'income' && (
                    <div className={`text-xs ${record.status === 'paid' ? 'text-green-500' : 'text-orange-400'}`}>
                      {record.status === 'paid' ? 'Оплачено' : 'Очікує'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
