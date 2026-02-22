-- ============================================
-- 0. 自動いいね済み記事のfake_favorite_countを修正
-- ============================================
-- 既存の自動いいね済み記事の fake_favorite_count を更新
UPDATE articles a
SET fake_favorite_count = COALESCE(a.fake_favorite_count, 0) + alp.likes_count
FROM auto_likes_processed alp
WHERE a.id = alp.article_id
  AND (a.fake_favorite_count IS NULL OR a.fake_favorite_count = 0);

-- ============================================
-- 0.5. 自動いいね関数を更新（fake_favorite_countも更新するように）
-- ============================================
CREATE OR REPLACE FUNCTION add_auto_likes_to_new_articles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_article RECORD;
  graymall_user RECORD;
  likes_to_add INT;
  added_count INT;
BEGIN
  FOR target_article IN
    SELECT a.id, a.title
    FROM articles a
    WHERE a.status = 'published'
      AND a.published_at IS NOT NULL
      AND a.published_at > NOW() - INTERVAL '30 minutes'
      AND a.published_at <= NOW() - INTERVAL '5 minutes'
      AND NOT EXISTS (
        SELECT 1 FROM auto_likes_processed alp WHERE alp.article_id = a.id
      )
  LOOP
    likes_to_add := 3 + floor(random() * 5)::INT;
    added_count := 0;

    FOR graymall_user IN
      SELECT u.id
      FROM users u
      WHERE u.email LIKE '%@graymall.jp'
        AND NOT EXISTS (
          SELECT 1 FROM article_favorites af
          WHERE af.article_id = target_article.id AND af.user_id = u.id
        )
      ORDER BY random()
      LIMIT likes_to_add
    LOOP
      INSERT INTO article_favorites (user_id, article_id)
      VALUES (graymall_user.id, target_article.id)
      ON CONFLICT DO NOTHING;
      added_count := added_count + 1;
    END LOOP;

    -- ★ fake_favorite_count も更新（Home画面で表示されるように）
    UPDATE articles
    SET fake_favorite_count = COALESCE(fake_favorite_count, 0) + added_count
    WHERE id = target_article.id;

    INSERT INTO auto_likes_processed (article_id, likes_count)
    VALUES (target_article.id, added_count);
  END LOOP;
END;
$$;

-- ============================================
-- 1. fake_favorite_countカラムを追加（存在しない場合）
-- ============================================
ALTER TABLE articles ADD COLUMN IF NOT EXISTS fake_favorite_count INTEGER DEFAULT 0;

-- ============================================
-- 2. 初期ダミーいいね数を設定
-- ============================================
UPDATE articles SET fake_favorite_count = 3 WHERE id = '0cea3e84-4674-44bc-9d28-832ca3a11088';
UPDATE articles SET fake_favorite_count = 7 WHERE id = 'e6adf38d-6d55-45bc-aa4b-abab55c38e88';
UPDATE articles SET fake_favorite_count = 12 WHERE id = 'c0c2e248-e1f3-4373-9c3e-5089e92df997';
UPDATE articles SET fake_favorite_count = 15 WHERE id = '1f6bc711-2522-4007-be33-bc75a1e80481';
UPDATE articles SET fake_favorite_count = 5 WHERE id = '80ee6e13-bde9-4bf3-ac12-fe46d3efe957';
UPDATE articles SET fake_favorite_count = 0 WHERE id = '413b066d-4405-458f-93cb-7ff1c40c3abe';
UPDATE articles SET fake_favorite_count = 2 WHERE id = '7b75f8f9-3b8f-4b45-8b99-91523e73ab84';
UPDATE articles SET fake_favorite_count = 0 WHERE id = '211cf6de-ba9a-4fc2-8ee2-68f84a9019a0';
UPDATE articles SET fake_favorite_count = 9 WHERE id = '498dd489-8991-4d04-bf28-496564a5f29c';
UPDATE articles SET fake_favorite_count = 6 WHERE id = '420a7713-9c6c-48cb-85e7-915a9938e915';
UPDATE articles SET fake_favorite_count = 11 WHERE id = 'c798663c-45da-4488-834c-aaaa777a8d43';
UPDATE articles SET fake_favorite_count = 0 WHERE id = 'cea3a534-4d75-4d7a-bc50-e270a41fcb6a';
UPDATE articles SET fake_favorite_count = 0 WHERE id = '8adc67ec-265f-4a1b-a3c4-d4e2d0bea2db';
UPDATE articles SET fake_favorite_count = 4 WHERE id = 'bcf9af78-3423-4437-83e6-616bed49f1b7';
UPDATE articles SET fake_favorite_count = 8 WHERE id = 'f7cf922d-7fd0-4e37-b7dd-b773e469fe5e';
UPDATE articles SET fake_favorite_count = 0 WHERE id = 'a17891e0-0e20-41b4-8bd3-612e2f6a5ae1';
UPDATE articles SET fake_favorite_count = 6 WHERE id = 'ad82ac81-615c-4d29-8360-5c05ada5065c';
UPDATE articles SET fake_favorite_count = 3 WHERE id = '564e6a5c-9c35-4ebc-9e6b-b772ccd1c523';
UPDATE articles SET fake_favorite_count = 0 WHERE id = '214ee53d-b66c-498f-81da-7903e23361ea';

-- ============================================
-- 3. いいね自動増加用の設定テーブル作成
-- ============================================
CREATE TABLE IF NOT EXISTS article_like_config (
  article_id UUID PRIMARY KEY REFERENCES articles(id) ON DELETE CASCADE,
  article_type CHAR(1) NOT NULL CHECK (article_type IN ('A', 'B', 'C')),
  max_likes INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- タイプA（人気記事）- 週あたり+2〜4、最大60
INSERT INTO article_like_config (article_id, article_type, max_likes) VALUES
  ('1f6bc711-2522-4007-be33-bc75a1e80481', 'A', 60),
  ('c798663c-45da-4488-834c-aaaa777a8d43', 'A', 60),
  ('c0c2e248-e1f3-4373-9c3e-5089e92df997', 'A', 60),
  ('498dd489-8991-4d04-bf28-496564a5f29c', 'A', 60),
  ('f7cf922d-7fd0-4e37-b7dd-b773e469fe5e', 'A', 60)
ON CONFLICT (article_id) DO UPDATE SET article_type = 'A', max_likes = 60;

-- タイプB（普通記事）- 週あたり+1〜2、最大35
INSERT INTO article_like_config (article_id, article_type, max_likes) VALUES
  ('e6adf38d-6d55-45bc-aa4b-abab55c38e88', 'B', 35),
  ('80ee6e13-bde9-4bf3-ac12-fe46d3efe957', 'B', 35),
  ('420a7713-9c6c-48cb-85e7-915a9938e915', 'B', 35),
  ('ad82ac81-615c-4d29-8360-5c05ada5065c', 'B', 35),
  ('564e6a5c-9c35-4ebc-9e6b-b772ccd1c523', 'B', 35),
  ('bcf9af78-3423-4437-83e6-616bed49f1b7', 'B', 35)
ON CONFLICT (article_id) DO UPDATE SET article_type = 'B', max_likes = 35;

-- タイプC（ニッチ記事）- 週あたり+0〜1、最大15
INSERT INTO article_like_config (article_id, article_type, max_likes) VALUES
  ('413b066d-4405-458f-93cb-7ff1c40c3abe', 'C', 15),
  ('7b75f8f9-3b8f-4b45-8b99-91523e73ab84', 'C', 15),
  ('211cf6de-ba9a-4fc2-8ee2-68f84a9019a0', 'C', 15),
  ('cea3a534-4d75-4d7a-bc50-e270a41fcb6a', 'C', 15),
  ('8adc67ec-265f-4a1b-a3c4-d4e2d0bea2db', 'C', 15),
  ('a17891e0-0e20-41b4-8bd3-612e2f6a5ae1', 'C', 15),
  ('0cea3e84-4674-44bc-9d28-832ca3a11088', 'C', 15),
  ('214ee53d-b66c-498f-81da-7903e23361ea', 'C', 15)
ON CONFLICT (article_id) DO UPDATE SET article_type = 'C', max_likes = 15;

-- ============================================
-- 4. 予約投稿の自動公開（pg_cron）
-- ============================================
-- pg_cron拡張を有効化（Supabaseダッシュボード > Database > Extensions で有効化必要）
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1分ごとに予約投稿をチェックして公開
-- SELECT cron.schedule(
--   'publish-scheduled-articles',
--   '* * * * *',
--   'SELECT publish_scheduled_articles()'
-- );

-- 既存のジョブを確認
-- SELECT * FROM cron.job;

-- ジョブを削除する場合
-- SELECT cron.unschedule('publish-scheduled-articles');

-- ============================================
-- 5. データベースインデックス最適化
-- ============================================
-- よく使われるクエリを高速化するインデックス

-- 記事の検索用複合インデックス
CREATE INDEX IF NOT EXISTS idx_articles_status_published_at
ON articles(status, published_at DESC)
WHERE status = 'published' AND is_archived = false;

-- カテゴリ別記事検索用
CREATE INDEX IF NOT EXISTS idx_articles_category_status
ON articles(primary_category_id, status, published_at DESC);

-- 著者別記事検索用
CREATE INDEX IF NOT EXISTS idx_articles_author_status
ON articles(author_id, status, published_at DESC);

-- 著者プロフィール別記事検索用
CREATE INDEX IF NOT EXISTS idx_articles_author_profile_status
ON articles(author_profile_id, status, published_at DESC);

-- スラッグ検索用（記事詳細ページ）
CREATE INDEX IF NOT EXISTS idx_articles_slug
ON articles(slug) WHERE status = 'published';

-- いいね数でのソート用
CREATE INDEX IF NOT EXISTS idx_articles_fake_favorite_count
ON articles(fake_favorite_count DESC)
WHERE status = 'published';

-- お気に入り検索用
CREATE INDEX IF NOT EXISTS idx_article_favorites_user_article
ON article_favorites(user_id, article_id);

-- フォロー検索用
CREATE INDEX IF NOT EXISTS idx_follows_follower_following
ON follows(follower_id, following_id);

-- 通知検索用
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
ON notifications(user_id, created_at DESC);

-- コメント検索用
CREATE INDEX IF NOT EXISTS idx_article_comments_article_created
ON article_comments(article_id, created_at DESC);

-- 購入履歴検索用
CREATE INDEX IF NOT EXISTS idx_purchases_user_article
ON purchases(user_id, article_id);
