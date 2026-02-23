-- グレーモール 記事×著者 紐付けSQL
-- Supabase SQL Editor で実行してください

-- まず author_profiles の確認
-- SELECT id, display_name FROM author_profiles;

-- ========================================
-- 著者IDを変数に格納
-- ========================================
DO $$
DECLARE
    ryou_id UUID;
    natsumi_id UUID;
    haruka_id UUID;
    shinji_id UUID;
    daiki_id UUID;
    yuka_id UUID;
    kouta_id UUID;
    masato_id UUID;
    kenta_id UUID;
    saya_id UUID;
BEGIN
    -- 各著者のIDを取得
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

    -- ========================================
    -- 物販・転売・リユース（6本）
    -- ========================================

    -- R-1: メルカリ古着転売で月40万円稼いでた時の全手順 → りょう
    UPDATE articles SET author_profile_id = ryou_id WHERE title LIKE '%メルカリ古着転売%月40万%';

    -- R-2: 古着転売で即アカBANされるパターンと対策 → りょう
    UPDATE articles SET author_profile_id = ryou_id WHERE title LIKE '%古着転売%アカBAN%';

    -- N-1: 中国輸入×メルカリ転売で月10万円稼ぐまでにやったこと → なつみ
    UPDATE articles SET author_profile_id = natsumi_id WHERE title LIKE '%中国輸入%メルカリ転売%月10万%';

    -- N-2: 中国輸入で最初に仕入れた商品が全く売れなかった話 → なつみ
    UPDATE articles SET author_profile_id = natsumi_id WHERE title LIKE '%中国輸入%最初に仕入れた商品%売れなかった%';

    -- K-1: メルカリ vs ヤフオク vs eBay → こうた
    UPDATE articles SET author_profile_id = kouta_id WHERE title LIKE '%メルカリ%ヤフオク%eBay%';

    -- R-3: 古着の実店舗を出して半年で閉めた話 → りょう
    UPDATE articles SET author_profile_id = ryou_id WHERE title LIKE '%古着%実店舗%半年で閉めた%';

    -- ========================================
    -- マネー・税・経済・制度（7本）
    -- ========================================

    -- H-1: 元税務署職員が見てきた「副業バレ」の実態 → はるか
    UPDATE articles SET author_profile_id = haruka_id WHERE title LIKE '%元税務署職員%副業バレ%';

    -- H-2: 税務調査に入られる個人事業主の特徴 → はるか
    UPDATE articles SET author_profile_id = haruka_id WHERE title LIKE '%税務調査%個人事業主%特徴%';

    -- H-3: 住民税の「普通徴収」が通らないケースと対処法 → はるか
    UPDATE articles SET author_profile_id = haruka_id WHERE title LIKE '%住民税%普通徴収%通らない%';

    -- S-1: 連帯保証で借金2,800万円を背負って自己破産した話 → しんじ
    UPDATE articles SET author_profile_id = shinji_id WHERE title LIKE '%連帯保証%借金%2,800万%自己破産%';

    -- S-2: 自己破産した後のリアルな生活 → しんじ
    UPDATE articles SET author_profile_id = shinji_id WHERE title LIKE '%自己破産%後%リアルな生活%';

    -- M-1: 仮想通貨に貯金500万突っ込んで全部溶かした話 → まさと
    UPDATE articles SET author_profile_id = masato_id WHERE title LIKE '%仮想通貨%貯金500万%溶かした%';

    -- M-2: 仮想通貨で500万溶かした後の確定申告と税金の話 → まさと
    UPDATE articles SET author_profile_id = masato_id WHERE title LIKE '%仮想通貨%500万溶かした%確定申告%税金%';

    -- ========================================
    -- 店舗・現場ビジネス（5本）
    -- ========================================

    -- D-1: 脱サラしてキッチンカーを始めたら最初の半年は地獄だった → だいき
    UPDATE articles SET author_profile_id = daiki_id WHERE title LIKE '%脱サラ%キッチンカー%最初の半年%地獄%';

    -- D-2: キッチンカーで月商80万円を超えるまでにやったこと → だいき
    UPDATE articles SET author_profile_id = daiki_id WHERE title LIKE '%キッチンカー%月商80万%';

    -- Y-1: 自宅エステサロンを開業して3ヶ月で撤退した話 → ゆか
    UPDATE articles SET author_profile_id = yuka_id WHERE title LIKE '%自宅エステサロン%開業%3ヶ月%撤退%';

    -- Y-2: エステ業界の裏側｜店長やってた私が見た高額商材の押し売り構造 → ゆか
    UPDATE articles SET author_profile_id = yuka_id WHERE title LIKE '%エステ業界%裏側%高額商材%押し売り%';

    -- K-2: 買取フランチャイズに200万払って1年で辞めた話 → こうた
    UPDATE articles SET author_profile_id = kouta_id WHERE title LIKE '%買取フランチャイズ%200万%辞めた%';

    -- ========================================
    -- アート・音楽・エンタメ（5本）
    -- ========================================

    -- KT-1: バンドマンが6年やって月収8万円だった現実 → けんた
    UPDATE articles SET author_profile_id = kenta_id WHERE title LIKE '%バンドマン%6年%月収8万%';

    -- KT-2: ライブハウスのノルマ制度は誰が儲かる仕組みなのか → けんた
    UPDATE articles SET author_profile_id = kenta_id WHERE title LIKE '%ライブハウス%ノルマ制度%儲かる%';

    -- KT-3: AI作曲で月10万円の不労所得を作った方法 → けんた
    UPDATE articles SET author_profile_id = kenta_id WHERE title LIKE '%AI作曲%月10万%不労所得%';

    -- SA-1: 手描きイラストレーターがAIを使い始めて炎上した話 → さや
    UPDATE articles SET author_profile_id = saya_id WHERE title LIKE '%手描きイラストレーター%AI%炎上%';

    -- SA-2: AI×手描きのハイブリッドで月15万円稼ぐイラストレーターの仕事術 → さや
    UPDATE articles SET author_profile_id = saya_id WHERE title LIKE '%AI%手描き%ハイブリッド%月15万%イラストレーター%';

    RAISE NOTICE 'Done!';
END $$;

-- ========================================
-- 確認用クエリ
-- ========================================
-- SELECT a.title, ap.display_name
-- FROM articles a
-- LEFT JOIN author_profiles ap ON a.author_profile_id = ap.id
-- ORDER BY a.created_at;
