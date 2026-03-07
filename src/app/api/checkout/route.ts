import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { z } from 'zod'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// 入力バリデーションスキーマ
const checkoutSchema = z.object({
  articleId: z.string().uuid('Invalid article ID format'),
  articleSlug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
  affiliateCode: z.string().max(50).optional().nullable(),
})

// サービスロールでSupabaseクライアントを作成
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // レートリミットチェック（IP + User-Agent ベース）
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const rateLimitResult = checkRateLimit(`checkout:${ip}`, RATE_LIMITS.checkout)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
          },
        }
      )
    }

    // cookieからユーザーセッションを取得
    const { createClient: createServerClient } = await import('@/lib/supabase/server')
    const supabase = await createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // 入力バリデーション
    const parseResult = checkoutSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const { articleId, articleSlug, affiliateCode } = parseResult.data

    // 記事情報を取得
    const { data: article, error: articleError } = await supabaseAdmin
      .from('articles')
      .select('id, title, price, author_id, affiliate_enabled, affiliate_rate')
      .eq('id', articleId)
      .single()

    if (articleError || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    const price = article.price as number
    const authorId = article.author_id as string
    const title = article.title as string
    const affiliateEnabled = article.affiliate_enabled as boolean
    const articleAffiliateRate = article.affiliate_rate as number | null

    if (price <= 0) {
      return NextResponse.json({ error: 'This article is free' }, { status: 400 })
    }

    // 既に購入済みか確認
    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('buyer_id', user.id)
      .eq('article_id', articleId)
      .eq('status', 'paid')
      .maybeSingle()

    if (existingOrder) {
      return NextResponse.json({ error: 'Already purchased' }, { status: 400 })
    }

    // アフィリエイトユーザーを確認
    let affiliateUserId: string | null = null
    if (affiliateCode && affiliateEnabled) {
      const { data: affiliateUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('affiliate_code', affiliateCode)
        .maybeSingle()

      if (affiliateUser && affiliateUser.id !== user.id && affiliateUser.id !== authorId) {
        affiliateUserId = affiliateUser.id as string
      }
    }

    // 注文を作成
    const affiliateRate = affiliateEnabled ? (articleAffiliateRate || 0) : 0
    const platformFeeRate = 0.10
    const platformFee = Math.floor(price * platformFeeRate)
    const affiliateAmount = affiliateUserId ? Math.floor(price * (affiliateRate / 100)) : 0
    const authorAmount = price - platformFee - affiliateAmount

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        buyer_id: user.id,
        article_id: articleId,
        author_id: authorId,
        affiliate_user_id: affiliateUserId,
        amount: price,
        status: 'pending',
        payment_provider: 'stripe',
        purchase_affiliate_rate: affiliateRate,
        platform_fee: platformFee,
        author_amount: authorAmount,
        affiliate_amount: affiliateAmount,
      })
      .select('id')
      .single()

    if (orderError || !order) {
      console.error('Failed to create order:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Stripe Checkout セッション作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: title,
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/articles/${articleSlug}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/articles/${articleSlug}?canceled=true`,
      metadata: {
        order_id: order.id as string,
        article_id: articleId,
        buyer_id: user.id,
      },
    })

    // 注文にセッションIDを保存
    await supabaseAdmin
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
