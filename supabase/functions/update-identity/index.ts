// supabase/functions/update-identity/index.ts
// 本人確認情報をStripe Connect アカウントに登録

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
      first_name,
      last_name,
      first_name_kana,
      last_name_kana,
      dob_year,
      dob_month,
      dob_day,
      postal_code,
      prefecture,
      city,
      line1,
      line2,
      phone,
    } = await req.json()

    // バリデーション
    if (!first_name || !last_name || !dob_year || !dob_month || !dob_day ||
        !postal_code || !prefecture || !city || !line1 || !phone) {
      return new Response(
        JSON.stringify({ success: false, error: '必須項目が不足しています' }),
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
        business_type: 'individual',
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

    // 住所を日本語 → ローマ字変換（簡易版）
    // 実際のプロダクションでは変換APIを使うか、ユーザーにローマ字入力させる
    const addressKanji = `${prefecture}${city}${line1}${line2 || ''}`

    // Stripe Connect アカウントの個人情報を更新
    await stripe.accounts.update(stripeAccountId, {
      individual: {
        first_name: first_name,
        last_name: last_name,
        first_name_kana: first_name_kana,
        last_name_kana: last_name_kana,
        // ローマ字（Stripeで必須の場合に備えて）
        first_name_kanji: first_name,
        last_name_kanji: last_name,
        dob: {
          year: dob_year,
          month: dob_month,
          day: dob_day,
        },
        address_kanji: {
          postal_code: postal_code,
          state: prefecture,
          city: city,
          town: '',
          line1: line1,
          line2: line2 || '',
        },
        address_kana: {
          postal_code: postal_code,
          state: prefecture,
          city: city,
          town: '',
          line1: line1,
          line2: line2 || '',
        },
        phone: '+81' + phone.replace(/^0/, ''),
        email: user.email,
      },
    })

    // アカウント状態を再取得
    const updatedAccount = await stripe.accounts.retrieve(stripeAccountId)

    // DBを更新
    await supabase
      .from('profiles')
      .update({
        kyc_submitted: true,
        stripe_payouts_enabled: updatedAccount.payouts_enabled,
        stripe_charges_enabled: updatedAccount.charges_enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    console.log(`Identity updated for user ${user.id}, payouts_enabled: ${updatedAccount.payouts_enabled}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: '本人情報を登録しました',
        payouts_enabled: updatedAccount.payouts_enabled,
        requirements: updatedAccount.requirements?.currently_due || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)

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