import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import HomeClient from './HomeClient'

export const revalidate = 60 // ISR: 60秒ごとに再検証

async function fetchData() {
  const supabase = await createClient()

  const [{ data: allArticlesData }, { data: categoriesData }] = await Promise.all([
    supabase
      .from('articles')
      .select('id, title, slug, excerpt, cover_image_url, thumbnail_url, price, published_at, created_at, like_count, fake_favorite_count, author_id, primary_category_id, affiliate_enabled, affiliate_rate, affiliate_target, users:author_id(id, display_name, avatar_url)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(100),
    supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true }),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allArticles = (allArticlesData || []).map((article: any) => ({
    ...article,
    // cover_image_url を thumbnail_url として使用
    thumbnail_url: article.thumbnail_url || article.cover_image_url,
  }))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allCategories = (categoriesData || []) as any[]
  const parentCategories = allCategories.filter((c) => !c.parent_id)

  return {
    parentCategories,
    allCategories,
    allArticles,
    sectionMap: {},
  }
}

export default async function HomePage() {
  const data = await fetchData()

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <HomeClient {...data} />
    </Suspense>
  )
}
