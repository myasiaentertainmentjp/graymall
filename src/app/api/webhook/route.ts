import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// サービスロールキーを使用してSupabaseクライアントを作成
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // イベントの重複処理を防ぐ
  const { data: existingEvent } = await supabaseAdmin
    .from('stripe_webhook_events')
    .select('id')
    .eq('event_id', event.id)
    .maybeSingle()

  if (existingEvent) {
    return NextResponse.json({ received: true, message: 'Event already processed' })
  }

  // イベントを記録
  await supabaseAdmin
    .from('stripe_webhook_events')
    .insert({
      event_id: event.id,
      event_type: event.type,
      payload: JSON.parse(JSON.stringify(event.data.object)),
    })

  // イベント処理
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.payment_status === 'paid') {
        const orderId = session.metadata?.order_id

        if (orderId) {
          // 注文を更新
          const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
              stripe_payment_intent_id: session.payment_intent as string,
              processed_event_id: event.id,
              transfer_status: 'ready',
            })
            .eq('id', orderId)

          if (updateError) {
            console.error('Failed to update order:', updateError)
          } else {
            // 購入完了通知を送信
            const { data: order } = await supabaseAdmin
              .from('orders')
              .select('buyer_id, article_id, author_id, amount, articles(title)')
              .eq('id', orderId)
              .single()

            if (order) {
              // 記事タイトルを取得
              const articlesData = order.articles as { title: string } | { title: string }[] | null
              const articleTitle = Array.isArray(articlesData)
                ? articlesData[0]?.title || '記事'
                : articlesData?.title || '記事'
              const amount = order.amount as number

              // 購入者に通知
              await supabaseAdmin.from('notifications').insert({
                user_id: order.buyer_id,
                type: 'purchase_complete',
                title: '購入完了',
                message: `「${articleTitle}」の購入が完了しました`,
                metadata: { order_id: orderId, article_id: order.article_id },
              })

              // 著者に通知
              await supabaseAdmin.from('notifications').insert({
                user_id: order.author_id,
                type: 'article_purchased',
                title: '記事が購入されました',
                message: `「${articleTitle}」が購入されました（¥${amount.toLocaleString()}）`,
                metadata: { order_id: orderId, article_id: order.article_id },
              })
            }
          }
        }
      }
      break
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge

      // 返金処理
      const { data: orders } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('stripe_payment_intent_id', charge.payment_intent)

      if (orders && orders.length > 0) {
        for (const order of orders) {
          await supabaseAdmin
            .from('orders')
            .update({
              status: 'refunded',
              refunded_at: new Date().toISOString(),
            })
            .eq('id', order.id)
        }
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
