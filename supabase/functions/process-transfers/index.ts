// supabase/functions/process-transfers/index.ts
// 売上分配バッチ処理（Transfer実行）

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const transferApiKey = Deno.env.get('TRANSFER_API_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // API Key による認証（cronジョブ用）
  const apiKey = req.headers.get('x-api-key')

  if (apiKey !== transferApiKey) {
    // 管理者JWTでも可
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    // TODO: 管理者権限チェックを追加する場合はここに実装
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // 保留中のTransfer対象を取得
    // transfer_status = 'ready' かつ、作者のstripe_account_idがある注文
    const { data: pendingOrders, error: fetchError } = await supabase
      .from('orders')
      .select(`
        id,
        author_id,
        affiliate_user_id,
        author_amount,
        affiliate_amount,
        amount
      `)
      .eq('status', 'paid')
      .eq('transfer_status', 'ready')
      .limit(50)

    if (fetchError) throw fetchError

    const results = {
      processed: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const order of pendingOrders || []) {
      try {
        // 作者のStripeアカウントを取得
        const { data: authorProfile } = await supabase
          .from('profiles')
          .select('stripe_account_id, stripe_payouts_enabled')
          .eq('id', order.author_id)
          .single()

        // 作者のStripeアカウントがない or payouts_enabledでない場合はスキップ
        if (!authorProfile?.stripe_account_id || !authorProfile?.stripe_payouts_enabled) {
          console.log(`Skipping order ${order.id}: Author not ready for payouts`)
          results.skipped++

          // held状態に変更
          await supabase
            .from('orders')
            .update({ transfer_status: 'held' })
            .eq('id', order.id)

          continue
        }

        // アフィリエイターのチェック（存在する場合）
        let affiliateProfile = null
        if (order.affiliate_user_id && order.affiliate_amount > 0) {
          const { data: affProfile } = await supabase
            .from('profiles')
            .select('stripe_account_id, stripe_payouts_enabled')
            .eq('id', order.affiliate_user_id)
            .single()

          if (!affProfile?.stripe_account_id || !affProfile?.stripe_payouts_enabled) {
            console.log(`Skipping order ${order.id}: Affiliate not ready for payouts`)
            results.skipped++

            await supabase
              .from('orders')
              .update({ transfer_status: 'held' })
              .eq('id', order.id)

            continue
          }
          affiliateProfile = affProfile
        }

        // 作者へのTransfer
        if (order.author_amount > 0) {
          const authorTransfer = await stripe.transfers.create({
            amount: order.author_amount,
            currency: 'jpy',
            destination: authorProfile.stripe_account_id,
            metadata: {
              order_id: order.id,
              recipient_user_id: order.author_id,
              recipient_type: 'author',
              platform: 'greymall',
            },
          }, {
            idempotencyKey: `transfer_${order.id}_author`,
          })

          console.log(`Author transfer created: ${authorTransfer.id}`)

          // author_transfer_id を保存
          await supabase
            .from('orders')
            .update({ author_transfer_id: authorTransfer.id })
            .eq('id', order.id)
        }

        // アフィリエイターへのTransfer
        if (affiliateProfile && order.affiliate_amount > 0) {
          const affiliateTransfer = await stripe.transfers.create({
            amount: order.affiliate_amount,
            currency: 'jpy',
            destination: affiliateProfile.stripe_account_id,
            metadata: {
              order_id: order.id,
              recipient_user_id: order.affiliate_user_id,
              recipient_type: 'affiliate',
              platform: 'greymall',
            },
          }, {
            idempotencyKey: `transfer_${order.id}_affiliate`,
          })

          console.log(`Affiliate transfer created: ${affiliateTransfer.id}`)

          // affiliate_transfer_id を保存
          await supabase
            .from('orders')
            .update({ affiliate_transfer_id: affiliateTransfer.id })
            .eq('id', order.id)
        }

        // ステータス更新
        await supabase
          .from('orders')
          .update({ transfer_status: 'completed' })
          .eq('id', order.id)

        results.processed++
        console.log(`Order ${order.id} transfers completed`)

      } catch (err) {
        results.failed++
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        results.errors.push(`Order ${order.id}: ${errorMessage}`)
        console.error(`Error processing order ${order.id}:`, errorMessage)

        // Transfer失敗をマーク
        await supabase
          .from('orders')
          .update({ transfer_status: 'failed' })
          .eq('id', order.id)
      }
    }

    console.log('Transfer batch completed:', results)

    return new Response(
      JSON.stringify(results),
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
