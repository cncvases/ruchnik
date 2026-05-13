import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function verifyTelegramInitData(initData: string, botToken: string): Record<string, string> | null {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return null
  params.delete('hash')

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const expectedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

  if (expectedHash !== hash) return null

  const result: Record<string, string> = {}
  params.forEach((v, k) => { result[k] = v })
  return result
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { initData } = await req.json()
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')!

    const data = verifyTelegramInitData(initData, botToken)
    if (!data) {
      return new Response(JSON.stringify({ error: 'Invalid initData' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const tgUser = JSON.parse(data.user)
    const telegramId = tgUser.id
    const name = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Upsert user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({ telegram_id: telegramId, name }, { onConflict: 'telegram_id' })
      .select()
      .single()

    if (userError) throw userError

    // Sign a JWT for this user
    const { data: session, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: `tg${telegramId}@ruchnik.app`,
      options: { data: { telegram_id: telegramId, user_db_id: user.id } },
    })

    if (sessionError) throw sessionError

    return new Response(
      JSON.stringify({ user, token_hash: session.properties?.hashed_token }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
