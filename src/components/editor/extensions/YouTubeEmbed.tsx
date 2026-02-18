// src/components/editor/extensions/YouTubeEmbed.tsx
import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';

// YouTube URL からビデオIDを抽出
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// YouTube URLかどうか判定
export function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/.test(url);
}

// ノードビューコンポーネント
function YouTubeComponent({ node }: { node: any }) {
  const { videoId } = node.attrs;

  return (
    <NodeViewWrapper className="youtube-embed my-4">
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </NodeViewWrapper>
  );
}

// TipTap拡張
const YouTubeEmbed = Node.create({
  name: 'youtubeEmbed',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      videoId: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-youtube-embed]',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          return {
            videoId: element.getAttribute('data-video-id'),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-youtube-embed': '',
        'data-video-id': HTMLAttributes.videoId,
        class: 'youtube-embed',
      }),
      [
        'iframe',
        {
          src: `https://www.youtube.com/embed/${HTMLAttributes.videoId}`,
          frameborder: '0',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          allowfullscreen: 'true',
          style: 'width: 100%; aspect-ratio: 16/9; border-radius: 8px;',
        },
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(YouTubeComponent);
  },
});

export default YouTubeEmbed;
