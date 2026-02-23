-- グレーモール 記事×著者 紐付けSQL（シンプル版）
-- Supabase SQL Editor で実行してください
-- タイトルの一部でマッチングするので、確実に動作します

-- ========================================
-- 物販・転売・リユース（6本）→ りょう / なつみ / こうた
-- ========================================

-- りょう🔥古着と銭
UPDATE articles SET author_profile_id = (SELECT id FROM author_profiles WHERE display_name = 'りょう🔥古着と銭')
WHERE title LIKE '%古着転売で月40万%';

UPDATE articles SET author_profile_id = (SELECT id FROM author_profiles WHERE display_name = 'りょう🔥古着と銭')
WHERE title LIKE '%古着転売%アカBAN%';

UPDATE articles SET author_profile_id = (SELECT id FROM author_profiles WHERE display_name = 'りょう🔥古着と銭')
WHERE title LIKE '%実店舗を出して半年で閉めた%';

-- なつみ｜副業OL
UPDATE articles SET author_profile_id = (SELECT id FROM author_profiles WHERE display_name = 'なつみ｜副業OL')
WHERE title LIKE '%中国輸入%月10万円稼ぐ%';

UPDATE articles SET author_profile_id = (SELECT id FROM author_profiles WHERE display_name = 'なつみ｜副業OL')
WHERE title LIKE '%最初に仕入れた商品が全く売れなかった%';

-- こうた｜FC被害者の会
UPDATE articles SET author_profile_id = (SELECT id FROM author_profiles WHERE display_name = 'こうた｜FC被害者の会')
WHERE title LIKE '%メルカリ vs ヤフオク vs eBay%';

-- ========================================
-- マネー・税・経済・制度（7本）→ はるか / しんじ / まさと
-- ========================================

-- はるか📎元・税務署の人
UPDATE articles SET author_profile_id = (SELECT id FROM author_profiles WHERE display_name = 'はるか📎元・税務署の人')
WHERE title LIKE '%副業バレ%の実態%';

UPDATE articles SET author_profile_id = (SELECT id FROM author_profiles WHERE display_name = 'はるか📎元・税務署の人')
WHERE title LIKE '%税務調査に入られる%';

UPDATE articles SET author_profile_id = (SELECT id FROM author_profiles WHERE display_name = 'はるか📎元・税務署の人')
WHERE title LIKE '%普通徴収%が通らない%';

-- しんじ
UPDATE articles SET author_profile_id = (SELECT id FROM author_profiles WHERE display_name = 'しんじ')
WHERE title LIKE '%連帯保証で借金%自己破産%';

UPDATE articles SET author_profile_id = (SELECT id FROM author_profiles WHERE display_name = 'しんじ')
WHERE title LIKE '%自己破産した後のリアルな生活%';

-- まさと💀500万溶かした人
UPDATE articles SET author_profile_id = (SELECT id FROM author_profiles WHERE display_name = 'まさと💀500万溶かした人')
WHERE title LIKE '%貯金500万突っ込んで%溶かした%';

UPDATE articles SET author_profile_id = (SELECT id FROM author_profiles WHERE display_name = 'まさと💀500万溶かした人')
WHERE title LIKE '%500万溶かした後の確定申告%';

-- ========================================
-- 店舗・現場ビジネス（5本）→ だいき / ゆか / こうた
-- ========================================

-- だいき🍛キッチンカーの人
UPDATE articles SET author_profile_id = (SELECT id FROM author_profiles WHERE display_name = 'だいき🍛キッチンカーの人')
WHERE title LIKE '%キッチンカーを始めたら%地獄%';

UPDATE articles SET author_profile_id = (SELECT id FROM author_profiles WHERE display_name = 'だいき🍛キッチンカーの人')
WHERE title LIKE '%キッチンカーで月商80万%';

-- ゆか🫧元エステ店長
UPDATE articles SET author_profile_id = (SELECT id FROM author_profiles WHERE display_name = 'ゆか🫧元エステ店長')
WHERE title LIKE '%自宅エステサロン%撤退%';

UPDATE articles SET author_profile_id = (SELECT id FROM author_profiles WHERE display_name = 'ゆか🫧元エステ店長')
WHERE title LIKE '%エステ業界の裏側%';

-- こうた｜FC被害者の会
UPDATE articles SET author_profile_id = (SELECT id FROM author_profiles WHERE display_name = 'こうた｜FC被害者の会')
WHERE title LIKE '%買取フランチャイズに200万%辞めた%';

-- ========================================
-- アート・音楽・エンタメ（5本）→ けんた / さや
-- ========================================

-- けんた🎸→🤖
UPDATE articles SET author_profile_id = (SELECT id FROM author_profiles WHERE display_name = 'けんた🎸→🤖')
WHERE title LIKE '%バンドマン%月収8万%';

UPDATE articles SET author_profile_id = (SELECT id FROM author_profiles WHERE display_name = 'けんた🎸→🤖')
WHERE title LIKE '%ライブハウスのノルマ制度%';

UPDATE articles SET author_profile_id = (SELECT id FROM author_profiles WHERE display_name = 'けんた🎸→🤖')
WHERE title LIKE '%AI作曲で月10万円の不労所得%';

-- さや🖌️
UPDATE articles SET author_profile_id = (SELECT id FROM author_profiles WHERE display_name = 'さや🖌️')
WHERE title LIKE '%手描きイラストレーター%AIを使い始めて炎上%';

UPDATE articles SET author_profile_id = (SELECT id FROM author_profiles WHERE display_name = 'さや🖌️')
WHERE title LIKE '%AI×手描きのハイブリッド%月15万%';

-- ========================================
-- 確認
-- ========================================
SELECT a.title, ap.display_name as author
FROM articles a
LEFT JOIN author_profiles ap ON a.author_profile_id = ap.id
ORDER BY a.created_at;
