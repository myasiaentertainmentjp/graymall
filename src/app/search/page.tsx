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

  // 検索実行
  let articlesQuery = supabase
    .from('articles')
    .select('*, users:author_id(id, display_name, email, avatar_url)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (query) {
    articlesQuery = articlesQuery.or(`title.ilike.%${query}%,excerpt.ilike.%${query}%`)
  }

  if (categorySlug) {
    articlesQuery = articlesQuery.eq('category', categorySlug)
  }

  const { data: articlesData } = await articlesQuery.limit(50)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const articles = (articlesData || []).map((article: any) => ({
    ...article,
    thumbnail_url: article.thumbnail_url || article.cover_image_url,
  }))

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <SearchClient
        initialQuery={query}
        initialCategory={categorySlug}
        articles={articles || []}
        categories={[]}
      />
    </Suspense>
  )
}
