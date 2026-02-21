// src/components/LinkCardRenderer.tsx
import { useState, useEffect, useMemo } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';

type OgpData = {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  favicon: string | null;
  url: string;
};

// OGPデータをキャッシュ
const ogpCache = new Map<string, OgpData | null>();

// OGPデータを取得
async function fetchOgpData(url: string): Promise<OgpData | null> {
  // キャッシュをチェック
  if (ogpCache.has(url)) {
    return ogpCache.get(url) || null;
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-ogp`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ url }),
      }
    );

    if (!response.ok) {
      ogpCache.set(url, null);
      return null;
    }

    const data = await response.json();
    if (!data.success) {
      ogpCache.set(url, null);
      return null;
    }

    ogpCache.set(url, data.data);
    return data.data;
  } catch (error) {
    ogpCache.set(url, null);
    return null;
  }
}

// URLかどうか判定（YouTube以外）
function isPreviewableUrl(url: string): boolean {
  if (!/^https?:\/\//i.test(url)) return false;
  // YouTubeは除外（専用の埋め込みで処理される）
  if (/(?:youtube\.com|youtu\.be)/i.test(url)) return false;
  return true;
}

// リンクカードコンポーネント
function LinkCard({ url }: { url: string }) {
  const [ogpData, setOgpData] = useState<OgpData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchOgpData(url)
      .then((data) => {
        if (data) {
          setOgpData(data);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [url]);

  const displayUrl = useMemo(() => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }, [url]);

  if (loading) {
    return (
      <div className="link-preview-card my-4">
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          <span className="text-sm text-gray-500">リンク情報を取得中...</span>
        </div>
      </div>
    );
  }

  if (error || !ogpData) {
    // エラー時はシンプルなリンク表示
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="link-preview-card block my-4 border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2 text-blue-600">
          <ExternalLink className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm truncate">{url}</span>
        </div>
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="link-preview-card block my-4 border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors bg-white"
    >
      <div className="flex">
        {/* 画像 */}
        {ogpData.image && (
          <div className="w-32 sm:w-40 flex-shrink-0 bg-gray-100">
            <img
              src={ogpData.image}
              alt={ogpData.title || ''}
              className="w-full h-full object-cover"
              style={{ minHeight: '100px', maxHeight: '120px' }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* テキスト情報 */}
        <div className="flex-1 p-3 min-w-0">
          {ogpData.title && (
            <div className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
              {ogpData.title}
            </div>
          )}
          {ogpData.description && (
            <div className="text-xs text-gray-500 line-clamp-2 mb-2">
              {ogpData.description}
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {ogpData.favicon && (
              <img
                src={ogpData.favicon}
                alt=""
                className="w-4 h-4"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <span className="truncate">{ogpData.siteName || displayUrl}</span>
          </div>
        </div>
      </div>
    </a>
  );
}

// HTMLから単独行のURLを検出して置換
function extractStandaloneUrls(html: string): { html: string; urls: string[] } {
  const urls: string[] = [];

  // パターン1: <p><a href="url">url</a></p> - リンクテキストがURLと同じ
  // パターン2: <a href="url">url</a> が段落の唯一の要素
  const patterns = [
    // <p><a href="url">url</a></p>
    /<p>\s*<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>\s*<\/p>/gi,
    // 既存のlink-preview-card
    /<div[^>]*data-link-preview[^>]*data-url=["']([^"']+)["'][^>]*>[\s\S]*?<\/div>/gi,
  ];

  let result = html;

  // パターン1: pタグ内のリンクで、リンクテキストがURLと同じまたは似ている
  result = result.replace(
    /<p>\s*<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>\s*<\/p>/gi,
    (match, href, text) => {
      // リンクテキストがURLと同じか、URLの一部（短縮されている）場合のみ
      const isUrlText = text.trim().startsWith('http') ||
                        href.includes(text.trim()) ||
                        text.trim().includes('...');

      if (isUrlText && isPreviewableUrl(href)) {
        urls.push(href);
        return `<div data-link-card="${href}"></div>`;
      }
      return match;
    }
  );

  // 既存のlink-preview-cardも処理
  result = result.replace(
    /<div[^>]*data-link-preview[^>]*data-url=["']([^"']+)["'][^>]*>[\s\S]*?<\/div>/gi,
    (match, url) => {
      if (isPreviewableUrl(url)) {
        urls.push(url);
        return `<div data-link-card="${url}"></div>`;
      }
      return match;
    }
  );

  return { html: result, urls: [...new Set(urls)] };
}

// メインコンポーネント
export default function LinkCardRenderer({ html }: { html: string }) {
  const { html: processedHtml, urls } = useMemo(() => extractStandaloneUrls(html), [html]);

  if (urls.length === 0) {
    // URLがない場合はそのまま表示
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  }

  // URLがある場合、HTMLを分割してカードを挿入
  const parts = processedHtml.split(/<div data-link-card="([^"]+)"><\/div>/);

  return (
    <>
      {parts.map((part, index) => {
        // 偶数インデックスはHTML、奇数インデックスはURL
        if (index % 2 === 0) {
          return part ? <div key={index} dangerouslySetInnerHTML={{ __html: part }} /> : null;
        } else {
          return <LinkCard key={index} url={part} />;
        }
      })}
    </>
  );
}
