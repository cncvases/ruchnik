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
    user_id: string
  } | null
}

export function useAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const myUserId = user?.user_metadata?.user_db_id

      const { data, error } = await supabase.rpc('get_pending_assignments')
      console.log('assignments data:', data, 'error:', error)
      if (error) {
        console.error('get_pending_assignments error:', error)
        setAssignments([])
        return
      }

      const mapped: Assignment[] = (data ?? []).map((row: any) => ({
        id: row.id,
        record_id: row.record_id,
        worker_id: row.worker_id,
        amount_paid: row.amount_paid,
        status: row.status,
        confirmed_at: row.confirmed_at,
        created_at: row.created_at,
        record: row.record_id ? {
          title: row.record_title,
          date: row.record_date,
          photos: row.record_photos ?? [],
          dimensions: row.record_dimensions,
          user_id: row.record_user_id,
        } : null,
      }))

      // Hide assignments on own records
      const filtered = mapped.filter(a => a.record?.user_id !== myUserId)
      setAssignments(filtered)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { assignments, loading, refetch: fetch }
}

export async function confirmAssignment(id: string) {
  const { error } = await supabase.rpc('confirm_assignment', { assignment_id: id })
  if (error) throw error
}

export async function rejectAssignment(id: string) {
  const { error } = await supabase.rpc('reject_assignment', { assignment_id: id })
  if (error) throw error
}
