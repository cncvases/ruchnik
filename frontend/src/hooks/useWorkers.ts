import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Worker } from '../types'

export function useWorkers() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data }, { data: contactData }] = await Promise.all([
        supabase.from('workers').select('*').order('name'),
        supabase.from('contacts').select('id,name,phone,notes,linked_user_id').eq('is_worker', true).eq('status', 'accepted').order('name'),
      ])
      const fromContacts = (contactData ?? []).map((c: any) => ({
        id: `contact:${c.id}`, user_id: '', name: c.name, phone: c.phone, role: null,
        notes: c.notes, telegram_username: null,
        worker_user_id: c.linked_user_id, created_at: '', _from_contacts: true,
      }))
      setWorkers([...(data ?? []), ...fromContacts])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { workers, loading, refetch: fetch }
}

export async function createWorker(payload: Partial<Worker>) {
  const { data: { user } } = await supabase.auth.getUser()
  // user_id comes from user_metadata set during telegram-auth
  const userId = user?.user_metadata?.user_db_id
  const { data, error } = await supabase.from('workers').insert({ ...payload, user_id: userId }).select().single()
  if (error) throw error
  return data
}

export async function updateWorker(id: string, payload: Partial<Worker>) {
  const { data, error } = await supabase.from('workers').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteWorker(id: string) {
  const { error } = await supabase.from('workers').delete().eq('id', id)
  if (error) throw error
}
