import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function verifyTelegramInitData(initData: string, botToken: string): Promise<Record<string, string> | null> {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return null
  params.delete('hash')

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')

  const encoder = new TextEncoder()
  const secretKey = await crypto.subtle.importKey(
    'raw', encoder.encode('WebAppData'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const secretKeyBytes = await crypto.subtle.sign('HMAC', secretKey, encoder.encode(botToken))

  const dataKey = await crypto.subtle.importKey(
    'raw', secretKeyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const signatureBytes = await crypto.subtle.sign('HMAC', dataKey, encoder.encode(dataCheckString))

  const expectedHash = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

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

    const data = await verifyTelegramInitData(initData, botToken)
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

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({ telegram_id: telegramId, name }, { onConflict: 'telegram_id' })
      .select()
      .single()

    if (userError) throw userError

    const email = `tg${telegramId}@ruchnik.app`
    const password = `tg-${telegramId}-${botToken.slice(0, 8)}`

    let authData
    const { data: signIn, error: signInError } = await supabaseAdmin.auth.signInWithPassword({ email, password })
    if (signInError) {
      const { error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { telegram_id: telegramId, user_db_id: user.id },
      })
      if (signUpError) throw signUpError

      const { data: signIn2, error: signIn2Error } = await supabaseAdmin.auth.signInWithPassword({ email, password })
      if (signIn2Error) throw signIn2Error
      authData = signIn2
    } else {
      authData = signIn
    }

    return new Response(
      JSON.stringify({
        user,
        access_token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
