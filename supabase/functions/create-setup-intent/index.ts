// supabase/functions/create-setup-intent/index.ts
// クレジットカード登録用のStripe Checkout Sessionを作成

import Stripe from 'npm:stripe@14.14.0';
import { createClient } from 'npm:@supabase/supabase-js';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SetupRequest {
  returnUrl?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body: SetupRequest = await req.json().catch(() => ({}));
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const origin = req.headers.get('Origin') || req.headers.get('Referer') || '';
    const siteUrl = origin ? new URL(origin).origin : 'https://graymall.jp';

    // Stripe Customer IDを取得または作成
    const { data: userProfile } = await supabase
      .from('users')
      .select('stripe_customer_id, email, display_name')
      .eq('id', user.id)
      .maybeSingle();

    let customerId = userProfile?.stripe_customer_id;

    if (!customerId) {
      // 新規Customer作成
      const customer = await stripe.customers.create({
        email: user.email || userProfile?.email,
        name: userProfile?.display_name || undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;

      // usersテーブルに保存
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Checkout Sessionをsetupモードで作成（カード登録用）
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'setup',
      payment_method_types: ['card'],
      success_url: body.returnUrl || `${siteUrl}/settings/card?success=true`,
      cancel_url: `${siteUrl}/settings/card?canceled=true`,
      metadata: {
        user_id: user.id,
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
