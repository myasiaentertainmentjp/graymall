// supabase/functions/create-connect-account/index.ts
// Stripe Connect Express アカウント作成

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
    // JWT からユーザー取得
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

    // 既存の Stripe Account をチェック
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id, email, display_name')
      .eq('id', user.id)
      .single()

    if (profile?.stripe_account_id) {
      // 既存アカウントがあればそれを返す
      return new Response(
        JSON.stringify({
          account_id: profile.stripe_account_id,
          message: 'Account already exists',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Express アカウント作成（ビジネス情報を事前設定して入力を最小化）
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'JP',
      email: user.email,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: 'individual',
      // ビジネスプロファイルをプラットフォーム側で事前設定
      // これにより「WebサイトURL」「商品説明」の入力をユーザーに求めない
      business_profile: {
        url: 'https://greymall.jp',
        product_description: 'デジタルコンテンツ（記事・情報商材）の販売',
        mcc: '5818', // Digital goods - ebooks, software, etc.
      },
      settings: {
        payouts: {
          schedule: {
            interval: 'manual', // 手動payout（月末バッチ処理）
          },
        },
      },
      metadata: {
        user_id: user.id,
        platform: 'greymall',
      },
    })

    // profiles に保存
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        stripe_account_id: account.id,
        stripe_account_status: 'onboarding',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      // ロールバック: Stripeアカウントを削除
      await stripe.accounts.del(account.id)
      throw updateError
    }

    console.log(`Created Stripe account ${account.id} for user ${user.id}`)

    return new Response(
      JSON.stringify({
        account_id: account.id,
        message: 'Account created successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
