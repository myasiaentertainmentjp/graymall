-- ============================================
-- 1. コメント返信機能（parent_id追加）
-- ============================================
ALTER TABLE article_comments
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES article_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_article_comments_parent_id ON article_comments(parent_id);

-- ============================================
-- 2. 予約投稿機能（scheduled_at追加）
-- ============================================
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_articles_scheduled_at ON articles(scheduled_at);

-- 予約投稿を自動公開する関数
CREATE OR REPLACE FUNCTION publish_scheduled_articles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE articles
  SET
    status = 'published',
    published_at = scheduled_at,
    scheduled_at = NULL
  WHERE
    status = 'scheduled'
    AND scheduled_at IS NOT NULL
    AND scheduled_at <= NOW();
END;
$$;

-- pg_cronで1分ごとに実行（Supabaseダッシュボードで有効化）
-- SELECT cron.schedule('publish-scheduled-articles', '* * * * *', 'SELECT publish_scheduled_articles()');
