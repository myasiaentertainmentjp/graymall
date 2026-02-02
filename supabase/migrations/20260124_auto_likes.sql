-- ダミーいいね処理済み記事を追跡するテーブル
CREATE TABLE IF NOT EXISTS auto_likes_processed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE UNIQUE,
  likes_count INT NOT NULL DEFAULT 0,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auto_likes_processed_article_id ON auto_likes_processed(article_id);

-- ダミーいいねを追加する関数
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
  selected_users UUID[];
BEGIN
  -- 公開から5〜30分経過した記事で、まだ処理していないものを取得
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
    -- 3〜7のランダムないいね数を決定
    likes_to_add := 3 + floor(random() * 5)::INT;
    added_count := 0;
    selected_users := ARRAY[]::UUID[];

    -- @graymall.jpのユーザーからランダムに選択していいねを追加
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
      -- いいねを追加
      INSERT INTO article_favorites (user_id, article_id)
      VALUES (graymall_user.id, target_article.id)
      ON CONFLICT DO NOTHING;

      added_count := added_count + 1;
      selected_users := array_append(selected_users, graymall_user.id);
    END LOOP;

    -- 処理済みとしてマーク
    INSERT INTO auto_likes_processed (article_id, likes_count)
    VALUES (target_article.id, added_count);

    RAISE NOTICE 'Added % auto likes to article %', added_count, target_article.id;
  END LOOP;
END;
$$;

-- pg_cronで5分ごとに実行（Supabaseダッシュボードで有効化が必要）
-- SELECT cron.schedule('add-auto-likes', '*/5 * * * *', 'SELECT add_auto_likes_to_new_articles()');

-- 手動実行用のコメント
-- SELECT add_auto_likes_to_new_articles();
