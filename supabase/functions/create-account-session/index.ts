// supabase/functions/create-account-session/index.ts
// Stripe Connect Embedded Components用のAccount Sessionを作成

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
        // ビジネスプロファイルをプラットフォーム側で事前設定
        business_type: 'individual',
        business_profile: {
          // プラットフォームURLを設定（ユーザーに入力させない）
          url: 'https://greymall.jp',
          // 商品説明もデフォルト設定
          product_description: 'デジタルコンテンツ（記事）の販売',
          mcc: '5818', // Digital goods - documents
        },
        settings: {
          payouts: {
            schedule: {
              interval: 'manual', // 手動payout（月末バッチ）
            },
          },
        },
        metadata: {
          user_id: user.id,
          platform: 'greymall',
        },
      })

      stripeAccountId = account.id

      // DBに保存
      await supabase
        .from('profiles')
        .update({
          stripe_account_id: stripeAccountId,
          stripe_account_status: 'onboarding',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
    }

    // Account Sessionを作成（Embedded Components用）
    const accountSession = await stripe.accountSessions.create({
      account: stripeAccountId,
      components: {
        // オンボーディングコンポーネント（本人確認・口座登録）
        account_onboarding: {
          enabled: true,
          features: {
            // 外部アカウントコレクション（銀行口座）を有効化
            external_account_collection: true,
          },
        },
        // 口座管理コンポーネント（登録後の確認用）
        account_management: {
          enabled: true,
          features: {
            external_account_collection: true,
          },
        },
        // 支払い一覧
        payouts: {
          enabled: true,
          features: {
            instant_payouts: false, // 即時payoutは無効
            standard_payouts: true,
            edit_payout_schedule: false, // スケジュール編集は無効（プラットフォーム管理）
            external_account_collection: true,
          },
        },
        // 残高表示
        balances: {
          enabled: true,
          features: {
            instant_payouts: false,
            standard_payouts: true,
            edit_payout_schedule: false,
          },
        },
      },
    })

    // 現在のアカウント状態を取得
    const account = await stripe.accounts.retrieve(stripeAccountId)

    return new Response(
      JSON.stringify({
        client_secret: accountSession.client_secret,
        account_id: stripeAccountId,
        // アカウント状態
        details_submitted: account.details_submitted,
        payouts_enabled: account.payouts_enabled,
        charges_enabled: account.charges_enabled,
        requirements: {
          currently_due: account.requirements?.currently_due || [],
          eventually_due: account.requirements?.eventually_due || [],
          past_due: account.requirements?.past_due || [],
        },
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
