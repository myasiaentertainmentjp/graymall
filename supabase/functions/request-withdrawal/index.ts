// supabase/functions/request-withdrawal/index.ts
// 出金申請を作成

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MINIMUM_WITHDRAWAL = 3000

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

    const { amount } = await req.json()

    if (!amount || typeof amount !== 'number') {
      return new Response(
        JSON.stringify({ error: 'amount is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. 最低出金額チェック
    if (amount < MINIMUM_WITHDRAWAL) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'minimum_amount',
          message: `最低出金額は${MINIMUM_WITHDRAWAL.toLocaleString()}円です`,
          minimum: MINIMUM_WITHDRAWAL,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. プロフィール取得（KYC/口座状態）
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_payouts_enabled, stripe_charges_enabled')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ success: false, error: 'profile_not_found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Stripe アカウント存在チェック
    if (!profile.stripe_account_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'no_stripe_account',
          message: 'Stripe口座の設定が必要です',
          action: 'setup_account',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Stripe APIで最新のアカウント状態を確認
    let stripeAccount: Stripe.Account
    try {
      stripeAccount = await stripe.accounts.retrieve(profile.stripe_account_id)
    } catch (e) {
      console.error('Stripe account retrieve error:', e)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'stripe_account_error',
          message: 'Stripeアカウントの確認に失敗しました',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. payouts_enabled チェック
    if (!stripeAccount.payouts_enabled) {
      // 未完了の要件を取得
      const requirements = stripeAccount.requirements?.currently_due || []
      const pastDue = stripeAccount.requirements?.past_due || []

      return new Response(
        JSON.stringify({
          success: false,
          error: 'payouts_not_enabled',
          message: '本人確認と口座登録を完了してください',
          action: 'complete_onboarding',
          details: {
            currently_due: requirements,
            past_due: pastDue,
            details_submitted: stripeAccount.details_submitted,
          },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. 残高チェック
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

    const withdrawableAmount = Math.max(0, authorAmount + affiliateAmount - pendingAmount)

    if (amount > withdrawableAmount) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'insufficient_balance',
          message: '出金可能額を超えています',
          withdrawable: withdrawableAmount,
          requested: amount,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 7. 出金申請作成
    const now = new Date()
    const { data: request, error: insertError } = await supabase
      .from('withdraw_requests')
      .insert({
        user_id: user.id,
        amount_jpy: amount,
        status: 'queued', // KYC/口座OK確認済みなので即queued
        requested_at: now.toISOString(),
        queued_at: now.toISOString(),
        target_year: now.getFullYear(),
        target_month: now.getMonth() + 1,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ success: false, error: 'insert_failed', message: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Withdrawal request created: ${request.id} for user ${user.id}, amount: ${amount}`)

    // 8. profilesのstripe状態を更新（最新に同期）
    await supabase
      .from('profiles')
      .update({
        stripe_payouts_enabled: stripeAccount.payouts_enabled,
        stripe_charges_enabled: stripeAccount.charges_enabled,
        updated_at: now.toISOString(),
      })
      .eq('id', user.id)

    return new Response(
      JSON.stringify({
        success: true,
        request_id: request.id,
        amount: amount,
        status: 'queued',
        message: '出金申請を受け付けました。月末に振り込まれます。',
        estimated_payout: getEndOfMonth(now),
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

function getEndOfMonth(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth()
  const lastDay = new Date(year, month + 1, 0)
  return lastDay.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
}
