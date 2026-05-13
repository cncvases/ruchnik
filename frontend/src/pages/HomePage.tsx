import { useState } from 'react'
import { Plus, TrendingUp, TrendingDown, CheckCircle, XCircle } from 'lucide-react'
import { RecordForm } from '../components/RecordForm'
import { RecordCard } from '../components/RecordCard'
import { createRecord, deleteRecord, updateRecord } from '../hooks/useRecords'
import { useRecords } from '../hooks/useRecords'
import { useAssignments, confirmAssignment, rejectAssignment } from '../hooks/useAssignments'
import { formatMoney, formatDateShort } from '../lib/format'
import type { RecordType } from '../types'

export function HomePage() {
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<RecordType>('income')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)
  const { records, refetch, updateLocalStatus } = useRecords({ dateFrom: today, dateTo: today })
  const { assignments, refetch: refetchAssignments } = useAssignments()

  const pendingAssignments = assignments.filter(a => a.status === 'pending')

  const todayIncome = records.filter(r => r.type === 'income').reduce((s, r) => s + Number(r.amount), 0)
  const todayExpense = records.filter(r => r.type === 'expense').reduce((s, r) => s + Number(r.amount), 0)

  function openForm(type: RecordType) {
    setFormType(type)
    setShowForm(true)
  }

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

  async function handleStatusChange(id: string, status: 'paid' | 'pending') {
    updateLocalStatus(id, status)
    await updateRecord(id, { status })
  }

  async function handleConfirm(id: string) {
    try {
      console.log('confirming:', id)
      await confirmAssignment(id)
      console.log('confirmed ok')
      await refetchAssignments()
    } catch (e: any) {
      alert('Помилка підтвердження: ' + (e?.message ?? String(e)))
    }
  }

  async function handleReject(id: string) {
    if (!confirm('Відхилити завдання?')) return
    try {
      console.log('rejecting:', id)
      await rejectAssignment(id)
      console.log('rejected ok')
      await refetchAssignments()
    } catch (e: any) {
      alert('Помилка відхилення: ' + (e?.message ?? String(e)))
    }
  }

  async function handleSubmit(values: any) {
    await createRecord({
      type: values.type,
      title: values.title || null,
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
      worker_assignments: values.worker_assignments?.filter((wa: any) => wa.worker_id && wa.amount).map((wa: any) => ({ worker_id: wa.worker_id, amount: Number(wa.amount) })),
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

      <div className="px-4 flex-1 overflow-y-auto pb-20 flex flex-col gap-4">
        {/* Pending assignments from master */}
        {pendingAssignments.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-purple-600 mb-2">Завдання від майстра ({pendingAssignments.length})</h2>
            <div className="flex flex-col gap-2">
              {pendingAssignments.map(a => (
                <div key={a.id} className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
                  <div className="flex gap-3 p-3">
                    {a.record?.photos?.[0] && (
                      <img src={a.record.photos[0]} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {a.record?.title ?? 'Робота'}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{a.record?.date ? formatDateShort(a.record.date) : ''}</div>
                      {a.record?.dimensions && Object.keys(a.record.dimensions).length > 0 && (
                        <div className="text-xs text-gray-400">
                          {[a.record.dimensions.width, a.record.dimensions.height, a.record.dimensions.thickness].filter(Boolean).join(' × ')} см
                        </div>
                      )}
                      <div className="text-base font-bold text-purple-600 mt-1">{formatMoney(Number(a.amount_paid))}</div>
                    </div>
                  </div>
                  <div className="flex border-t border-purple-50">
                    <button onClick={() => handleReject(a.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-red-500">
                      <XCircle size={16} /> Відхилити
                    </button>
                    <button onClick={() => handleConfirm(a.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-green-600 font-medium border-l border-purple-50">
                      <CheckCircle size={16} /> Підтвердити
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Today's records */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-2">Записи за сьогодні</h2>
          {records.length === 0 ? (
            <div className="text-center text-gray-400 py-12 text-sm">
              <p className="text-4xl mb-3">📋</p>
              <p>Немає записів за сьогодні</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
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
          )}
        </div>
      </div>
    </div>
  )
}
