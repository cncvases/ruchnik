import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Client } from '../types'

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('clients')
        .select('*')
        .order('name')
      if (err) throw err
      setClients(data ?? [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { clients, loading, error, refetch: fetch }
}

export async function createClient(payload: Partial<Client>) {
  const { data, error } = await supabase.from('clients').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateClient(id: string, payload: Partial<Client>) {
  const { data, error } = await supabase.from('clients').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteClient(id: string) {
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw error
}
