'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import DOMPurify from 'dompurify'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import ArticleCard from '@/components/ArticleCard'
import type { Database } from '@/lib/database.types'
import { Lock, ShoppingCart, Loader2, Share2, Heart, Home, ChevronRight } from 'lucide-react'

// XSS対策: HTMLコンテンツをサニタイズ
const sanitizeHtml = (html: string): string => {
  if (typeof window === 'undefined') return html
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'a', 'strong', 'em', 'b', 'i', 'u', 's',
      'img', 'figure', 'figcaption',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  })
}

type Article = Database['public']['Tables']['articles']['Row'] & {
  users?: { display_name: string | null; email: string; avatar_url?: string | null; bio?: string | null }
  author_profile?: { id?: string; display_name: string; avatar_url?: string | null; bio?: string | null } | null
  primary_category?: { id: string; name: string; slug: string } | null
}

interface ArticleDetailClientProps {
  article: Article
  relatedArticles: Article[]
}

function getAuthorInfo(article: Article) {
  if (article.author_profile) {
    return {
      display_name: article.author_profile.display_name,
      avatar_url: article.author_profile.avatar_url || null,
      bio: article.author_profile.bio || null,
      id: article.author_profile.id,
      link: `/authors/${article.author_profile.id}`,
    }
  }
  return {
    display_name: article.users?.display_name || article.users?.email?.split('@')[0] || '匿名',
    avatar_url: article.users?.avatar_url || null,
    bio: article.users && 'bio' in article.users ? article.users.bio : null,
    id: article.author_id,
    link: `/users/${article.author_id}`,
  }
}

export default function ArticleDetailClient({ article, relatedArticles }: ArticleDetailClientProps) {
  const { user } = useAuth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseRef = useRef(createClient() as any)
  const supabase = supabaseRef.current
  const [hasAccess, setHasAccess] = useState(article.price === 0)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(article.fake_favorite_count || 0)
  const [purchasing, setPurchasing] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)

  const authorInfo = getAuthorInfo(article)
  const isPaid = article.price > 0

  // アクセス権確認
  useEffect(() => {
    const checkAccess = async () => {
      if (!user || article.price === 0) {
        setHasAccess(article.price === 0)
        setCheckingAccess(false)
        return
      }

      // 著者本人か確認
      if (user.id === article.author_id) {
        setHasAccess(true)
        setCheckingAccess(false)
        return
      }

      // 購入済みか確認
      const { data } = await supabase
        .from('orders')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('article_id', article.id)
        .eq('status', 'paid')
        .maybeSingle()

      setHasAccess(!!data)
      setCheckingAccess(false)
    }

    checkAccess()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, article.id, article.author_id, article.price])

  // いいね状態確認
  useEffect(() => {
    const checkLike = async () => {
      if (!user) return

      const { data } = await supabase
        .from('article_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('article_id', article.id)
        .maybeSingle()

      setIsLiked(!!data)
    }

    checkLike()

    // いいね数取得
    const fetchLikeCount = async () => {
      const { count } = await supabase
        .from('article_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', article.id)

      setLikeCount((article.fake_favorite_count || 0) + (count || 0))
    }

    fetchLikeCount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, article.id, article.fake_favorite_count])

  const toggleLike = async () => {
    if (!user) return

    if (isLiked) {
      await supabase
        .from('article_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('article_id', article.id)
      setIsLiked(false)
      setLikeCount(prev => Math.max(0, prev - 1))
    } else {
      await supabase
        .from('article_favorites')
        .insert({ user_id: user.id, article_id: article.id })
      setIsLiked(true)
      setLikeCount(prev => prev + 1)
    }
  }

  const handlePurchase = async () => {
    if (!user) {
      window.location.href = `/signin?redirect=/articles/${article.slug}`
      return
    }

    setPurchasing(true)

    // Stripe Checkout セッション作成
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        articleId: article.id,
        articleSlug: article.slug,
      }),
    })

    const data = await response.json()

    if (data.url) {
      window.location.href = data.url
    } else {
      toast.error('購入処理に失敗しました')
      setPurchasing(false)
    }
  }

  // コンテンツ分割
  const paidDelimiter = '<!-- paid -->'
  const { freeContent, paidContent } = useMemo(() => {
    let free = article.content
    let paid = ''

    if (isPaid && article.content.includes(paidDelimiter)) {
      const parts = article.content.split(paidDelimiter)
      free = parts[0]
      paid = parts.slice(1).join(paidDelimiter)
    }

    return {
      freeContent: sanitizeHtml(free),
      paidContent: sanitizeHtml(paid),
    }
  }, [article.content, isPaid])

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* パンくずリスト */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="flex items-center gap-1 hover:text-gray-700">
            <Home className="w-4 h-4" />
            <span>ホーム</span>
          </Link>
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
          {article.primary_category && (
            <>
              <Link href={`/articles?category=${article.primary_category.slug}`} className="hover:text-gray-700">
                {article.primary_category.name}
              </Link>
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            </>
          )}
          <span className="text-gray-700 truncate">{article.title}</span>
        </nav>

        {/* タイトル */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          {article.title}
        </h1>

        {/* 著者情報 */}
        <div className="flex items-center gap-4 mb-6">
          <Link href={authorInfo.link}>
            <Image
              src={authorInfo.avatar_url || '/noicon.png'}
              alt={authorInfo.display_name}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover"
              unoptimized={!!authorInfo.avatar_url}
            />
          </Link>
          <div>
            <Link href={authorInfo.link} className="font-medium text-gray-900 hover:underline">
              {authorInfo.display_name}
            </Link>
            <div className="text-sm text-gray-500">
              {article.published_at && new Date(article.published_at).toLocaleDateString('ja-JP')}
            </div>
          </div>
        </div>

        {/* アイキャッチ画像 */}
        {article.thumbnail_url && (
          <div className="mb-8 relative aspect-video">
            <Image
              src={article.thumbnail_url}
              alt={article.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="rounded-2xl object-cover"
              priority
            />
          </div>
        )}

        {/* 記事本文（無料部分） */}
        <div
          className="prose prose-lg max-w-none article-content mb-8"
          dangerouslySetInnerHTML={{ __html: freeContent }}
        />

        {/* 有料部分 */}
        {isPaid && (
          <>
            {hasAccess ? (
              // 購入済み or 著者本人
              <>
                {paidContent && (
                  <div
                    className="prose prose-lg max-w-none article-content"
                    dangerouslySetInnerHTML={{ __html: paidContent }}
                  />
                )}
              </>
            ) : checkingAccess ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : (
              // 未購入
              <div className="bg-gradient-to-b from-transparent via-white to-white pt-20 -mt-20 relative">
                <div className="bg-gray-100 rounded-2xl p-8 text-center">
                  <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    この先は有料コンテンツです
                  </h3>
                  <p className="text-gray-600 mb-6">
                    続きを読むには記事を購入してください
                  </p>
                  <div className="text-3xl font-bold text-emerald-600 mb-6">
                    ¥{article.price.toLocaleString()}
                  </div>
                  <button
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 text-white font-bold rounded-full hover:bg-emerald-600 transition disabled:opacity-50"
                  >
                    {purchasing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ShoppingCart className="w-5 h-5" />
                    )}
                    {purchasing ? '処理中...' : '購入する'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* アクションボタン */}
        <div className="flex items-center gap-4 mt-8 pt-8 border-t border-gray-200">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition ${
              isLiked
                ? 'bg-red-50 text-red-500'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span>{likeCount}</span>
          </button>

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: article.title,
                  url: window.location.href,
                })
              } else {
                navigator.clipboard.writeText(window.location.href)
                toast.success('URLをコピーしました')
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition"
          >
            <Share2 className="w-5 h-5" />
            <span>シェア</span>
          </button>
        </div>

        {/* 関連記事 */}
        {relatedArticles.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6">関連記事</h2>
            <div className="grid grid-cols-2 gap-4">
              {relatedArticles.map((relatedArticle) => (
                <ArticleCard key={relatedArticle.id} article={relatedArticle} skipDbQuery variant="light" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
