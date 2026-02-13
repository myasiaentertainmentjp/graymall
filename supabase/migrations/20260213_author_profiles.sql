-- 著者プロフィールテーブル（管理者が作成する仮想著者）
CREATE TABLE IF NOT EXISTS author_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  avatar_url text,
  bio text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- articlesテーブルに著者プロフィールIDカラムを追加
-- NULLの場合は従来通りauthor_idのユーザー情報を使用
ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_profile_id uuid REFERENCES author_profiles(id) ON DELETE SET NULL;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_author_profiles_created_by ON author_profiles(created_by);
CREATE INDEX IF NOT EXISTS idx_articles_author_profile_id ON articles(author_profile_id);

-- RLSを有効化
ALTER TABLE author_profiles ENABLE ROW LEVEL SECURITY;

-- 管理者は全ての著者プロフィールを管理可能
CREATE POLICY "Admins can manage author profiles"
ON author_profiles
FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true)
);

-- 全ユーザーは著者プロフィールを閲覧可能（記事表示用）
CREATE POLICY "Anyone can read author profiles"
ON author_profiles
FOR SELECT
TO authenticated, anon
USING (true);
