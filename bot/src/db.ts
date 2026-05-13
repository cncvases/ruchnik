import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getClientRecords(clientId: string, userId: string) {
  const { data } = await supabase
    .from('records')
    .select('*, category:categories(name), subcategory:subcategories(name)')
    .eq('client_id', clientId)
    .eq('user_id', userId)
    .eq('type', 'income')
    .order('date', { ascending: false })
  return data ?? []
}
