import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import HomeClient from './HomeClient'

export const revalidate = 60 // ISR: 60秒ごとに再検証

async function fetchData() {
  const supabase = await createClient()

  const [{ data: allArticlesData }, { data: categoriesData }] = await Promise.all([
    supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(500),
    supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true }),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allArticles = (allArticlesData || []) as any[]
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
