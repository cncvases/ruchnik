import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Contact } from '../types'

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await supabase.from('contacts').select('*').order('name')
      setContacts(data ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { contacts, loading, refetch: fetch }
}

export async function updateContact(id: string, payload: Partial<Contact>) {
  const { error } = await supabase.from('contacts').update(payload).eq('id', id)
  if (error) throw error
}

export async function deleteContact(id: string) {
  const { error } = await supabase.from('contacts').delete().eq('id', id)
  if (error) throw error
}

export async function acceptInvite(code: string): Promise<{ inviterName: string }> {
  const { data: { user } } = await supabase.auth.getUser()
  const myUserId = user?.user_metadata?.user_db_id
  if (!myUserId) throw new Error('Не авторизований')

  // Find invite
  const { data: invite, error: inviteErr } = await supabase
    .from('invites')
    .select('*, creator:users!creator_user_id(id, name)')
    .eq('code', code.toUpperCase())
    .is('used_by_user_id', null)
    .single()

  if (inviteErr || !invite) throw new Error('Код не знайдено або вже використано')
  if (invite.creator_user_id === myUserId) throw new Error('Не можна використати власний код')

  const creator = (invite as any).creator
  const { data: myUser } = await supabase.from('users').select('name').eq('id', myUserId).single()

  // Mark invite as used
  await supabase.from('invites').update({ used_by_user_id: myUserId, used_at: new Date().toISOString() }).eq('id', invite.id)

  // Add mutual contacts
  await supabase.from('contacts').insert([
    { owner_user_id: invite.creator_user_id, linked_user_id: myUserId, name: myUser?.name ?? 'Невідомо' },
    { owner_user_id: myUserId, linked_user_id: invite.creator_user_id, name: creator?.name ?? 'Невідомо' },
  ])

  return { inviterName: creator?.name ?? 'Невідомо' }
}

export async function createInvite(): Promise<string> {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase()
  const { data: { user } } = await supabase.auth.getUser()
  const myUserId = user?.user_metadata?.user_db_id
  const { error } = await supabase.from('invites').insert({ code, creator_user_id: myUserId })
  if (error) throw error
  return code
}
