import { supabase } from './supabase';
  import type { Database } from './database.types';

  type Article = Database['public']['Tables']['articles']['Row'];

  export async function checkArticleAccess(
    userId: string | undefined,
    article: Article
  ): Promise<boolean> {
    if (!userId) {
      return false;
    }

    if (article.author_id === userId) {
      return true;
    }

    const { data: profile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.is_admin) {
      return true;
    }

    // 複数レコードがある場合に対応: limit(1) を使用
    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('buyer_id', userId)
      .eq('article_id', article.id)
      .eq('status', 'paid')
      .limit(1);

    if (orders && orders.length > 0) {
      return true;
    }

    const now = new Date().toISOString();
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('subscriber_id', userId)
      .eq('author_id', article.author_id)
      .eq('status', 'active')
      .lte('current_period_start', now)
      .gte('current_period_end', now)
      .limit(1);

    if (subscription && subscription.length > 0) {
      return true;
    }

    return false;
  }
