import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { CatalogItem } from '../types'

export function useCatalog() {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await supabase.from('catalog_items').select('*').order('sort_order').order('created_at')
      setItems(data ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { items, loading, refetch: fetch }
}

export async function createCatalogItem(payload: Partial<CatalogItem>) {
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.user_metadata?.user_db_id
  const { data, error } = await supabase.from('catalog_items').insert({ ...payload, user_id: userId }).select().single()
  if (error) throw error
  return data
}

export async function updateCatalogItem(id: string, payload: Partial<CatalogItem>) {
  const { error } = await supabase.from('catalog_items').update(payload).eq('id', id)
  if (error) throw error
}

export async function deleteCatalogItem(id: string) {
  const { error } = await supabase.from('catalog_items').delete().eq('id', id)
  if (error) throw error
}
