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
