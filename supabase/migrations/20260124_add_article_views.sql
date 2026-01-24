-- article_views テーブル: ユーザーの閲覧履歴を記録
CREATE TABLE IF NOT EXISTS article_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_article_views_user_id ON article_views(user_id);
CREATE INDEX IF NOT EXISTS idx_article_views_viewed_at ON article_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_views_article_id ON article_views(article_id);

-- RLS有効化
ALTER TABLE article_views ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の閲覧履歴を追加できる
CREATE POLICY "Users can insert own views" ON article_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の閲覧履歴を読める
CREATE POLICY "Users can read own views" ON article_views
  FOR SELECT USING (auth.uid() = user_id);

-- ユーザーは自分の閲覧履歴を更新できる（viewed_atの更新用）
CREATE POLICY "Users can update own views" ON article_views
  FOR UPDATE USING (auth.uid() = user_id);
