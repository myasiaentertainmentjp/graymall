import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    console.error('No stripe-signature header');
    return new Response(JSON.stringify({ error: 'No signature' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', errorMessage);
    return new Response(
      JSON.stringify({ error: `Webhook Error: ${errorMessage}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log(`Received event: ${event.type}, id: ${event.id}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event, supabase);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionStatusChange(event, supabase, true);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionStatusChange(event, supabase, false);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event, supabase);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true, event_id: event.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Error processing ${event.type}:`, errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, event_id: event.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleCheckoutCompleted(
  event: Stripe.Event,
  supabase: ReturnType<typeof createClient>
) {
  const session = event.data.object as Stripe.Checkout.Session;
  console.log(`Processing checkout.session.completed: session=${session.id}`);

  // Check for subscription mode
  if (session.mode === 'subscription') {
    const userId = session.metadata?.user_id;
    if (userId && session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      await supabase
        .from('users')
        .update({
          stripe_subscription_id: subscription.id,
          subscription_status: 'active',
          is_premium: true,
          subscription_started_at: new Date(subscription.created * 1000).toISOString(),
          subscription_current_period_start: new Date(
            subscription.current_period_start * 1000
          ).toISOString(),
          subscription_current_period_end: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
        })
        .eq('id', userId);

      console.log(`Updated user ${userId} with subscription ${subscription.id}`);
    }
  }

  // Handle article purchases
  const orderId = session.metadata?.order_id;
  if (orderId && session.payment_intent) {
    // Get guest email from Stripe session
    const guestEmail = session.metadata?.is_guest === 'true'
      ? session.customer_details?.email || null
      : null;

    await handleOrderPayment(orderId, session.payment_intent as string, supabase, guestEmail);
  }
}

async function handleSubscriptionStatusChange(
  event: Stripe.Event,
  supabase: ReturnType<typeof createClient>,
  isActive: boolean
) {
  const subscription = event.data.object as Stripe.Subscription;
  const customerId = subscription.customer as string;

  console.log(
    `Processing subscription event: ${event.type}, subscription=${subscription.id}, customer=${customerId}`
  );

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  if (!user) {
    console.log(`User not found for customer ${customerId}`);
    return;
  }

  const subscriptionStatus =
    subscription.status === 'active'
      ? 'active'
      : subscription.status === 'past_due'
        ? 'past_due'
        : 'canceled';

  const updateData: Record<string, unknown> = {
    is_premium: isActive && subscription.status === 'active',
    subscription_status: subscriptionStatus,
    stripe_subscription_id: subscription.id,
    subscription_current_period_start: new Date(
      subscription.current_period_start * 1000
    ).toISOString(),
    subscription_current_period_end: new Date(
      subscription.current_period_end * 1000
    ).toISOString(),
  };

  if (!isActive || subscription.canceled_at) {
    updateData.subscription_canceled_at = new Date(
      subscription.canceled_at
        ? subscription.canceled_at * 1000
        : Date.now()
    ).toISOString();
  }

  await supabase
    .from('users')
    .update(updateData)
    .eq('id', user.id);

  console.log(
    `Updated user ${user.id} subscription status to ${subscriptionStatus}, is_premium=${isActive}`
  );
}

async function handleChargeRefunded(
  event: Stripe.Event,
  supabase: ReturnType<typeof createClient>
) {
  const charge = event.data.object as Stripe.Charge;
  console.log(`Processing charge.refunded: ${charge.id}`);

  const paymentIntentId = charge.payment_intent;
  if (!paymentIntentId || typeof paymentIntentId !== 'string') {
    console.log('No payment_intent in charge');
    return;
  }

  const { data: order } = await supabase
    .from('orders')
    .select('id, status')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle();

  if (!order) {
    console.log('Order not found for refund');
    return;
  }

  if (order.status === 'refunded') {
    console.log('Order already refunded');
    return;
  }

  const newStatus = charge.refunded ? 'refunded' : 'partially_refunded';

  await supabase
    .from('orders')
    .update({
      status: newStatus,
      refunded_at: new Date().toISOString(),
    })
    .eq('id', order.id);

  console.log(`Order ${order.id} status updated to: ${newStatus}`);
}

async function handleOrderPayment(
  orderId: string,
  paymentIntentId: string,
  supabase: ReturnType<typeof createClient>,
  guestEmail?: string | null
) {
  console.log(`Processing order payment: ${orderId}, guest email: ${guestEmail || 'N/A'}`);

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, amount, article_id, affiliate_user_id')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) {
    console.log('Order not found');
    return;
  }

  if (order.status === 'paid') {
    console.log('Order already paid');
    return;
  }

  const platformFee = Math.floor(order.amount * 0.15);
  let affiliateAmount = 0;

  // アフィリエイト報酬の計算（紹介者がいる場合）
  if (order.affiliate_user_id && order.article_id) {
    const { data: article } = await supabase
      .from('articles')
      .select('affiliate_enabled, affiliate_rate, author_id')
      .eq('id', order.article_id)
      .maybeSingle();

    if (article?.affiliate_enabled && article.affiliate_rate > 0) {
      // 自分自身の紹介は報酬対象外
      if (order.affiliate_user_id !== article.author_id) {
        affiliateAmount = Math.floor(order.amount * article.affiliate_rate / 100);
        console.log(`Affiliate reward: ${affiliateAmount} yen (rate: ${article.affiliate_rate}%, referrer: ${order.affiliate_user_id})`);
      } else {
        console.log(`Affiliate skipped: referrer is the author`);
      }
    }
  }

  const authorAmount = order.amount - platformFee - affiliateAmount;

  const updateData: Record<string, unknown> = {
    status: 'paid',
    stripe_payment_intent_id: paymentIntentId,
    paid_at: new Date().toISOString(),
    platform_fee: platformFee,
    author_amount: authorAmount,
    affiliate_amount: affiliateAmount,
    transfer_status: 'ready',
    updated_at: new Date().toISOString(),
  };

  // Save guest email if provided
  if (guestEmail) {
    updateData.guest_email = guestEmail;
  }

  await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId);

  console.log(`Order ${orderId} payment processed: amount=${order.amount}, platform=${platformFee}, affiliate=${affiliateAmount}, author=${authorAmount}${guestEmail ? ' (guest)' : ''}`);
}
