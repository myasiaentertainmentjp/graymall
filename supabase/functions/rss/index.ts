import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SITE_URL = 'https://graymall.jp';
const SITE_TITLE = 'グレーモール';
const SITE_DESCRIPTION = 'グレーモールは、個人の体験談やノウハウを販売・購入できるデジタルコンテンツマーケットプレイスです。';

// HTMLエンティティをエスケープ
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// HTMLタグを除去
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 最新20件の公開済み記事を取得
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select(`
        id,
        title,
        slug,
        excerpt,
        cover_image_url,
        published_at,
        author_id,
        users:author_id (display_name, email)
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(20);

    if (articlesError) {
      console.error('Articles fetch error:', articlesError);
      throw articlesError;
    }

    const now = new Date().toUTCString();

    // RSS 2.0 XMLを生成
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">\n';
    xml += '  <channel>\n';
    xml += `    <title>${escapeXml(SITE_TITLE)}</title>\n`;
    xml += `    <link>${SITE_URL}</link>\n`;
    xml += `    <description>${escapeXml(SITE_DESCRIPTION)}</description>\n`;
    xml += '    <language>ja</language>\n';
    xml += `    <lastBuildDate>${now}</lastBuildDate>\n`;
    xml += `    <atom:link href="${SITE_URL}/rss" rel="self" type="application/rss+xml"/>\n`;
    xml += `    <image>\n`;
    xml += `      <url>${SITE_URL}/logo.png</url>\n`;
    xml += `      <title>${escapeXml(SITE_TITLE)}</title>\n`;
    xml += `      <link>${SITE_URL}</link>\n`;
    xml += `    </image>\n`;

    if (articles) {
      for (const article of articles) {
        const articleUrl = `${SITE_URL}/articles/${article.slug}`;
        const pubDate = article.published_at
          ? new Date(article.published_at).toUTCString()
          : now;
        const authorName = (article.users as any)?.display_name ||
          (article.users as any)?.email?.split('@')[0] ||
          '匿名';

        xml += '    <item>\n';
        xml += `      <title>${escapeXml(article.title)}</title>\n`;
        xml += `      <link>${articleUrl}</link>\n`;
        xml += `      <guid isPermaLink="true">${articleUrl}</guid>\n`;
        xml += `      <pubDate>${pubDate}</pubDate>\n`;
        xml += `      <author>${escapeXml(authorName)}</author>\n`;

        if (article.excerpt) {
          const description = stripHtml(article.excerpt).slice(0, 300);
          xml += `      <description>${escapeXml(description)}</description>\n`;
        }

        if (article.cover_image_url) {
          xml += `      <media:content url="${escapeXml(article.cover_image_url)}" medium="image"/>\n`;
          xml += `      <enclosure url="${escapeXml(article.cover_image_url)}" type="image/jpeg"/>\n`;
        }

        xml += '    </item>\n';
      }
    }

    xml += '  </channel>\n';
    xml += '</rss>';

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800', // 30分キャッシュ
      },
    });
  } catch (error) {
    console.error('RSS generation error:', error);
    return new Response('Error generating RSS feed', { status: 500 });
  }
});
