'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import ArticleCard from '@/components/ArticleCard'
import BannerCarousel from '@/components/BannerCarousel'
import type { Database } from '@/lib/database.types'

type Category = Database['public']['Tables']['categories']['Row']

type Article = Database['public']['Tables']['articles']['Row'] & {
  users?: { display_name: string | null; email: string; avatar_url?: string | null }
  author_profile?: { id: string; display_name: string; avatar_url: string | null } | null
  primary_category?: { id: string; name: string; slug: string } | null
}

interface HomeClientProps {
  parentCategories: Category[]
  allCategories: Category[]
  allArticles: Article[]
  sectionMap: Record<string, string[]>
}

export default function HomeClient({
  parentCategories,
  allCategories,
  allArticles,
  sectionMap,
}: HomeClientProps) {
  useAuth() // For future use
  const searchParams = useSearchParams()
  const selectedCategory = searchParams.get('category')

  // 親カテゴリごとの子カテゴリIDマップ
  const categoryIdMap = useMemo(() => {
    const map: Record<string, string[]> = {}
    parentCategories.forEach(parent => {
      const childIds = allCategories
        .filter(c => c.parent_id === parent.id)
        .map(c => c.id)
      map[parent.id] = [parent.id, ...childIds]
    })
    return map
  }, [parentCategories, allCategories])

  // メモ化された記事リスト
  const popularArticles = useMemo(() => {
    if (sectionMap['popular']?.length) {
      return sectionMap['popular']
        .map(id => allArticles.find(a => a.id === id))
        .filter(Boolean) as Article[]
    }
    return allArticles.slice(0, 7)
  }, [allArticles, sectionMap])

  const newArticles = useMemo(() => allArticles.slice(0, 8), [allArticles])

  const editorPickArticles = useMemo(() => {
    if (sectionMap['editor_picks']?.length) {
      return sectionMap['editor_picks']
        .map(id => allArticles.find(a => a.id === id))
        .filter(Boolean) as Article[]
    }
    return allArticles.slice(0, 8)
  }, [allArticles, sectionMap])

  // カテゴリ別記事（子カテゴリも含む）
  const categoryArticles = useMemo(() => {
    const catArts: Record<string, Article[]> = {}
    parentCategories.forEach(cat => {
      const categoryIds = categoryIdMap[cat.id] || [cat.id]
      catArts[cat.id] = allArticles
        .filter(a => a.primary_category_id && categoryIds.includes(a.primary_category_id))
        .slice(0, 8)
    })
    return catArts
  }, [allArticles, parentCategories, categoryIdMap])

  // カテゴリ選択された場合の記事フィルタ
  const filteredArticles = useMemo(() => {
    if (!selectedCategory) return null
    const category = parentCategories.find(c => c.slug === selectedCategory)
    if (!category) return null
    const categoryIds = categoryIdMap[category.id] || [category.id]
    return allArticles.filter(a => a.primary_category_id && categoryIds.includes(a.primary_category_id))
  }, [selectedCategory, parentCategories, allArticles, categoryIdMap])

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* モバイル: カテゴリ横スクロール */}
      <div className="lg:hidden mb-6 -mx-4 px-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Link
            href="/"
            className={`flex-shrink-0 px-4 py-2 text-sm rounded-full transition whitespace-nowrap ${
              !selectedCategory
                ? 'bg-emerald-500 text-white font-medium'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            すべて
          </Link>
          {parentCategories.map(cat => (
            <Link
              key={cat.id}
              href={`/?category=${cat.slug}`}
              className={`flex-shrink-0 px-4 py-2 text-sm rounded-full transition whitespace-nowrap ${
                selectedCategory === cat.slug
                  ? 'bg-emerald-500 text-white font-medium'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* バナーカルーセル */}
      {!selectedCategory && <BannerCarousel />}

      {/* PC: 2カラムレイアウト */}
      <div className="lg:flex lg:gap-8">
        {/* 左サイドバー（PCのみ） */}
        <aside className="hidden lg:block lg:w-56 flex-shrink-0">
          <div className="sticky top-20">
            <nav>
              <Link
                href="/"
                className={`block px-2 py-3 text-lg transition ${
                  !selectedCategory
                    ? 'text-emerald-400 font-medium'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                すべて
              </Link>
              {parentCategories.map(cat => (
                <Link
                  key={cat.id}
                  href={`/?category=${cat.slug}`}
                  className={`block px-2 py-3 text-lg transition ${
                    selectedCategory === cat.slug
                      ? 'text-emerald-400 font-medium'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* メインコンテンツ */}
        <div className="flex-1 min-w-0">
          {selectedCategory && filteredArticles ? (
            /* カテゴリ選択時 */
            <div>
              <h2 className="text-xl font-bold text-white mb-4">
                {parentCategories.find(c => c.slug === selectedCategory)?.name}
              </h2>
              {filteredArticles.length === 0 ? (
                <p className="text-gray-400">まだ記事がありません</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
                  {filteredArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} skipDbQuery />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* 通常表示 */
            <div className="space-y-6 sm:space-y-10">
              {/* 人気の記事 */}
              {popularArticles.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white">人気の記事</h2>
                    <Link href="/articles?sort=popular" className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
                      もっと見る <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mr-4 sm:-mr-6 lg:-mr-8 pr-4 sm:pr-6 lg:pr-8">
                    {popularArticles.slice(0, 8).map((article, index) => (
                      <div key={article.id} className="flex-shrink-0 w-48 sm:w-56 lg:w-64">
                        <ArticleCard article={article} priority={index < 4} skipDbQuery />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 新着記事 */}
              {newArticles.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white">新着記事</h2>
                    <Link href="/articles" className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
                      もっと見る <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mr-4 sm:-mr-6 lg:-mr-8 pr-4 sm:pr-6 lg:pr-8">
                    {newArticles.map((article) => (
                      <div key={article.id} className="flex-shrink-0 w-48 sm:w-56 lg:w-64">
                        <ArticleCard article={article} skipDbQuery />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 編集部おすすめ */}
              {editorPickArticles.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white">編集部おすすめ</h2>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mr-4 sm:-mr-6 lg:-mr-8 pr-4 sm:pr-6 lg:pr-8">
                    {editorPickArticles.map((article) => (
                      <div key={article.id} className="flex-shrink-0 w-48 sm:w-56 lg:w-64">
                        <ArticleCard article={article} skipDbQuery />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* カテゴリ別 */}
              {parentCategories.map(cat => {
                const arts = categoryArticles[cat.id] || []
                if (arts.length === 0) return null
                return (
                  <section key={cat.id}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-white">{cat.name}</h2>
                      <Link href={`/articles?category=${cat.slug}`} className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
                        もっと見る <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mr-4 sm:-mr-6 lg:-mr-8 pr-4 sm:pr-6 lg:pr-8">
                      {arts.map((article) => (
                        <div key={article.id} className="flex-shrink-0 w-48 sm:w-56 lg:w-64">
                          <ArticleCard article={article} skipDbQuery />
                        </div>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
