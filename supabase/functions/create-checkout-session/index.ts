import Stripe from 'npm:stripe@14.14.0';
import { createClient } from 'npm:@supabase/supabase-js';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CheckoutRequest {
  type: 'subscription' | 'article';
  priceId?: string;
  articleId?: string;
  affiliateUserId?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body: CheckoutRequest = await req.json();
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 認証ユーザーの取得（任意）
    let user = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authUser } } = await supabase.auth.getUser(token);
      user = authUser;
    }

    const origin = req.headers.get('Origin') || req.headers.get('Referer') || '';
    const siteUrl = origin ? new URL(origin).origin : 'https://graymall.jp';

    // Subscription type - requires authentication
    if (body.type === 'subscription') {
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Authentication required for subscription' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: userProfile } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .maybeSingle();

      let customerId = userProfile?.stripe_customer_id;

      // Create customer if not exists
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { user_id: user.id },
        });
        customerId = customer.id;

        // Save customer ID
        await supabase
          .from('users')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id);
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer: customerId,
        line_items: [
          {
            price: body.priceId || 'price_1SkElqPsY7LQxSBLh4zxd8Zj',
            quantity: 1,
          },
        ],
        success_url: `${siteUrl}/subscription?success=true`,
        cancel_url: `${siteUrl}/subscription?cancelled=true`,
        metadata: {
          user_id: user.id,
        },
      });

      return new Response(
        JSON.stringify({ url: session.url }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Article purchase type - supports guest checkout
    if (body.type === 'article' && body.articleId) {
      const { data: article } = await supabase
        .from('articles')
        .select('id, title, price, author_id, slug, status')
        .eq('id', body.articleId)
        .maybeSingle();

      if (!article) {
        return new Response(
          JSON.stringify({ error: 'Article not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (article.status !== 'published') {
        return new Response(
          JSON.stringify({ error: 'Article not available' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if logged-in user is trying to buy their own article
      if (user && article.author_id === user.id) {
        return new Response(
          JSON.stringify({ error: 'Cannot purchase own article' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if logged-in user already purchased
      if (user) {
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id')
          .eq('buyer_id', user.id)
          .eq('article_id', body.articleId)
          .eq('status', 'paid')
          .maybeSingle();

        if (existingOrder) {
          return new Response(
            JSON.stringify({ error: 'Already purchased' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Create order (buyer_id is null for guest purchases)
      const { data: order } = await supabase
        .from('orders')
        .insert({
          buyer_id: user?.id || null,
          article_id: article.id,
          author_id: article.author_id,
          affiliate_user_id: body.affiliateUserId || null,
          amount: article.price,
          status: 'pending',
          payment_provider: 'stripe',
          is_guest: !user, // ゲスト購入フラグ
        })
        .select('id')
        .maybeSingle();

      if (!order) {
        return new Response(
          JSON.stringify({ error: 'Failed to create order' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Stripe Checkout session configuration
      const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'jpy',
              product_data: { name: article.title },
              unit_amount: article.price,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${siteUrl}/articles/${article.slug}?payment=success`,
        cancel_url: `${siteUrl}/articles/${article.slug}?payment=cancelled`,
        metadata: {
          order_id: order.id,
          article_id: article.id,
          buyer_user_id: user?.id || 'guest',
          is_guest: user ? 'false' : 'true',
        },
      };

      // For guest checkout, collect email via Stripe
      if (!user) {
        sessionConfig.customer_email = undefined; // Let Stripe collect it
        sessionConfig.customer_creation = 'if_required';
      } else {
        // For logged-in users, pre-fill email
        sessionConfig.customer_email = user.email;
      }

      const session = await stripe.checkout.sessions.create(sessionConfig);

      await supabase
        .from('orders')
        .update({ stripe_session_id: session.id })
        .eq('id', order.id);

      return new Response(
        JSON.stringify({ url: session.url }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request type' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
