// supabase/functions/increment-fake-likes/index.ts
// 週1回実行して、fake_favorite_countを自動増加させるバッチ処理

import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 記事タイプごとの設定
const TYPE_CONFIG = {
  A: { minIncrement: 2, maxIncrement: 4, maxLikes: 60, skipChance: 0 },
  B: { minIncrement: 1, maxIncrement: 2, maxLikes: 35, skipChance: 0.15 },
  C: { minIncrement: 0, maxIncrement: 1, maxLikes: 15, skipChance: 0.4 },
};

// タイプA（人気記事）
const TYPE_A_ARTICLES = [
  '1f6bc711-2522-4007-be33-bc75a1e80481', // 夜の街編
  'c798663c-45da-4488-834c-aaaa777a8d43', // インプレゾンビ
  'c0c2e248-e1f3-4373-9c3e-5089e92df997', // 収支公開
  '498dd489-8991-4d04-bf28-496564a5f29c', // 偽ブランド
  'f7cf922d-7fd0-4e37-b7dd-b773e469fe5e', // 治験バイト
];

// タイプB（普通記事）
const TYPE_B_ARTICLES = [
  'e6adf38d-6d55-45bc-aa4b-abab55c38e88', // パワーストーン
  '80ee6e13-bde9-4bf3-ac12-fe46d3efe957', // 恋愛編
  '420a7713-9c6c-48cb-85e7-915a9938e915', // SNSコンサル
  'ad82ac81-615c-4d29-8360-5c05ada5065c', // 宝くじ
  '564e6a5c-9c35-4ebc-9e6b-b772ccd1c523', // せどり
  'bcf9af78-3423-4437-83e6-616bed49f1b7', // 代理出席
];

// タイプC（ニッチ記事）
const TYPE_C_ARTICLES = [
  '413b066d-4405-458f-93cb-7ff1c40c3abe', // シェアハウス編
  '7b75f8f9-3b8f-4b45-8b99-91523e73ab84', // ファーム編
  '211cf6de-ba9a-4fc2-8ee2-68f84a9019a0', // ジャパレス編
  'cea3a534-4d75-4d7a-bc50-e270a41fcb6a', // モニター
  '8adc67ec-265f-4a1b-a3c4-d4e2d0bea2db', // ゴルフ場
  'a17891e0-0e20-41b4-8bd3-612e2f6a5ae1', // 墓参り
  '0cea3e84-4674-44bc-9d28-832ca3a11088', // TikTokスピ・有料
  '214ee53d-b66c-498f-81da-7903e23361ea', // スピショート・高額
];

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getArticleType(articleId: string): 'A' | 'B' | 'C' | null {
  if (TYPE_A_ARTICLES.includes(articleId)) return 'A';
  if (TYPE_B_ARTICLES.includes(articleId)) return 'B';
  if (TYPE_C_ARTICLES.includes(articleId)) return 'C';
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 対象記事を取得
    const allArticleIds = [...TYPE_A_ARTICLES, ...TYPE_B_ARTICLES, ...TYPE_C_ARTICLES];

    const { data: articles, error: fetchError } = await supabase
      .from('articles')
      .select('id, fake_favorite_count')
      .in('id', allArticleIds);

    if (fetchError) {
      throw new Error(`Failed to fetch articles: ${fetchError.message}`);
    }

    const results: { articleId: string; type: string; oldCount: number; newCount: number; increment: number }[] = [];

    for (const article of articles || []) {
      const articleType = getArticleType(article.id);
      if (!articleType) continue;

      const config = TYPE_CONFIG[articleType];
      const currentCount = article.fake_favorite_count || 0;

      // 上限チェック
      if (currentCount >= config.maxLikes) {
        results.push({
          articleId: article.id,
          type: articleType,
          oldCount: currentCount,
          newCount: currentCount,
          increment: 0,
        });
        continue;
      }

      // タイプCは30%の確率でスキップ
      if (config.skipChance > 0 && Math.random() < config.skipChance) {
        results.push({
          articleId: article.id,
          type: articleType,
          oldCount: currentCount,
          newCount: currentCount,
          increment: 0,
        });
        continue;
      }

      // 増加数を計算
      let increment = getRandomInt(config.minIncrement, config.maxIncrement);

      // 上限を超えないように調整
      const newCount = Math.min(currentCount + increment, config.maxLikes);
      increment = newCount - currentCount;

      if (increment > 0) {
        const { error: updateError } = await supabase
          .from('articles')
          .update({ fake_favorite_count: newCount })
          .eq('id', article.id);

        if (updateError) {
          console.error(`Failed to update article ${article.id}:`, updateError);
        }
      }

      results.push({
        articleId: article.id,
        type: articleType,
        oldCount: currentCount,
        newCount,
        increment,
      });
    }

    const totalIncrement = results.reduce((sum, r) => sum + r.increment, 0);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} articles, total increment: ${totalIncrement}`,
        results,
        executedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
