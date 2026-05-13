import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function signInWithTelegram(initData: string) {
  const { data, error } = await supabase.functions.invoke('telegram-auth', {
    body: { initData },
  })
  if (error) throw error
  if (data?.access_token) {
    await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    })
  }
  return data
}
