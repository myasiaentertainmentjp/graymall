// src/components/SkeletonCard.tsx
export default function SkeletonCard() {
  return (
    <div className="animate-pulse">
      {/* サムネイル */}
      <div className="aspect-[4/3] bg-gray-200 rounded-lg mb-3" />
      {/* タイトル */}
      <div className="h-4 bg-gray-200 rounded mb-2" />
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
      {/* 著者・日付 */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-gray-200 rounded-full" />
        <div className="h-3 bg-gray-200 rounded w-20" />
      </div>
    </div>
  );
}

export function SkeletonRow({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-48 sm:w-56 lg:w-64">
          <SkeletonCard />
        </div>
      ))}
    </div>
  );
}

// 記事詳細ページ用スケルトン
export function SkeletonArticleDetail() {
  return (
    <div className="animate-pulse">
      {/* パンくずリスト */}
      <div className="h-4 bg-gray-200 rounded w-48 mb-6" />

      {/* タイトル */}
      <div className="h-8 bg-gray-200 rounded w-full mb-2" />
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-6" />

      {/* メタ情報 */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-3 bg-gray-200 rounded w-32" />
        </div>
      </div>

      {/* アイキャッチ画像 */}
      <div className="aspect-[16/9] bg-gray-200 rounded-2xl mb-8" />

      {/* 本文 */}
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-4/5" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>
    </div>
  );
}
