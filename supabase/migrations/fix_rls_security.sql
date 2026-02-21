-- GrayMall RLS Security Fix
-- Supabase Security Audit で検出された問題を修正

-- =====================================================
-- 1. RLS を有効にする
-- =====================================================

-- author_profiles: RLSを有効化
ALTER TABLE public.author_profiles ENABLE ROW LEVEL SECURITY;

-- homepage_sections: RLSを有効化
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

-- auto_likes_processed: RLSを有効化
ALTER TABLE public.auto_likes_processed ENABLE ROW LEVEL SECURITY;


-- =====================================================
-- 2. RLS ポリシーを作成（必要に応じて）
-- =====================================================

-- homepage_sections: 全員が読み取り可能
DROP POLICY IF EXISTS "homepage_sections_select_all" ON public.homepage_sections;
CREATE POLICY "homepage_sections_select_all" ON public.homepage_sections
  FOR SELECT USING (true);

-- homepage_sections: 管理者のみ更新可能
DROP POLICY IF EXISTS "homepage_sections_admin_all" ON public.homepage_sections;
CREATE POLICY "homepage_sections_admin_all" ON public.homepage_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- auto_likes_processed: サービスロールのみアクセス可能
DROP POLICY IF EXISTS "auto_likes_processed_service_only" ON public.auto_likes_processed;
CREATE POLICY "auto_likes_processed_service_only" ON public.auto_likes_processed
  FOR ALL USING (false);  -- 通常ユーザーはアクセス不可（Edge Functionのservice_roleでアクセス）


-- =====================================================
-- 3. Function Search Path を固定（セキュリティ強化）
-- =====================================================

-- handle_new_user_profile
ALTER FUNCTION public.handle_new_user_profile() SET search_path = public;

-- is_admin
ALTER FUNCTION public.is_admin() SET search_path = public;

-- create_notification
ALTER FUNCTION public.create_notification(uuid, text, text, text, jsonb) SET search_path = public;

-- check_affiliate_rate_update_limit
ALTER FUNCTION public.check_affiliate_rate_update_limit() SET search_path = public;

-- calculate_distribution
ALTER FUNCTION public.calculate_distribution(uuid, integer) SET search_path = public;

-- process_order_payment
ALTER FUNCTION public.process_order_payment(uuid) SET search_path = public;

-- get_pending_transfers
ALTER FUNCTION public.get_pending_transfers() SET search_path = public;

-- notify_withdrawal_status_change
ALTER FUNCTION public.notify_withdrawal_status_change() SET search_path = public;


-- =====================================================
-- 確認用クエリ
-- =====================================================
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
