// supabase/functions/cancel-withdrawal/index.ts
// 出金申請をキャンセル（queuedの間のみ可能）

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { request_id } = await req.json()

    if (!request_id) {
      return new Response(
        JSON.stringify({ error: 'request_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 申請を取得
    const { data: request, error: fetchError } = await supabase
      .from('withdraw_requests')
      .select('id, user_id, status, amount_jpy')
      .eq('id', request_id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !request) {
      return new Response(
        JSON.stringify({ success: false, error: 'not_found', message: '出金申請が見つかりません' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // queuedのみキャンセル可能
    if (request.status !== 'queued') {
      const statusMessages: Record<string, string> = {
        requested: '申請処理中のためキャンセルできません',
        processing: '振込処理中のためキャンセルできません',
        paid: '既に振込済みのためキャンセルできません',
        failed: '失敗した申請です',
        canceled: '既にキャンセル済みです',
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: 'cannot_cancel',
          message: statusMessages[request.status] || 'キャンセルできません',
          current_status: request.status,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // キャンセル実行
    const { error: updateError } = await supabase
      .from('withdraw_requests')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', request_id)

    if (updateError) {
      throw updateError
    }

    console.log(`Withdrawal request ${request_id} canceled by user ${user.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: '出金申請をキャンセルしました',
        refunded_amount: request.amount_jpy,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
