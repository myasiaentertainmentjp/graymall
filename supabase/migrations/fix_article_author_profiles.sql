-- 記事×著者プロフィール紐付け修正SQL
-- 対応表に基づいてauthor_profile_idを正しく設定

DO $$
DECLARE
  ryou_id uuid;
  natsumi_id uuid;
  haruka_id uuid;
  shinji_id uuid;
  daiki_id uuid;
  yuka_id uuid;
  kouta_id uuid;
  masato_id uuid;
  kenta_id uuid;
  saya_id uuid;
BEGIN
  -- 各著者のプロフィールIDを取得
  SELECT id INTO ryou_id FROM author_profiles WHERE display_name = 'りょう🔥古着と銭';
  SELECT id INTO natsumi_id FROM author_profiles WHERE display_name = 'なつみ｜副業OL';
  SELECT id INTO haruka_id FROM author_profiles WHERE display_name = 'はるか📎元・税務署の人';
  SELECT id INTO shinji_id FROM author_profiles WHERE display_name = 'しんじ';
  SELECT id INTO daiki_id FROM author_profiles WHERE display_name = 'だいき🍛キッチンカーの人';
  SELECT id INTO yuka_id FROM author_profiles WHERE display_name = 'ゆか🫧元エステ店長';
  SELECT id INTO kouta_id FROM author_profiles WHERE display_name = 'こうた｜FC被害者の会';
  SELECT id INTO masato_id FROM author_profiles WHERE display_name = 'まさと💀500万溶かした人';
  SELECT id INTO kenta_id FROM author_profiles WHERE display_name = 'けんた🎸→🤖';
  SELECT id INTO saya_id FROM author_profiles WHERE display_name = 'さや🖌️';

  -- =====================
  -- 物販・転売・リユース（6本）
  -- =====================

  -- R-1: りょう - メルカリ古着転売で月40万円
  UPDATE articles SET author_profile_id = ryou_id
  WHERE title LIKE '%メルカリ古着転売で月40万%';

  -- R-2: りょう - 古着転売で即アカBAN
  UPDATE articles SET author_profile_id = ryou_id
  WHERE title LIKE '%古着転売で即アカBAN%';

  -- R-3: りょう - 古着の実店舗を出して半年で閉めた
  UPDATE articles SET author_profile_id = ryou_id
  WHERE title LIKE '%古着の実店舗を出して半年で閉め%';

  -- N-1: なつみ - 中国輸入×メルカリ転売で月10万円
  UPDATE articles SET author_profile_id = natsumi_id
  WHERE title LIKE '%中国輸入×メルカリ転売で月10万%';

  UPDATE articles SET author_profile_id = natsumi_id
  WHERE title LIKE '%中国輸入%メルカリ%月10万円稼ぐ%';

  -- N-2: なつみ - 中国輸入で最初に仕入れた商品が全く売れなかった
  UPDATE articles SET author_profile_id = natsumi_id
  WHERE title LIKE '%中国輸入で最初に仕入れた商品が%売れなかった%';

  -- K-1: こうた - メルカリ vs ヤフオク vs eBay
  UPDATE articles SET author_profile_id = kouta_id
  WHERE title LIKE '%メルカリ vs ヤフオク vs eBay%';

  UPDATE articles SET author_profile_id = kouta_id
  WHERE title LIKE '%メルカリ%ヤフオク%eBay%3つ全部%';

  -- =====================
  -- マネー・税・経済・制度（7本）
  -- =====================

  -- H-1: はるか - 副業バレの実態
  UPDATE articles SET author_profile_id = haruka_id
  WHERE title LIKE '%副業バレ%実態%';

  -- H-2: はるか - 税務調査に入られる個人事業主
  UPDATE articles SET author_profile_id = haruka_id
  WHERE title LIKE '%税務調査に入られる個人事業主%';

  -- H-3: はるか - 普通徴収が通らないケース
  UPDATE articles SET author_profile_id = haruka_id
  WHERE title LIKE '%普通徴収%通らない%';

  -- S-1: しんじ - 連帯保証で借金2,800万円
  UPDATE articles SET author_profile_id = shinji_id
  WHERE title LIKE '%連帯保証%借金%自己破産%';

  -- S-2: しんじ - 自己破産した後のリアルな生活
  UPDATE articles SET author_profile_id = shinji_id
  WHERE title LIKE '%自己破産した後%リアル%生活%';

  -- M-1: まさと - 仮想通貨に貯金500万突っ込んで
  UPDATE articles SET author_profile_id = masato_id
  WHERE title LIKE '%仮想通貨に貯金500万%溶かした%';

  UPDATE articles SET author_profile_id = masato_id
  WHERE title LIKE '%仮想通貨%500万%溶かした%' AND title NOT LIKE '%確定申告%';

  -- M-2: まさと - 仮想通貨で500万溶かした後の確定申告
  UPDATE articles SET author_profile_id = masato_id
  WHERE title LIKE '%仮想通貨%500万溶かした後の確定申告%';

  -- =====================
  -- 店舗・現場ビジネス（5本）
  -- =====================

  -- D-1: だいき - キッチンカーを始めたら最初の半年は地獄
  UPDATE articles SET author_profile_id = daiki_id
  WHERE title LIKE '%キッチンカーを始めたら%地獄%';

  UPDATE articles SET author_profile_id = daiki_id
  WHERE title LIKE '%脱サラ%キッチンカー%';

  -- D-2: だいき - キッチンカーで月商80万円
  UPDATE articles SET author_profile_id = daiki_id
  WHERE title LIKE '%キッチンカーで月商80万%';

  -- Y-1: ゆか - 自宅エステサロンを開業して3ヶ月で撤退
  UPDATE articles SET author_profile_id = yuka_id
  WHERE title LIKE '%自宅エステサロン%開業%撤退%';

  UPDATE articles SET author_profile_id = yuka_id
  WHERE title LIKE '%自宅エステサロン%3ヶ月%';

  -- Y-2: ゆか - エステ業界の裏側
  UPDATE articles SET author_profile_id = yuka_id
  WHERE title LIKE '%エステ業界の裏側%';

  -- K-2: こうた - 買取フランチャイズに200万払って1年で辞めた
  UPDATE articles SET author_profile_id = kouta_id
  WHERE title LIKE '%買取フランチャイズ%200万%辞めた%';

  -- =====================
  -- アート・音楽・エンタメ（5本）
  -- =====================

  -- KT-1: けんた - バンドマンが6年やって月収8万円
  UPDATE articles SET author_profile_id = kenta_id
  WHERE title LIKE '%バンドマン%6年%月収8万%';

  -- KT-2: けんた - ライブハウスのノルマ制度
  UPDATE articles SET author_profile_id = kenta_id
  WHERE title LIKE '%ライブハウスのノルマ%';

  -- KT-3: けんた - AI作曲で月10万円の不労所得
  UPDATE articles SET author_profile_id = kenta_id
  WHERE title LIKE '%AI作曲%不労所得%';

  -- SA-1: さや - 手描きイラストレーターがAIを使い始めて炎上
  UPDATE articles SET author_profile_id = saya_id
  WHERE title LIKE '%手描きイラストレーター%AI%炎上%';

  -- SA-2: さや - AI×手描きのハイブリッド
  UPDATE articles SET author_profile_id = saya_id
  WHERE title LIKE '%AI%手描き%ハイブリッド%';

  RAISE NOTICE 'Author profile IDs updated successfully';
END $$;

-- 結果確認
SELECT
  a.title,
  ap.display_name as author_profile_name,
  a.author_profile_id
FROM articles a
LEFT JOIN author_profiles ap ON a.author_profile_id = ap.id
WHERE a.title LIKE '%古着%'
   OR a.title LIKE '%中国輸入%'
   OR a.title LIKE '%税務%'
   OR a.title LIKE '%副業バレ%'
   OR a.title LIKE '%普通徴収%'
   OR a.title LIKE '%自己破産%'
   OR a.title LIKE '%仮想通貨%'
   OR a.title LIKE '%キッチンカー%'
   OR a.title LIKE '%エステ%'
   OR a.title LIKE '%フランチャイズ%'
   OR a.title LIKE '%バンドマン%'
   OR a.title LIKE '%ライブハウス%'
   OR a.title LIKE '%AI作曲%'
   OR a.title LIKE '%イラストレーター%'
   OR a.title LIKE '%メルカリ vs ヤフオク%'
ORDER BY ap.display_name, a.title;
