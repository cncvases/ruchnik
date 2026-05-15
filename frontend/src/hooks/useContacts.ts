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

// Contacts where I accepted or sent — accepted ones
export function useConnections() {
  const [accepted, setAccepted] = useState<Contact[]>([])
  const [incoming, setIncoming] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const myId = user?.user_metadata?.user_db_id

      // Contacts I own (sent by me or accepted mutual)
      const { data: mine } = await supabase
        .from('contacts')
        .select('*, linked:users!linked_user_id(id, name, telegram_id)')
        .eq('owner_user_id', myId)
        .not('linked_user_id', 'is', null)
        .order('name')

      // Incoming pending requests (someone added me, waiting my accept)
      const { data: inbox } = await supabase
        .from('contacts')
        .select('*, owner:users!owner_user_id(id, name, telegram_id)')
        .eq('linked_user_id', myId)
        .eq('status', 'pending')

      setAccepted((mine ?? []).filter((c: any) => c.status === 'accepted'))
      setIncoming(inbox ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { accepted, incoming, loading, refetch: fetch }
}

export async function updateContact(id: string, payload: Partial<Contact>) {
  const { error } = await supabase.from('contacts').update(payload).eq('id', id)
  if (error) throw error
}

export async function deleteContact(id: string) {
  const { error } = await supabase.from('contacts').delete().eq('id', id)
  if (error) throw error
}

export async function searchUsers(query: string) {
  if (!query.trim()) return []
  const { data: { user } } = await supabase.auth.getUser()
  const myId = user?.user_metadata?.user_db_id

  const q = query.trim().replace('@', '')
  const { data } = await supabase
    .from('users')
    .select('id, name, telegram_id')
    .or(`name.ilike.%${q}%`)
    .neq('id', myId)
    .limit(20)

  return data ?? []
}

export async function sendContactRequest(targetUserId: string, targetName: string) {
  const { data: { user } } = await supabase.auth.getUser()
  const myId = user?.user_metadata?.user_db_id
  // Check if already exists
  const { data: existing } = await supabase
    .from('contacts')
    .select('id')
    .eq('owner_user_id', myId)
    .eq('linked_user_id', targetUserId)
    .single()

  if (existing) throw new Error('Запит вже надісланий або контакт вже існує')

  // Create pending contact from me to them
  const { error } = await supabase.from('contacts').insert({
    owner_user_id: myId,
    linked_user_id: targetUserId,
    name: targetName,
    status: 'pending',
    initiated_by: myId,
  })
  if (error) throw error
}

export async function acceptContactRequest(contactId: string, requesterId: string, requesterName: string) {
  const { data: { user } } = await supabase.auth.getUser()
  const myId = user?.user_metadata?.user_db_id

  // Update their contact to accepted
  await supabase.from('contacts').update({ status: 'accepted' }).eq('id', contactId)

  // Create reverse contact (me → them) if not exists
  const { data: existing } = await supabase
    .from('contacts')
    .select('id')
    .eq('owner_user_id', myId)
    .eq('linked_user_id', requesterId)
    .single()

  if (!existing) {
    await supabase.from('contacts').insert({
      owner_user_id: myId,
      linked_user_id: requesterId,
      name: requesterName,
      status: 'accepted',
      initiated_by: requesterId,
    })
  } else {
    await supabase.from('contacts').update({ status: 'accepted' }).eq('id', (existing as any).id)
  }
}

export async function rejectContactRequest(contactId: string) {
  const { error } = await supabase.from('contacts').delete().eq('id', contactId)
  if (error) throw error
}

export async function acceptInvite(code: string): Promise<{ inviterName: string }> {
  const { data: { user } } = await supabase.auth.getUser()
  const myUserId = user?.user_metadata?.user_db_id
  if (!myUserId) throw new Error('Не авторизований')

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

  await supabase.from('invites').update({ used_by_user_id: myUserId, used_at: new Date().toISOString() }).eq('id', invite.id)

  await supabase.from('contacts').insert([
    { owner_user_id: invite.creator_user_id, linked_user_id: myUserId, name: myUser?.name ?? 'Невідомо', status: 'accepted' },
    { owner_user_id: myUserId, linked_user_id: invite.creator_user_id, name: creator?.name ?? 'Невідомо', status: 'accepted' },
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
