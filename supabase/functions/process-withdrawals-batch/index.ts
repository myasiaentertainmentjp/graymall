// supabase/functions/process-withdrawals-batch/index.ts
// 月末バッチ処理: queuedの出金申請をまとめて処理

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const batchApiKey = Deno.env.get('BATCH_API_KEY') || Deno.env.get('TRANSFER_API_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // API Key認証（cronジョブ用）
  const apiKey = req.headers.get('x-api-key')
  if (apiKey !== batchApiKey) {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    // 管理者JWT認証も可能（TODO: 管理者権限チェック）
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // パラメータ取得（特定の年月を指定可能）
  let targetYear: number | null = null
  let targetMonth: number | null = null

  try {
    const body = await req.json().catch(() => ({}))
    targetYear = body.year || null
    targetMonth = body.month || null
  } catch {
    // パラメータなしでもOK
  }

  const results = {
    processed: 0,
    failed: 0,
    skipped: 0,
    total_amount: 0,
    errors: [] as string[],
    details: [] as Array<{
      request_id: string
      user_id: string
      amount: number
      status: 'success' | 'failed' | 'skipped'
      transfer_id?: string
      error?: string
    }>,
  }

  try {
    // queued状態の出金申請を取得
    let query = supabase
      .from('withdraw_requests')
      .select(`
        id,
        user_id,
        amount_jpy,
        requested_at,
        profiles!inner(stripe_account_id, stripe_payouts_enabled)
      `)
      .eq('status', 'queued')
      .order('requested_at', { ascending: true })
      .limit(100) // バッチサイズ制限

    if (targetYear) {
      query = query.eq('target_year', targetYear)
    }
    if (targetMonth) {
      query = query.eq('target_month', targetMonth)
    }

    const { data: pendingRequests, error: fetchError } = await query

    if (fetchError) {
      throw fetchError
    }

    if (!pendingRequests || pendingRequests.length === 0) {
      console.log('No pending withdrawal requests')
      return new Response(
        JSON.stringify({ message: 'No pending requests', ...results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${pendingRequests.length} withdrawal requests`)

    for (const request of pendingRequests) {
      const profile = (request as any).profiles
      const stripeAccountId = profile?.stripe_account_id
      const payoutsEnabled = profile?.stripe_payouts_enabled

      const detail: typeof results.details[0] = {
        request_id: request.id,
        user_id: request.user_id,
        amount: request.amount_jpy,
        status: 'skipped',
      }

      try {
        // Stripeアカウントチェック
        if (!stripeAccountId) {
          detail.status = 'skipped'
          detail.error = 'No Stripe account'
          results.skipped++
          results.details.push(detail)

          await supabase
            .from('withdraw_requests')
            .update({
              status: 'failed',
              failure_reason: 'No Stripe account configured',
              updated_at: new Date().toISOString(),
            })
            .eq('id', request.id)

          continue
        }

        // payouts_enabled再確認
        if (!payoutsEnabled) {
          // Stripe APIで最新状態を確認
          const account = await stripe.accounts.retrieve(stripeAccountId)
          if (!account.payouts_enabled) {
            detail.status = 'skipped'
            detail.error = 'Payouts not enabled'
            results.skipped++
            results.details.push(detail)

            await supabase
              .from('withdraw_requests')
              .update({
                status: 'failed',
                failure_reason: 'Payouts not enabled - KYC/Bank incomplete',
                updated_at: new Date().toISOString(),
              })
              .eq('id', request.id)

            continue
          }
        }

        // processing状態に更新
        await supabase
          .from('withdraw_requests')
          .update({
            status: 'processing',
            processing_started_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', request.id)

        // Stripe Transfer実行
        const transfer = await stripe.transfers.create({
          amount: request.amount_jpy,
          currency: 'jpy',
          destination: stripeAccountId,
          metadata: {
            withdrawal_request_id: request.id,
            user_id: request.user_id,
            platform: 'greymall',
            type: 'withdrawal',
          },
        }, {
          idempotencyKey: `withdrawal_${request.id}`,
        })

        // 成功
        await supabase
          .from('withdraw_requests')
          .update({
            status: 'paid',
            stripe_transfer_id: transfer.id,
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', request.id)

        // 対象の注文をマーク（どの注文がこの出金で処理されたか記録）
        // 注: 実際の紐付けはより複雑なロジックが必要かもしれない
        // ここでは簡易的にユーザーの未出金注文をマーク

        detail.status = 'success'
        detail.transfer_id = transfer.id
        results.processed++
        results.total_amount += request.amount_jpy
        results.details.push(detail)

        console.log(`Transfer successful: ${transfer.id} for request ${request.id}`)

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        detail.status = 'failed'
        detail.error = errorMessage
        results.failed++
        results.errors.push(`Request ${request.id}: ${errorMessage}`)
        results.details.push(detail)

        // 失敗を記録
        await supabase
          .from('withdraw_requests')
          .update({
            status: 'failed',
            failure_reason: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', request.id)

        console.error(`Transfer failed for request ${request.id}:`, errorMessage)
      }
    }

    console.log('Batch completed:', results)

    return new Response(
      JSON.stringify({
        message: 'Batch processing completed',
        ...results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Batch error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal error',
        ...results,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
