import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import SearchClient from './SearchClient'

export const metadata = {
  title: '検索結果',
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  const params = await searchParams
  const query = params.q || ''
  const categorySlug = params.category || ''

  const supabase = await createClient()

  type Category = { id: string; name: string; slug: string; parent_id: string | null; sort_order: number; created_at: string }

  // カテゴリ一覧を取得
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')

  const categories = (categoriesData || []) as Category[]

  // 検索実行
  let articlesQuery = supabase
    .from('articles')
    .select(`
      *,
      users:author_id (display_name, email, avatar_url),
      author_profile:author_profile_id (id, display_name, avatar_url),
      primary_category:primary_category_id (id, name, slug)
    `)
    .eq('status', 'published')
    .eq('is_archived', false)
    .order('published_at', { ascending: false })

  if (query) {
    articlesQuery = articlesQuery.or(`title.ilike.%${query}%,excerpt.ilike.%${query}%`)
  }

  if (categorySlug) {
    const category = categories.find(c => c.slug === categorySlug)
    if (category) {
      articlesQuery = articlesQuery.eq('primary_category_id', category.id)
    }
  }

  const { data: articles } = await articlesQuery.limit(50)

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <SearchClient
        initialQuery={query}
        initialCategory={categorySlug}
        articles={articles || []}
        categories={categories}
      />
    </Suspense>
  )
}
