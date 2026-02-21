-- GrayMall RLS Security Fix (Complete)
-- Supabase Security Audit で検出された全ての問題を修正
-- 実行日: 2024年

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
-- 3. Function Search Path を固定（全関数）
-- =====================================================

-- add_auto_likes_to_new_articles (引数なし)
ALTER FUNCTION public.add_auto_likes_to_new_articles() SET search_path = public;

-- cancel_withdrawal_request (p_user_id uuid, p_request_id uuid)
ALTER FUNCTION public.cancel_withdrawal_request(uuid, uuid) SET search_path = public;

-- check_affiliate_rate_update_limit (引数なし)
ALTER FUNCTION public.check_affiliate_rate_update_limit() SET search_path = public;

-- check_and_record_webhook_event (p_event_id text, p_event_type text, p_payload jsonb)
ALTER FUNCTION public.check_and_record_webhook_event(text, text, jsonb) SET search_path = public;

-- cleanup_old_webhook_events (days_to_keep integer)
ALTER FUNCTION public.cleanup_old_webhook_events(integer) SET search_path = public;

-- create_notification (p_user_id uuid, p_type text, p_title text, p_message text, p_metadata jsonb)
ALTER FUNCTION public.create_notification(uuid, text, text, text, jsonb) SET search_path = public;

-- create_withdrawal_request (p_user_id uuid, p_amount integer)
ALTER FUNCTION public.create_withdrawal_request(uuid, integer) SET search_path = public;

-- get_pending_withdrawals (p_year integer, p_month integer)
ALTER FUNCTION public.get_pending_withdrawals(integer, integer) SET search_path = public;

-- get_withdrawable_balance (p_user_id uuid)
ALTER FUNCTION public.get_withdrawable_balance(uuid) SET search_path = public;

-- handle_new_user (引数なし)
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- handle_new_user_profile (引数なし)
ALTER FUNCTION public.handle_new_user_profile() SET search_path = public;

-- handle_updated_at (引数なし)
ALTER FUNCTION public.handle_updated_at() SET search_path = public;

-- is_admin (引数なし版)
ALTER FUNCTION public.is_admin() SET search_path = public;

-- is_admin (uid uuid版)
ALTER FUNCTION public.is_admin(uuid) SET search_path = public;

-- process_checkout_completed (p_event_id text, p_session_id text, p_payment_intent_id text, p_order_id uuid)
ALTER FUNCTION public.process_checkout_completed(text, text, text, uuid) SET search_path = public;

-- retry_held_transfers (引数なし)
ALTER FUNCTION public.retry_held_transfers() SET search_path = public;

-- update_affiliate_rate (p_article_id uuid, p_user_id uuid, p_new_rate integer)
ALTER FUNCTION public.update_affiliate_rate(uuid, uuid, integer) SET search_path = public;


-- =====================================================
-- 確認用クエリ
-- =====================================================
-- RLSの確認:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Function search_path の確認:
-- SELECT proname, proconfig FROM pg_proc WHERE pronamespace = 'public'::regnamespace;
