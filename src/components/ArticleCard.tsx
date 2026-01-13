// src/components/ArticleCard.tsx
import { Link } from 'react-router-dom';
import type { Database } from '../lib/database.types';
import { Heart, ImageIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Article = Database['public']['Tables']['articles']['Row'] & {
  users?: { display_name: string | null; email: string; avatar_url?: string | null };
  primary_category?: { id: string; name: string; slug: string } | null;
  sub_category?: { id: string; name: string; slug: string } | null;
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
  'general-business': 'bg-blue-100 text-blue-700',
  'side-business': 'bg-green-100 text-green-700',
  'investment': 'bg-yellow-100 text-yellow-700',
  'lifestyle': 'bg-pink-100 text-pink-700',
  'career': 'bg-purple-100 text-purple-700',
  'health': 'bg-red-100 text-red-700',
  'technology': 'bg-indigo-100 text-indigo-700',
  'creative': 'bg-orange-100 text-orange-700',
};

function getCategoryColor(slug: string | undefined): string {
  if (!slug) return 'bg-gray-100 text-gray-600';
  return CATEGORY_COLORS[slug] || 'bg-gray-100 text-gray-600';
}

interface ArticleCardProps {
  article: Article;
  rank?: number; // Optional ranking number
}

export default function ArticleCard({ article, rank }: ArticleCardProps) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const label = authorLabel(article);
  const avatarUrl = article.users?.avatar_url;
  const categoryLabel = article.sub_category?.name || article.primary_category?.name || null;
  const affiliateLabel = getAffiliateLabel(article);
  const timeAgo = formatTimeAgo(article.published_at || article.created_at);

  // Check if favorited
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

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || favoriteLoading) return;

    setFavoriteLoading(true);

    if (isFavorite) {
      await supabase
        .from('article_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('article_id', article.id);
      setIsFavorite(false);
    } else {
      await supabase
        .from('article_favorites')
        .insert({ user_id: user.id, article_id: article.id });
      setIsFavorite(true);
    }

    setFavoriteLoading(false);
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden hover:shadow-md transition group">
      <Link to={`/articles/${article.slug}`} className="block">
        {/* Thumbnail */}
        <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden">
          {article.cover_image_url ? (
            <img
              src={article.cover_image_url}
              alt={article.title}
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

          {/* Favorite button */}
          {user && (
            <button
              onClick={toggleFavorite}
              className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition ${
                isFavorite
                  ? 'bg-red-500 text-white'
                  : 'bg-white/80 text-gray-600 hover:bg-white'
              }`}
              disabled={favoriteLoading}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          {/* Title */}
          <h3 className="font-bold text-sm text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem]">
            {article.title}
          </h3>

          {/* Category */}
          {article.primary_category && (
            <div className="mb-2">
              <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${getCategoryColor(article.primary_category.slug)}`}>
                {article.primary_category.name}
              </span>
            </div>
          )}

          {/* Price */}
          <div className="text-base font-bold text-gray-900 mb-1">
            {article.price > 0 ? `¥${article.price.toLocaleString()}` : '無料'}
          </div>

          {/* Affiliate info - only show when affiliate is enabled */}
          {affiliateLabel && (
            <div className="text-xs text-gray-500 mb-2 px-2 py-1 bg-gray-50 rounded inline-block">
              {affiliateLabel}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-gray-100 my-2"></div>

          {/* Author & time */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <Link
              to={`/users/${article.author_id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 min-w-0 hover:text-gray-900 transition"
            >
              <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-medium text-gray-500">
                    {authorInitial(label)}
                  </div>
                )}
              </div>
              <span className="truncate">{label}</span>
            </Link>
            <span className="flex-shrink-0">{timeAgo}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
