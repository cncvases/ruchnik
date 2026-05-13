import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Category, Subcategory, Tag, RecordType } from '../types'

export function useCategories(type?: RecordType) {
  const [categories, setCategories] = useState<(Category & { subcategories: Subcategory[] })[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('categories').select('*, subcategories(*)')
    if (type) q = q.eq('type', type)
    const { data } = await q.order('name')
    setCategories(data ?? [])
    setLoading(false)
  }, [type])

  useEffect(() => { fetch() }, [fetch])

  return { categories, loading, refetch: fetch }
}

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('tags').select('*').order('name')
    setTags(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { tags, loading, refetch: fetch }
}

// CRUD for categories
export async function createCategory(payload: Partial<Category>) {
  const { data, error } = await supabase.from('categories').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateCategory(id: string, payload: Partial<Category>) {
  const { data, error } = await supabase.from('categories').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

export async function createSubcategory(payload: Partial<Subcategory>) {
  const { data, error } = await supabase.from('subcategories').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function deleteSubcategory(id: string) {
  const { error } = await supabase.from('subcategories').delete().eq('id', id)
  if (error) throw error
}

export async function createTag(payload: Partial<Tag>) {
  const { data, error } = await supabase.from('tags').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function deleteTag(id: string) {
  const { error } = await supabase.from('tags').delete().eq('id', id)
  if (error) throw error
}
