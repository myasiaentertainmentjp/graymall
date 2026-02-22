import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OGPメタタグを解析
function extractOgpData(html: string, url: string) {
  const result: {
    title: string | null;
    description: string | null;
    image: string | null;
    siteName: string | null;
    favicon: string | null;
    url: string;
  } = {
    title: null,
    description: null,
    image: null,
    siteName: null,
    favicon: null,
    url: url,
  };

  // og:title
  const ogTitleMatch = html.match(/<meta\s+[^>]*(?:property|name)=["']og:title["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']og:title["']/i);
  if (ogTitleMatch) result.title = ogTitleMatch[1];

  // og:description
  const ogDescMatch = html.match(/<meta\s+[^>]*(?:property|name)=["']og:description["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']og:description["']/i);
  if (ogDescMatch) result.description = ogDescMatch[1];

  // og:image
  const ogImageMatch = html.match(/<meta\s+[^>]*(?:property|name)=["']og:image["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']og:image["']/i);
  if (ogImageMatch) result.image = ogImageMatch[1];

  // og:site_name
  const ogSiteNameMatch = html.match(/<meta\s+[^>]*(?:property|name)=["']og:site_name["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']og:site_name["']/i);
  if (ogSiteNameMatch) result.siteName = ogSiteNameMatch[1];

  // フォールバック: titleタグ
  if (!result.title) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) result.title = titleMatch[1].trim();
  }

  // フォールバック: meta description
  if (!result.description) {
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)
      || html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
    if (descMatch) result.description = descMatch[1];
  }

  // favicon
  const faviconMatch = html.match(/<link\s+[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i)
    || html.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i);
  if (faviconMatch) {
    let faviconUrl = faviconMatch[1];
    // 相対URLを絶対URLに変換
    if (faviconUrl.startsWith('//')) {
      faviconUrl = 'https:' + faviconUrl;
    } else if (faviconUrl.startsWith('/')) {
      const urlObj = new URL(url);
      faviconUrl = urlObj.origin + faviconUrl;
    } else if (!faviconUrl.startsWith('http')) {
      const urlObj = new URL(url);
      faviconUrl = urlObj.origin + '/' + faviconUrl;
    }
    result.favicon = faviconUrl;
  }

  // 画像URLを絶対URLに変換
  if (result.image) {
    if (result.image.startsWith('//')) {
      result.image = 'https:' + result.image;
    } else if (result.image.startsWith('/')) {
      const urlObj = new URL(url);
      result.image = urlObj.origin + result.image;
    }
  }

  // HTMLエンティティをデコード
  if (result.title) {
    result.title = decodeHtmlEntities(result.title);
  }
  if (result.description) {
    result.description = decodeHtmlEntities(result.description);
  }

  return result;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ');
}

serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // URLの検証
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // HTTPSのみ許可
    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Only HTTP/HTTPS URLs are allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // HTMLを取得
    const response = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OGPFetcher/1.0; +https://graymall.jp)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `Failed to fetch URL: ${response.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL does not return HTML content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();
    const ogpData = extractOgpData(html, response.url || url);

    return new Response(
      JSON.stringify({ success: true, data: ogpData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching OGP:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
