// supabase/functions/get-balance/index.ts
// ユーザーの出金可能額を取得

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
    // 認証
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

    // 残高取得（DB関数を使用）
    const { data: balanceData, error: balanceError } = await supabase
      .rpc('get_withdrawable_balance', { p_user_id: user.id })

    if (balanceError) {
      // DB関数がない場合のフォールバック
      console.log('Falling back to direct query')

      // 著者としての未出金額
      const { data: authorOrders } = await supabase
        .from('orders')
        .select('author_amount')
        .eq('author_id', user.id)
        .eq('status', 'paid')
        .is('withdrawal_id', null)

      const authorAmount = authorOrders?.reduce((sum, o) => sum + (o.author_amount || 0), 0) || 0

      // アフィリエイトとしての未出金額
      const { data: affOrders } = await supabase
        .from('orders')
        .select('affiliate_amount')
        .eq('affiliate_user_id', user.id)
        .eq('status', 'paid')
        .gt('affiliate_amount', 0)
        .is('withdrawal_id', null)

      const affiliateAmount = affOrders?.reduce((sum, o) => sum + (o.affiliate_amount || 0), 0) || 0

      // 申請中の出金額
      const { data: pendingWithdrawals } = await supabase
        .from('withdraw_requests')
        .select('amount_jpy')
        .eq('user_id', user.id)
        .in('status', ['requested', 'queued', 'processing'])

      const pendingAmount = pendingWithdrawals?.reduce((sum, w) => sum + w.amount_jpy, 0) || 0

      return new Response(
        JSON.stringify({
          author_amount: authorAmount,
          affiliate_amount: affiliateAmount,
          total_amount: authorAmount + affiliateAmount,
          pending_withdrawal_amount: pendingAmount,
          withdrawable_amount: Math.max(0, authorAmount + affiliateAmount - pendingAmount),
          minimum_withdrawal: 3000,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const balance = balanceData?.[0] || {
      author_amount: 0,
      affiliate_amount: 0,
      total_amount: 0,
      pending_withdrawal_amount: 0,
      withdrawable_amount: 0,
    }

    return new Response(
      JSON.stringify({
        ...balance,
        minimum_withdrawal: 3000,
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
