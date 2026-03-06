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
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  if (query) {
    articlesQuery = articlesQuery.or(`title.ilike.%${query}%,excerpt.ilike.%${query}%`)
  }

  if (categorySlug) {
    articlesQuery = articlesQuery.eq('category', categorySlug)
  }

  const { data: articles } = await articlesQuery.limit(50)

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
