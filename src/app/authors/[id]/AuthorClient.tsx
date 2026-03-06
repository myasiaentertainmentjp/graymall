'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { UserPlus, UserMinus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ArticleCard from '@/components/ArticleCard'
import type { Database } from '@/lib/database.types'

type Article = Database['public']['Tables']['articles']['Row'] & {
  users?: { display_name: string | null; email: string; avatar_url?: string | null }
  author_profile?: { id?: string; display_name: string; avatar_url?: string | null } | null
  primary_category?: { id: string; name: string; slug: string } | null
}

interface Author {
  id: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  type: 'user' | 'author_profile'
}

interface AuthorClientProps {
  author: Author
  articles: Article[]
  followerCount: number
  isFollowing: boolean
  currentUserId: string | null
}

export default function AuthorClient({
  author,
  articles,
  followerCount: initialFollowerCount,
  isFollowing: initialIsFollowing,
  currentUserId,
}: AuthorClientProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [followerCount, setFollowerCount] = useState(initialFollowerCount)
  const [loading, setLoading] = useState(false)

  const handleFollow = async () => {
    if (!currentUserId) {
      window.location.href = `/signin?redirect=/authors/${author.id}`
      return
    }

    if (currentUserId === author.id) {
      return // 自分自身はフォローできない
    }

    setLoading(true)

    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', author.id)
      setIsFollowing(false)
      setFollowerCount((prev) => Math.max(0, prev - 1))
    } else {
      await supabase
        .from('follows')
        .insert({ follower_id: currentUserId, following_id: author.id })
      setIsFollowing(true)
      setFollowerCount((prev) => prev + 1)
    }

    setLoading(false)
  }

  const isSelf = currentUserId === author.id

  return (
    <div className="min-h-screen bg-gray-950 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* プロフィールヘッダー */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-gray-700 overflow-hidden flex-shrink-0 relative">
              <Image
                src={author.avatar_url || '/noicon.png'}
                alt={author.display_name}
                fill
                className="object-cover"
                unoptimized={!!author.avatar_url}
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-white mb-2">
                {author.display_name}
              </h1>
              {author.bio && (
                <p className="text-gray-400 mb-4 whitespace-pre-wrap">
                  {author.bio}
                </p>
              )}
              <div className="flex items-center justify-center sm:justify-start gap-6 text-gray-400 mb-4">
                <div>
                  <span className="text-white font-bold">{articles.length}</span>
                  <span className="ml-1">記事</span>
                </div>
                <div>
                  <span className="text-white font-bold">{followerCount}</span>
                  <span className="ml-1">フォロワー</span>
                </div>
              </div>
              {!isSelf && (
                <button
                  onClick={handleFollow}
                  disabled={loading}
                  className={`flex items-center gap-2 px-6 py-2 rounded-full font-medium transition disabled:opacity-50 ${
                    isFollowing
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-emerald-500 text-white hover:bg-emerald-600'
                  }`}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isFollowing ? (
                    <UserMinus className="w-4 h-4" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  {isFollowing ? 'フォロー中' : 'フォロー'}
                </button>
              )}
              {isSelf && (
                <Link
                  href="/mypage/settings"
                  className="inline-block px-6 py-2 bg-gray-700 text-white rounded-full font-medium hover:bg-gray-600 transition"
                >
                  プロフィールを編集
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 記事一覧 */}
        <h2 className="text-xl font-bold text-white mb-4">投稿記事</h2>
        {articles.length === 0 ? (
          <div className="bg-gray-900 rounded-lg p-8 text-center">
            <p className="text-gray-400">投稿された記事はまだありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} skipDbQuery />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
