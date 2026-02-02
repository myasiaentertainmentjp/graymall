-- ============================================
-- article_comments テーブル作成
-- ============================================
CREATE TABLE IF NOT EXISTS article_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 500 AND char_length(content) > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_article_comments_article_id ON article_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_user_id ON article_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_created_at ON article_comments(created_at DESC);

-- RLS有効化
ALTER TABLE article_comments ENABLE ROW LEVEL SECURITY;

-- 閲覧: 誰でもOK
CREATE POLICY "Anyone can view comments" ON article_comments
  FOR SELECT USING (true);

-- 投稿: ログインユーザーのみ（購入チェックはアプリ側で行う）
CREATE POLICY "Logged in users can insert comments" ON article_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 更新: 投稿者本人のみ
CREATE POLICY "Users can update own comments" ON article_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- 削除: 投稿者本人 または 記事の著者
CREATE POLICY "Users can delete own comments or article author can delete" ON article_comments
  FOR DELETE USING (
    auth.uid() = user_id
    OR auth.uid() = (SELECT author_id FROM articles WHERE id = article_id)
  );
