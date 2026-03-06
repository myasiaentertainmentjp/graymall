'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { User, ShoppingBag, Heart, FileText, Settings, ChevronRight } from 'lucide-react'
import type { Database } from '@/lib/database.types'

type UserProfile = Database['public']['Tables']['users']['Row']
type Order = Database['public']['Tables']['orders']['Row'] & {
  articles: { id: string; title: string; slug: string; cover_image_url: string | null; price: number } | null
}
type Favorite = Database['public']['Tables']['article_favorites']['Row'] & {
  articles: {
    id: string
    title: string
    slug: string
    cover_image_url: string | null
    price: number
    published_at: string | null
    users: { display_name: string | null; avatar_url: string | null } | null
    author_profile: { id: string; display_name: string; avatar_url: string | null } | null
  } | null
}
type Article = Database['public']['Tables']['articles']['Row']

interface MypageClientProps {
  profile: UserProfile | null
  purchasedOrders: Order[]
  favorites: Favorite[]
  myArticles: Article[]
  userId: string
}

type TabType = 'profile' | 'purchases' | 'favorites' | 'articles'

export default function MypageClient({
  profile,
  purchasedOrders,
  favorites,
  myArticles,
}: MypageClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('profile')

  const tabs = [
    { id: 'profile' as TabType, label: 'プロフィール', icon: User },
    { id: 'purchases' as TabType, label: '購入履歴', icon: ShoppingBag, count: purchasedOrders.length },
    { id: 'favorites' as TabType, label: 'お気に入り', icon: Heart, count: favorites.length },
    { id: 'articles' as TabType, label: '投稿記事', icon: FileText, count: myArticles.length },
  ]

  return (
    <div className="min-h-screen bg-gray-950 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">マイページ</h1>
          <Link
            href="/mypage/settings"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <Settings className="w-5 h-5" />
            <span>設定</span>
          </Link>
        </div>

        {/* タブナビゲーション */}
        <div className="flex gap-1 mb-8 bg-gray-900 p-1 rounded-lg overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  activeTab === tab.id ? 'bg-emerald-600' : 'bg-gray-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* プロフィールタブ */}
        {activeTab === 'profile' && (
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 rounded-full bg-gray-700 overflow-hidden relative">
                <Image
                  src={profile?.avatar_url || '/noicon.png'}
                  alt="プロフィール画像"
                  fill
                  className="object-cover"
                  unoptimized={!!profile?.avatar_url}
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {profile?.display_name || 'ユーザー'}
                </h2>
                <p className="text-gray-400">{profile?.email}</p>
              </div>
            </div>
            {profile?.bio && (
              <p className="text-gray-300 mb-4">{profile.bio}</p>
            )}
            <Link
              href="/mypage/settings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
            >
              プロフィールを編集
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* 購入履歴タブ */}
        {activeTab === 'purchases' && (
          <div className="space-y-4">
            {purchasedOrders.length === 0 ? (
              <div className="bg-gray-900 rounded-lg p-8 text-center">
                <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">購入した記事はまだありません</p>
                <Link
                  href="/"
                  className="inline-block mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
                >
                  記事を探す
                </Link>
              </div>
            ) : (
              purchasedOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/articles/${order.articles?.slug}`}
                  className="flex items-center gap-4 bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition"
                >
                  <div className="w-20 h-12 bg-gray-700 rounded overflow-hidden flex-shrink-0 relative">
                    {order.articles?.cover_image_url && (
                      <Image
                        src={order.articles.cover_image_url}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">
                      {order.articles?.title}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      購入日: {new Date(order.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div className="text-emerald-400 font-bold">
                    ¥{order.amount.toLocaleString()}
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* お気に入りタブ */}
        {activeTab === 'favorites' && (
          <div className="space-y-4">
            {favorites.length === 0 ? (
              <div className="bg-gray-900 rounded-lg p-8 text-center">
                <Heart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">お気に入りの記事はまだありません</p>
                <Link
                  href="/"
                  className="inline-block mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
                >
                  記事を探す
                </Link>
              </div>
            ) : (
              favorites.map((fav) => (
                <Link
                  key={fav.id}
                  href={`/articles/${fav.articles?.slug}`}
                  className="flex items-center gap-4 bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition"
                >
                  <div className="w-20 h-12 bg-gray-700 rounded overflow-hidden flex-shrink-0 relative">
                    {fav.articles?.cover_image_url && (
                      <Image
                        src={fav.articles.cover_image_url}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">
                      {fav.articles?.title}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {fav.articles?.author_profile?.display_name ||
                        fav.articles?.users?.display_name ||
                        '著者不明'}
                    </p>
                  </div>
                  <div className="text-emerald-400 font-bold">
                    {fav.articles?.price === 0 ? '無料' : `¥${fav.articles?.price.toLocaleString()}`}
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* 投稿記事タブ */}
        {activeTab === 'articles' && (
          <div className="space-y-4">
            <div className="flex justify-end mb-4">
              <Link
                href="/editor"
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
              >
                新規記事を作成
              </Link>
            </div>
            {myArticles.length === 0 ? (
              <div className="bg-gray-900 rounded-lg p-8 text-center">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">投稿した記事はまだありません</p>
              </div>
            ) : (
              myArticles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center gap-4 bg-gray-900 rounded-lg p-4"
                >
                  <div className="w-20 h-12 bg-gray-700 rounded overflow-hidden flex-shrink-0 relative">
                    {article.cover_image_url && (
                      <Image
                        src={article.cover_image_url}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        article.status === 'published'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {article.status === 'published' ? '公開中' : '下書き'}
                      </span>
                      <span className="text-gray-400">
                        {new Date(article.created_at).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/editor?id=${article.id}`}
                      className="px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition"
                    >
                      編集
                    </Link>
                    <Link
                      href={`/articles/${article.slug}`}
                      className="px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition"
                    >
                      表示
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
