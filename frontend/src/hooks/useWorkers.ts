import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Worker } from '../types'

export function useWorkers() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await supabase.from('workers').select('*').order('name')
      setWorkers(data ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { workers, loading, refetch: fetch }
}

export async function createWorker(payload: Partial<Worker>) {
  const { data, error } = await supabase.from('workers').insert(payload).select().single()
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
