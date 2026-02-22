// src/components/editor/extensions/LinkPreview.tsx
import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { ExternalLink, X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export type OgpData = {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  favicon: string | null;
  url: string;
};

// OGPデータを取得
export async function fetchOgpData(url: string): Promise<OgpData | null> {
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
      console.warn('OGP fetch failed:', response.status);
      return null;
    }

    const data = await response.json();
    if (!data.success) {
      console.warn('OGP fetch error:', data.error);
      return null;
    }

    return data.data;
  } catch (error) {
    console.error('OGP fetch error:', error);
    return null;
  }
}

// URLかどうか判定（YouTube以外）
export function isPreviewableUrl(text: string): boolean {
  const trimmed = text.trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;
  // YouTubeは除外（専用のYouTubeEmbedで処理）
  if (/(?:youtube\.com|youtu\.be)/i.test(trimmed)) return false;
  return true;
}

// ノードビューコンポーネント
function LinkPreviewComponent({ node, deleteNode }: { node: any; deleteNode: () => void }) {
  const { url, title, description, image, siteName, favicon } = node.attrs;
  const [isLoading, setIsLoading] = useState(!title && !description && !image);
  const [ogpData, setOgpData] = useState<OgpData | null>(
    title || description || image
      ? { url, title, description, image, siteName, favicon }
      : null
  );
  const [error, setError] = useState(false);

  useEffect(() => {
    if (ogpData || !url) return;

    setIsLoading(true);
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
        setIsLoading(false);
      });
  }, [url, ogpData]);

  const displayUrl = (() => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  })();

  if (isLoading) {
    return (
      <NodeViewWrapper className="link-preview my-4">
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          <span className="text-sm text-gray-500">リンク情報を取得中...</span>
        </div>
      </NodeViewWrapper>
    );
  }

  if (error || !ogpData) {
    // エラー時はシンプルなリンク表示
    return (
      <NodeViewWrapper className="link-preview my-4">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2 text-blue-600">
            <ExternalLink className="w-4 h-4" />
            <span className="text-sm truncate">{url}</span>
          </div>
        </a>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="link-preview my-3 relative group">
      {/* 削除ボタン */}
      <button
        type="button"
        onClick={deleteNode}
        className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-300 opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <X className="w-3 h-3" />
      </button>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors bg-white"
      >
        <div className="flex">
          {/* 画像 */}
          {ogpData.image && (
            <div className="w-24 sm:w-32 flex-shrink-0 bg-gray-100">
              <img
                src={ogpData.image}
                alt={ogpData.title || ''}
                className="w-full h-full object-cover"
                style={{ minHeight: '72px', maxHeight: '80px' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* テキスト情報 */}
          <div className="flex-1 px-3 py-2 min-w-0 flex flex-col justify-center">
            {ogpData.title && (
              <h3 className="text-xs font-medium text-gray-900 line-clamp-1 mb-0.5">
                {ogpData.title}
              </h3>
            )}
            {ogpData.description && (
              <p className="text-[10px] text-gray-500 line-clamp-1 mb-1">
                {ogpData.description}
              </p>
            )}
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              {ogpData.favicon && (
                <img
                  src={ogpData.favicon}
                  alt=""
                  className="w-3 h-3"
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
    </NodeViewWrapper>
  );
}

// TipTap拡張
const LinkPreview = Node.create({
  name: 'linkPreview',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      url: { default: null },
      title: { default: null },
      description: { default: null },
      image: { default: null },
      siteName: { default: null },
      favicon: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-link-preview]',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          return {
            url: element.getAttribute('data-url'),
            title: element.getAttribute('data-title'),
            description: element.getAttribute('data-description'),
            image: element.getAttribute('data-image'),
            siteName: element.getAttribute('data-site-name'),
            favicon: element.getAttribute('data-favicon'),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // OGPデータがある場合はカード形式で保存
    const { url, title, description, image, siteName, favicon } = HTMLAttributes;

    return [
      'div',
      mergeAttributes({
        'data-link-preview': '',
        'data-url': url,
        'data-title': title || '',
        'data-description': description || '',
        'data-image': image || '',
        'data-site-name': siteName || '',
        'data-favicon': favicon || '',
        class: 'link-preview-card',
      }),
      [
        'a',
        {
          href: url,
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'link-preview-link',
        },
        [
          'div',
          { class: 'link-preview-content' },
          image ? ['img', { src: image, alt: title || '', class: 'link-preview-image' }] : '',
          [
            'div',
            { class: 'link-preview-text' },
            title ? ['div', { class: 'link-preview-title' }, title] : '',
            description ? ['div', { class: 'link-preview-description' }, description] : '',
            ['div', { class: 'link-preview-domain' }, siteName || new URL(url).hostname],
          ],
        ],
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LinkPreviewComponent);
  },
});

export default LinkPreview;
