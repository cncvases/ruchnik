import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Record, RecordType } from '../types'

interface Filters {
  type?: RecordType
  clientId?: string
  categoryId?: string
  status?: string
  dateFrom?: string
  dateTo?: string
}

export function useRecords(filters: Filters = {}) {
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let q = supabase
        .from('records')
        .select(`*, client:clients(id,name,phone,telegram_username), category:categories(id,name,color), subcategory:subcategories(id,name), tags:record_tags(tag:tags(id,name,color)), record_workers:record_workers(id,worker_id,amount_paid,status,worker:workers(id,name))`)
        .order('date', { ascending: false })

      if (filters.type) q = q.eq('type', filters.type)
      if (filters.clientId) q = q.eq('client_id', filters.clientId)
      if (filters.categoryId) q = q.eq('category_id', filters.categoryId)
      if (filters.status) q = q.eq('status', filters.status)
      if (filters.dateFrom) q = q.gte('date', filters.dateFrom)
      if (filters.dateTo) q = q.lte('date', filters.dateTo)

      const { data, error: err } = await q
      if (err) throw err
      const rows = (data ?? []).map((r: any) => ({
        ...r,
        tags: r.tags?.map((rt: any) => rt.tag).filter(Boolean) ?? [],
      }))
      setRecords(rows)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filters)])

  useEffect(() => { fetch() }, [fetch])

  function updateLocalStatus(id: string, status: 'paid' | 'pending') {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  return { records, loading, error, refetch: fetch, updateLocalStatus }
}

export async function createRecord(payload: Partial<Record> & { tag_ids?: string[], worker_assignments?: { worker_id: string, amount: number }[] }) {
  const { tag_ids, worker_assignments, ...record } = payload
  const { data, error } = await supabase.from('records').insert(record).select().single()
  if (error) throw error
  if (tag_ids?.length) {
    await supabase.from('record_tags').insert(tag_ids.map(tag_id => ({ record_id: data.id, tag_id })))
  }
  if (worker_assignments?.length) {
    await supabase.from('record_workers').insert(
      worker_assignments.map(wa => ({ record_id: data.id, worker_id: wa.worker_id, amount_paid: wa.amount }))
    )
  }
  return data
}

export async function updateRecord(id: string, payload: Partial<Record> & { tag_ids?: string[], worker_assignments?: { worker_id: string, amount: number }[] }) {
  const { tag_ids, worker_assignments, ...record } = payload
  const { data, error } = await supabase.from('records').update(record).eq('id', id).select().single()
  if (error) throw error
  if (tag_ids !== undefined) {
    await supabase.from('record_tags').delete().eq('record_id', id)
    if (tag_ids.length) {
      await supabase.from('record_tags').insert(tag_ids.map(tag_id => ({ record_id: id, tag_id })))
    }
  }
  if (worker_assignments !== undefined) {
    await supabase.from('record_workers').delete().eq('record_id', id)
    if (worker_assignments.length) {
      await supabase.from('record_workers').insert(
        worker_assignments.map(wa => ({ record_id: id, worker_id: wa.worker_id, amount_paid: wa.amount }))
      )
    }
  }
  return data
}

export async function deleteRecord(id: string) {
  const { error } = await supabase.from('records').delete().eq('id', id)
  if (error) throw error
}
