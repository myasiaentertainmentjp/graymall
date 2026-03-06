'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import ArticleCard from '@/components/ArticleCard'
import type { Database } from '@/lib/database.types'

type Category = Database['public']['Tables']['categories']['Row']
type Article = Database['public']['Tables']['articles']['Row'] & {
  users?: { display_name: string | null; email: string; avatar_url?: string | null }
  author_profile?: { id?: string; display_name: string; avatar_url?: string | null } | null
  primary_category?: { id: string; name: string; slug: string } | null
}

interface SearchClientProps {
  initialQuery: string
  initialCategory: string
  articles: Article[]
  categories: Category[]
}

export default function SearchClient({
  initialQuery,
  initialCategory,
  articles,
  categories,
}: SearchClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQuery)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)

  useEffect(() => {
    const q = searchParams.get('q') || ''
    const cat = searchParams.get('category') || ''
    setQuery(q)
    setSelectedCategory(cat)
  }, [searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (selectedCategory) params.set('category', selectedCategory)
    router.push(`/search?${params.toString()}`)
  }

  const handleCategoryChange = (slug: string) => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (slug) params.set('category', slug)
    router.push(`/search?${params.toString()}`)
  }

  const clearFilters = () => {
    setQuery('')
    setSelectedCategory('')
    router.push('/search')
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 検索フォーム */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="キーワードで検索..."
                className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
            >
              検索
            </button>
          </div>
        </form>

        {/* カテゴリフィルター */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => handleCategoryChange('')}
            className={`px-4 py-2 rounded-full text-sm transition ${
              !selectedCategory
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            すべて
          </button>
          {categories
            .filter((c) => !c.parent_id)
            .map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.slug)}
                className={`px-4 py-2 rounded-full text-sm transition ${
                  selectedCategory === category.slug
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category.name}
              </button>
            ))}
        </div>

        {/* 検索結果 */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-white font-medium">
            {query || selectedCategory ? (
              <>
                検索結果: {articles.length}件
                {query && <span className="text-gray-400 ml-2">「{query}」</span>}
              </>
            ) : (
              '新着記事'
            )}
          </h2>
          {(query || selectedCategory) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
              フィルターをクリア
            </button>
          )}
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {query || selectedCategory
                ? '該当する記事が見つかりませんでした'
                : '記事がまだありません'}
            </p>
            {(query || selectedCategory) && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
              >
                すべての記事を表示
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} skipDbQuery />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
