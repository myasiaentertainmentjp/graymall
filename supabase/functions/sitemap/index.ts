import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SITE_URL = 'https://graymall.jp';

serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 公開済み記事を取得
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (articlesError) {
      console.error('Articles fetch error:', articlesError);
    }

    // カテゴリを取得
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('slug, updated_at');

    if (categoriesError) {
      console.error('Categories fetch error:', categoriesError);
    }

    // 現在の日時
    const now = new Date().toISOString();

    // XMLを生成
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // 静的ページ
    const staticPages = [
      { loc: '/', priority: '1.0', changefreq: 'daily' },
      { loc: '/articles', priority: '0.9', changefreq: 'daily' },
      { loc: '/terms', priority: '0.3', changefreq: 'monthly' },
      { loc: '/privacy', priority: '0.3', changefreq: 'monthly' },
      { loc: '/legal', priority: '0.3', changefreq: 'monthly' },
      { loc: '/contact', priority: '0.3', changefreq: 'monthly' },
      { loc: '/affiliate-guide', priority: '0.5', changefreq: 'monthly' },
    ];

    for (const page of staticPages) {
      xml += '  <url>\n';
      xml += `    <loc>${SITE_URL}${page.loc}</loc>\n`;
      xml += `    <lastmod>${now.split('T')[0]}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    }

    // カテゴリページ
    if (categories) {
      for (const category of categories) {
        xml += '  <url>\n';
        xml += `    <loc>${SITE_URL}/category/${category.slug}</loc>\n`;
        xml += `    <lastmod>${category.updated_at?.split('T')[0] || now.split('T')[0]}</lastmod>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.7</priority>\n';
        xml += '  </url>\n';
      }
    }

    // 記事ページ
    if (articles) {
      for (const article of articles) {
        const lastmod = article.updated_at || article.published_at || now;
        xml += '  <url>\n';
        xml += `    <loc>${SITE_URL}/articles/${article.slug}</loc>\n`;
        xml += `    <lastmod>${lastmod.split('T')[0]}</lastmod>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.8</priority>\n';
        xml += '  </url>\n';
      }
    }

    xml += '</urlset>';

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // 1時間キャッシュ
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
});
