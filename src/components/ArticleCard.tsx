'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, ImageIcon } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { Database } from '@/lib/database.types'

type Article = Database['public']['Tables']['articles']['Row'] & {
  users?: { display_name: string | null; email: string; avatar_url?: string | null }
  author_profile?: { id?: string; display_name: string; avatar_url?: string | null; bio?: string | null } | null
  primary_category?: { id: string; name: string; slug: string } | null
}

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return ''

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMinutes < 1) return '今'
  if (diffMinutes < 60) return `${diffMinutes}分前`
  if (diffHours < 24) return `${diffHours}時間前`
  if (diffDays < 30) return `${diffDays}日前`
  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

function authorLabel(article: Article) {
  const profileName = article.author_profile?.display_name?.trim()
  if (profileName) return profileName

  const name = article.users?.display_name?.trim()
  if (name) return name

  const email = article.users?.email?.trim()
  if (email) return email.split('@')[0]

  return '著者不明'
}

function getAffiliateLabel(article: Article): string | null {
  if (!article.affiliate_enabled || !article.affiliate_rate) return null

  const rate = article.affiliate_rate
  const target = article.affiliate_target === 'buyers' ? '購入者のみ' : '全員'

  return `紹介で${rate}%還元（${target}）`
}

interface ArticleCardProps {
  article: Article
  rank?: number
  hideTime?: boolean
  priority?: boolean
  skipDbQuery?: boolean
  variant?: 'dark' | 'light'
}

export default function ArticleCard({ article, rank, hideTime, priority, skipDbQuery, variant = 'dark' }: ArticleCardProps) {
  const isDark = variant === 'dark'
  const { user } = useAuth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseRef = useRef(createClient() as any)
  const supabase = supabaseRef.current
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [realFavoriteCount, setRealFavoriteCount] = useState(0)
  const [anonLikeCount, setAnonLikeCount] = useState(0)
  const [hasAnonLiked, setHasAnonLiked] = useState(false)
  const [imageError, setImageError] = useState(false)

  const label = authorLabel(article)
  const avatarUrl = article.author_profile?.avatar_url || article.users?.avatar_url
  const affiliateLabel = getAffiliateLabel(article)
  const timeAgo = formatTimeAgo(article.published_at || article.created_at)

  const fakeFavoriteCount = (article as Record<string, unknown>).fake_favorite_count as number || 0
  // サーバーサイドで取得済みのお気に入り数があれば使用
  const prefetchedFavoriteCount = (article as Record<string, unknown>).real_favorite_count as number | undefined
  const totalFavoriteCount = fakeFavoriteCount + (prefetchedFavoriteCount ?? realFavoriteCount) + anonLikeCount

  useEffect(() => {
    const loadFavoriteCount = async () => {
      // サーバーサイドで取得済みの場合、またはskipDbQueryの場合はクエリをスキップ
      const hasPrefetchedCount = (article as Record<string, unknown>).real_favorite_count !== undefined
      if (!skipDbQuery && !hasPrefetchedCount) {
        const { count } = await supabase
          .from('article_favorites')
          .select('*', { count: 'exact', head: true })
          .eq('article_id', article.id)
        setRealFavoriteCount(count || 0)
      }

      if (typeof window !== 'undefined') {
        const anonLikes = JSON.parse(localStorage.getItem('anon_likes') || '{}')
        setAnonLikeCount(anonLikes[`count_${article.id}`] || 0)

        const likedArticles = JSON.parse(localStorage.getItem('liked_articles') || '[]')
        setHasAnonLiked(likedArticles.includes(article.id))
      }
    }

    loadFavoriteCount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article.id, skipDbQuery, article])

  useEffect(() => {
    if (!user || skipDbQuery) return

    const checkFavorite = async () => {
      const { data } = await supabase
        .from('article_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('article_id', article.id)
        .maybeSingle()

      setIsFavorite(!!data)
    }

    checkFavorite()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, article.id, skipDbQuery])

  const isLiked = user ? isFavorite : hasAnonLiked

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (favoriteLoading) return

    if (user) {
      setFavoriteLoading(true)

      if (isFavorite) {
        await supabase
          .from('article_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('article_id', article.id)
        setIsFavorite(false)
        setRealFavoriteCount(prev => Math.max(0, prev - 1))
      } else {
        await supabase
          .from('article_favorites')
          .insert({ user_id: user.id, article_id: article.id })
        setIsFavorite(true)
        setRealFavoriteCount(prev => prev + 1)
      }

      setFavoriteLoading(false)
      return
    }

    if (typeof window !== 'undefined') {
      const likedArticles = JSON.parse(localStorage.getItem('liked_articles') || '[]')

      if (hasAnonLiked) {
        const updated = likedArticles.filter((id: string) => id !== article.id)
        localStorage.setItem('liked_articles', JSON.stringify(updated))
        setHasAnonLiked(false)
        setAnonLikeCount(prev => Math.max(0, prev - 1))

        const anonLikes = JSON.parse(localStorage.getItem('anon_likes') || '{}')
        anonLikes[`count_${article.id}`] = Math.max(0, (anonLikes[`count_${article.id}`] || 0) - 1)
        localStorage.setItem('anon_likes', JSON.stringify(anonLikes))
      } else {
        likedArticles.push(article.id)
        localStorage.setItem('liked_articles', JSON.stringify(likedArticles))
        setHasAnonLiked(true)
        setAnonLikeCount(prev => prev + 1)

        const anonLikes = JSON.parse(localStorage.getItem('anon_likes') || '{}')
        anonLikes[`count_${article.id}`] = (anonLikes[`count_${article.id}`] || 0) + 1
        localStorage.setItem('anon_likes', JSON.stringify(anonLikes))
      }
    }
  }

  return (
    <div className={`rounded-lg overflow-hidden transition group ${
      isDark
        ? 'bg-gray-900 hover:bg-gray-800'
        : 'bg-white hover:bg-gray-50 border border-gray-200 shadow-sm'
    }`}>
      <Link href={`/articles/${article.slug}`} className="block">
        {/* Thumbnail */}
        <div className={`relative aspect-[1280/670] overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          {article.cover_image_url && !imageError ? (
            <Image
              src={article.cover_image_url}
              alt={article.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 256px"
              priority={priority}
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              <ImageIcon className="w-8 h-8" />
            </div>
          )}

          {rank && (
            <div className="absolute top-2 left-2 w-6 h-6 bg-emerald-500 text-white text-xs font-bold rounded flex items-center justify-center">
              {rank}
            </div>
          )}

          <div className="absolute bottom-2 right-2">
            {article.price > 0 ? (
              <span className="px-3 py-1 bg-emerald-500 text-white text-sm font-bold rounded-full">
                ¥{article.price.toLocaleString()}
              </span>
            ) : (
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                isDark ? 'bg-gray-800/90 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                無料
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-3 flex flex-col">
          <h3 className={`font-bold text-sm line-clamp-2 mb-2 min-h-[2.5rem] ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {article.title}
          </h3>

          {affiliateLabel && (
            <div className={`text-xs mb-2 px-2 py-1 rounded inline-block ${
              isDark ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-600 bg-emerald-50'
            }`}>
              {affiliateLabel}
            </div>
          )}

          <div className={`flex items-center justify-between text-xs mt-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <Link
              href={article.author_profile?.id ? `/authors/${article.author_profile.id}` : `/users/${article.author_id}`}
              onClick={(e) => e.stopPropagation()}
              className={`flex items-center gap-1.5 min-w-0 transition ${isDark ? 'hover:text-white' : 'hover:text-gray-900'}`}
            >
              <div className={`w-5 h-5 rounded-full overflow-hidden flex-shrink-0 relative ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                <Image
                  src={avatarUrl || '/noicon.png'}
                  alt={`${label}のアイコン`}
                  fill
                  sizes="20px"
                  className="object-cover"
                />
              </div>
              <span className="truncate">{label}</span>
            </Link>
            {!hideTime && <span className="flex-shrink-0">{timeAgo}</span>}
          </div>

          <div className="flex items-center mt-2">
            <button
              onClick={toggleFavorite}
              disabled={favoriteLoading}
              className="flex items-center gap-1 group/like"
              aria-label={isLiked ? 'いいねを取り消す' : 'いいねする'}
              aria-pressed={isLiked}
            >
              <Heart
                className={`w-4 h-4 transition ${
                  isLiked
                    ? 'text-red-500 fill-red-500'
                    : isDark
                      ? 'text-gray-400 group-hover/like:text-red-400'
                      : 'text-gray-400 group-hover/like:text-red-400'
                }`}
              />
              {totalFavoriteCount > 0 && (
                <span className={`text-xs ${isLiked ? 'text-red-500' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {totalFavoriteCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </Link>
    </div>
  )
}
