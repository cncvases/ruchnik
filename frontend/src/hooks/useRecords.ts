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
        .select(`*, client:clients(id,name,phone,telegram_username), category:categories(id,name,color), subcategory:subcategories(id,name), tags:record_tags(tag:tags(id,name,color))`)
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
        record_workers: [],
      }))

      // load record_workers separately — safe if table doesn't exist yet
      if (rows.length) {
        const ids = rows.map((r: any) => r.id)
        const { data: rw } = await supabase
          .from('record_workers')
          .select('id,record_id,worker_id,amount_paid,status,worker:workers(id,name)')
          .in('record_id', ids)
        if (rw) {
          const byRecord: { [key: string]: any[] } = {}
          rw.forEach((x: any) => { (byRecord[x.record_id] ??= []).push(x) })
          rows.forEach((r: any) => { r.record_workers = byRecord[r.id] ?? [] })
        }
      }

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

async function resolveWorkerIds(assignments: { worker_id: string, amount: number }[]) {
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.user_metadata?.user_db_id

  const resolved = await Promise.all(assignments.map(async wa => {
    if (!wa.worker_id.startsWith('contact:')) return wa

    const contactId = wa.worker_id.replace('contact:', '')

    // Check if worker already exists for this contact
    const { data: existing } = await supabase
      .from('workers')
      .select('id')
      .eq('user_id', userId)
      .eq('notes', `contact:${contactId}`)
      .single()

    if (existing) return { ...wa, worker_id: existing.id }

    // Get contact info and create worker
    const { data: contact } = await supabase
      .from('contacts')
      .select('name, phone, linked_user_id')
      .eq('id', contactId)
      .single()

    const { data: newWorker } = await supabase
      .from('workers')
      .insert({
        user_id: userId,
        name: contact?.name ?? 'Працівник',
        phone: contact?.phone ?? null,
        worker_user_id: contact?.linked_user_id ?? null,
        notes: `contact:${contactId}`,
      })
      .select()
      .single()

    return { ...wa, worker_id: newWorker?.id ?? wa.worker_id }
  }))

  return resolved
}

export async function createRecord(payload: Partial<Record> & { tag_ids?: string[], worker_assignments?: { worker_id: string, amount: number }[] }) {
  const { tag_ids, worker_assignments, ...record } = payload
  const { data, error } = await supabase.from('records').insert(record).select().single()
  if (error) throw error
  if (tag_ids?.length) {
    await supabase.from('record_tags').insert(tag_ids.map(tag_id => ({ record_id: data.id, tag_id })))
  }
  if (worker_assignments?.length) {
    const resolved = await resolveWorkerIds(worker_assignments)
    await supabase.from('record_workers').insert(
      resolved.map(wa => ({ record_id: data.id, worker_id: wa.worker_id, amount_paid: wa.amount }))
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
    const { data: existing } = await supabase
      .from('record_workers')
      .select('id, worker_id, amount_paid')
      .eq('record_id', id)
      .eq('status', 'pending')

    const existingMap = new Map((existing ?? []).map((e: any) => [e.worker_id, e]))
    const newMap = new Map(worker_assignments.map(wa => [wa.worker_id, wa]))

    const toDelete = (existing ?? []).filter((e: any) => !newMap.has(e.worker_id)).map((e: any) => e.id)
    if (toDelete.length) {
      await supabase.from('record_workers').delete().in('id', toDelete)
    }

    for (const wa of worker_assignments) {
      const old = existingMap.get(wa.worker_id) as any
      if (old && Number(old.amount_paid) !== wa.amount) {
        await supabase.from('record_workers').update({ amount_paid: wa.amount }).eq('id', old.id)
      }
    }

    const toInsert = worker_assignments.filter(wa => !existingMap.has(wa.worker_id))
    if (toInsert.length) {
      const resolved = await resolveWorkerIds(toInsert)
      await supabase.from('record_workers').insert(
        resolved.map(wa => ({ record_id: id, worker_id: wa.worker_id, amount_paid: wa.amount }))
      )
    }
  }
  return data
}

export async function deleteRecord(id: string) {
  const { error } = await supabase.from('records').delete().eq('id', id)
  if (error) throw error
}
