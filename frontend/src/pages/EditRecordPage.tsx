import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { RecordForm } from '../components/RecordForm'
import { updateRecord } from '../hooks/useRecords'
import type { Record } from '../types'

export function EditRecordPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [record, setRecord] = useState<Record | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase.from('records')
      .select('*, tags:record_tags(tag_id)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) setRecord({ ...data, tags: data.tags?.map((t: any) => t.tag_id) })
        setLoading(false)
      })
  }, [id])

  async function handleSubmit(values: any) {
    if (!id) return
    await updateRecord(id, {
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
    navigate('/records')
  }

  if (loading) return <div className="flex items-center justify-center h-full text-gray-400 text-sm">Завантаження...</div>
  if (!record) return <div className="flex items-center justify-center h-full text-gray-400 text-sm">Запис не знайдено</div>

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-40">
        <button onClick={() => navigate('/records')} className="text-blue-500"><ChevronLeft size={22} /></button>
        <h1 className="text-lg font-semibold text-gray-900">Редагувати запис</h1>
      </header>
      <RecordForm
        initialType={record.type}
        initialValues={{
          type: record.type,
          amount: String(record.amount),
          date: record.date,
          description: record.description ?? '',
          category_id: record.category_id ?? '',
          subcategory_id: record.subcategory_id ?? '',
          client_id: record.client_id ?? '',
          payment_method: record.payment_method,
          status: record.status,
          photos: record.photos ?? [],
          dimensions: (record.dimensions as any) ?? {},
          tag_ids: (record as any).tags ?? [],
        }}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/records')}
        submitLabel="Зберегти зміни"
      />
    </div>
  )
}
