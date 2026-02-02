// src/components/ArticleCard.tsx
import { Link, useNavigate } from 'react-router-dom';
import type { Database } from '../lib/database.types';
import { Heart, ImageIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Article = Database['public']['Tables']['articles']['Row'] & {
  users?: { display_name: string | null; email: string; avatar_url?: string | null };
  primary_category?: { id: string; name: string; slug: string } | null;
};

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return '今';
  if (diffMinutes < 60) return `${diffMinutes}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 30) return `${diffDays}日前`;
  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

function authorLabel(article: Article) {
  const name = article.users?.display_name?.trim();
  if (name) return name;

  const email = article.users?.email?.trim();
  if (email) return email.split('@')[0];

  return '著者不明';
}

function authorInitial(label: string) {
  return (label[0] || 'U').toUpperCase();
}

function getAffiliateLabel(article: Article): string | null {
  if (!article.affiliate_enabled || !article.affiliate_rate) return null;

  const rate = article.affiliate_rate;
  const target = article.affiliate_target === 'buyers' ? '購入者のみ' : '全員';

  return `紹介で${rate}%還元（${target}）`;
}

// カテゴリごとの背景色
const CATEGORY_COLORS: Record<string, string> = {
  'sns-media': 'bg-blue-100 text-blue-700',
  'ai-technology': 'bg-indigo-100 text-indigo-700',
  'resale-reuse': 'bg-green-100 text-green-700',
  'dating-romance': 'bg-pink-100 text-pink-700',
  'nightwork-adult': 'bg-red-100 text-red-700',
  'fortune-spiritual': 'bg-purple-100 text-purple-700',
  'money-tax-economy': 'bg-yellow-100 text-yellow-700',
  'store-field-business': 'bg-orange-100 text-orange-700',
  'art-music-entertainment': 'bg-rose-100 text-rose-700',
  'free-board': 'bg-gray-100 text-gray-700',
  'knowledge-discovery-news': 'bg-teal-100 text-teal-700',
};

function getCategoryColor(slug: string | undefined): string {
  if (!slug) return 'bg-gray-100 text-gray-600';
  return CATEGORY_COLORS[slug] || 'bg-gray-100 text-gray-600';
}

interface ArticleCardProps {
  article: Article;
  rank?: number; // Optional ranking number
  hideTime?: boolean; // Hide time display
}

export default function ArticleCard({ article, rank, hideTime }: ArticleCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [realFavoriteCount, setRealFavoriteCount] = useState(0);
  const [anonLikeCount, setAnonLikeCount] = useState(0);
  const [hasAnonLiked, setHasAnonLiked] = useState(false);

  const label = authorLabel(article);
  const avatarUrl = article.users?.avatar_url;
  const affiliateLabel = getAffiliateLabel(article);
  const timeAgo = formatTimeAgo(article.published_at || article.created_at);

  // Total favorite count = fake + real + anon
  const fakeFavoriteCount = (article as any).fake_favorite_count || 0;
  const totalFavoriteCount = fakeFavoriteCount + realFavoriteCount + anonLikeCount;

  // Load real favorite count (for all users)
  useEffect(() => {
    const loadFavoriteCount = async () => {
      const { count } = await supabase
        .from('article_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', article.id);

      setRealFavoriteCount(count || 0);

      // 匿名いいね数
      const anonLikes = JSON.parse(localStorage.getItem('anon_likes') || '{}');
      setAnonLikeCount(anonLikes[`count_${article.id}`] || 0);

      // 自分が匿名いいね済みか
      const likedArticles = JSON.parse(localStorage.getItem('liked_articles') || '[]');
      setHasAnonLiked(likedArticles.includes(article.id));
    };

    loadFavoriteCount();
  }, [article.id]);

  // Check if favorited (for logged-in user)
  useEffect(() => {
    if (!user) return;

    const checkFavorite = async () => {
      const { data } = await supabase
        .from('article_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('article_id', article.id)
        .maybeSingle();

      setIsFavorite(!!data);
    };

    checkFavorite();
  }, [user, article.id]);

  // いいね済み判定（会員 or 非会員）
  const isLiked = user ? isFavorite : hasAnonLiked;

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (favoriteLoading) return;

    // ===== 会員の場合 =====
    if (user) {
      setFavoriteLoading(true);

      if (isFavorite) {
        await supabase
          .from('article_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('article_id', article.id);
        setIsFavorite(false);
        setRealFavoriteCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase
          .from('article_favorites')
          .insert({ user_id: user.id, article_id: article.id });
        setIsFavorite(true);
        setRealFavoriteCount(prev => prev + 1);
      }

      setFavoriteLoading(false);
      return;
    }

    // ===== 非会員の場合（localStorage） =====
    const likedArticles = JSON.parse(localStorage.getItem('liked_articles') || '[]');

    if (hasAnonLiked) {
      // いいね解除
      const updated = likedArticles.filter((id: string) => id !== article.id);
      localStorage.setItem('liked_articles', JSON.stringify(updated));
      setHasAnonLiked(false);
      setAnonLikeCount(prev => Math.max(0, prev - 1));

      const anonLikes = JSON.parse(localStorage.getItem('anon_likes') || '{}');
      anonLikes[`count_${article.id}`] = Math.max(0, (anonLikes[`count_${article.id}`] || 0) - 1);
      localStorage.setItem('anon_likes', JSON.stringify(anonLikes));
    } else {
      // いいね追加
      likedArticles.push(article.id);
      localStorage.setItem('liked_articles', JSON.stringify(likedArticles));
      setHasAnonLiked(true);
      setAnonLikeCount(prev => prev + 1);

      const anonLikes = JSON.parse(localStorage.getItem('anon_likes') || '{}');
      anonLikes[`count_${article.id}`] = (anonLikes[`count_${article.id}`] || 0) + 1;
      localStorage.setItem('anon_likes', JSON.stringify(anonLikes));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-md dark:hover:shadow-gray-900/50 transition group">
      <Link to={`/articles/${article.slug}`} className="block">
        {/* Thumbnail */}
        <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden">
          {article.cover_image_url ? (
            <img
              src={article.cover_image_url}
              alt={article.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <ImageIcon className="w-8 h-8" />
            </div>
          )}

          {/* Rank badge */}
          {rank && (
            <div className="absolute top-2 left-2 w-6 h-6 bg-gray-900 text-white text-xs font-bold rounded flex items-center justify-center">
              {rank}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          {/* Title */}
          <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 mb-2 min-h-[2.5rem]">
            {article.title}
          </h3>

          {/* Price - only show for paid articles */}
          {article.price > 0 && (
            <div className="text-sm font-semibold text-emerald-600 mb-2">
              ¥{article.price.toLocaleString()}
            </div>
          )}

          {/* Affiliate info - only show when affiliate is enabled */}
          {affiliateLabel && (
            <div className="text-xs text-gray-500 mb-2 px-2 py-1 bg-gray-50 rounded inline-block">
              {affiliateLabel}
            </div>
          )}

          {/* Author & time */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
            <Link
              to={`/users/${article.author_id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 min-w-0 hover:text-gray-900 transition"
            >
              <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-medium text-gray-500">
                    {authorInitial(label)}
                  </div>
                )}
              </div>
              <span className="truncate">{label}</span>
            </Link>
            {!hideTime && <span className="flex-shrink-0">{timeAgo}</span>}
          </div>

          {/* Like button - note style */}
          <div className="flex items-center">
            <button
              onClick={toggleFavorite}
              disabled={favoriteLoading}
              className="flex items-center gap-1 group/like"
            >
              <Heart
                className={`w-4 h-4 transition ${
                  isLiked
                    ? 'text-red-500 fill-red-500'
                    : 'text-gray-400 group-hover/like:text-red-400'
                }`}
              />
              {totalFavoriteCount > 0 && (
                <span className={`text-xs ${isLiked ? 'text-red-500' : 'text-gray-500'}`}>
                  {totalFavoriteCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}
