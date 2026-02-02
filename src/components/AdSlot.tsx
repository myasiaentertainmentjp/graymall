// src/components/AdSlot.tsx
// 広告枠コンポーネント - 将来的に広告タグに置換可能な設計

interface AdSlotProps {
  id: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
  altText?: string;
  /** 表示サイズ（px）。Retina対応のため、入稿推奨は表示サイズ×2 */
  size?: number;
}

/**
 * 広告枠コンポーネント
 *
 * 表示サイズ: 224×224px (w-56)
 * 入稿推奨サイズ: 448×448px (Retina対応で2倍)
 *
 * 画像は正方形でトリミング表示（object-fit: cover）
 */
export default function AdSlot({
  id,
  imageUrl,
  linkUrl,
  altText = '広告',
  size = 224
}: AdSlotProps) {
  const content = (
    <div
      className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={altText}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-gray-400 text-xs">広告枠</span>
      )}
    </div>
  );

  if (linkUrl) {
    return (
      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:opacity-90 transition"
        data-ad-slot={id}
      >
        {content}
      </a>
    );
  }

  return <div data-ad-slot={id}>{content}</div>;
}

/**
 * 運営向け注記:
 *
 * 広告画像の入稿推奨サイズ:
 * - 表示サイズ: 224×224px
 * - 入稿推奨: 448×448px（Retina対応）
 * - フォーマット: JPG, PNG, WebP
 * - 正方形でない画像は中央でトリミングされます
 *
 * 将来的にGoogle AdSense等の広告タグに置換する場合は、
 * このコンポーネントを差し替えてください。
 */
