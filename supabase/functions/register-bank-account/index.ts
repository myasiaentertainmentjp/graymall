// supabase/functions/register-bank-account/index.ts
// 口座情報をStripe Connect アカウントに登録

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

    const {
      account_type,
      bank_code,
      branch_code,
      account_number,
      account_holder_name,
    } = await req.json()

    // バリデーション
    if (!bank_code || !branch_code || !account_number || !account_holder_name) {
      return new Response(
        JSON.stringify({ success: false, error: '必須項目が不足しています' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (branch_code.length !== 3) {
      return new Response(
        JSON.stringify({ success: false, error: '支店コードは3桁で入力してください' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (account_number.length !== 7) {
      return new Response(
        JSON.stringify({ success: false, error: '口座番号は7桁で入力してください' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // プロフィール取得
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single()

    let stripeAccountId = profile?.stripe_account_id

    // Stripeアカウントがなければ作成
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'JP',
        email: user.email,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: account_type === 'company' ? 'company' : 'individual',
        business_profile: {
          url: 'https://greymall.jp',
          product_description: 'デジタルコンテンツ（記事）の販売',
          mcc: '5818',
        },
        settings: {
          payouts: {
            schedule: { interval: 'manual' },
          },
        },
        metadata: {
          user_id: user.id,
          platform: 'greymall',
        },
      })

      stripeAccountId = account.id

      await supabase
        .from('profiles')
        .update({
          stripe_account_id: stripeAccountId,
          stripe_account_status: 'onboarding',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
    }

    // routing_number = 銀行コード(4桁) + 支店コード(3桁)
    const routingNumber = bank_code + branch_code

    // 既存の外部口座を削除（上書き）
    const existingAccounts = await stripe.accounts.listExternalAccounts(
      stripeAccountId,
      { object: 'bank_account', limit: 10 }
    )

    for (const account of existingAccounts.data) {
      await stripe.accounts.deleteExternalAccount(stripeAccountId, account.id)
    }

    // 新しい口座を登録
    const bankAccount = await stripe.accounts.createExternalAccount(
      stripeAccountId,
      {
        external_account: {
          object: 'bank_account',
          country: 'JP',
          currency: 'jpy',
          routing_number: routingNumber,
          account_number: account_number,
          account_holder_name: account_holder_name,
          account_holder_type: account_type === 'company' ? 'company' : 'individual',
        },
      }
    )

    // DBに口座情報を保存
    await supabase
      .from('profiles')
      .update({
        bank_account_registered: true,
        bank_account_last4: account_number.slice(-4),
        bank_name: bank_code, // 後で銀行名に変換可能
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    console.log(`Bank account registered for user ${user.id}: ${bankAccount.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: '口座登録が完了しました',
        bank_account_id: bankAccount.id,
        last4: bankAccount.last4,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)

    // Stripeエラーの詳細を返す
    if (error instanceof Stripe.errors.StripeError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          code: error.code,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
