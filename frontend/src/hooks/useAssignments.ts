import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface Assignment {
  id: string
  record_id: string
  worker_id: string
  amount_paid: number
  status: 'pending' | 'confirmed'
  confirmed_at: string | null
  created_at: string
  record: {
    title: string | null
    date: string
    photos: string[]
    dimensions: { width?: number; height?: number; thickness?: number } | null
  } | null
}

export function useAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('record_workers')
        .select('*, record:records(title, date, photos, dimensions)')
        .order('created_at', { ascending: false })
      setAssignments((data ?? []) as Assignment[])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { assignments, loading, refetch: fetch }
}

export async function confirmAssignment(id: string) {
  const { error } = await supabase
    .from('record_workers')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function rejectAssignment(id: string) {
  const { error } = await supabase
    .from('record_workers')
    .delete()
    .eq('id', id)
  if (error) throw error
}
