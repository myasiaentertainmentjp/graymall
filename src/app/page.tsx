import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import HomeClient from './HomeClient'

export const revalidate = 60 // ISR: 60秒ごとに再検証

async function fetchData() {
  const supabase = await createClient()

  // 個別にクエリを実行して型を明示
  const { data: parentCategories } = await supabase
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .order('sort_order')

  const { data: allCategories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')

  const { data: allArticlesData } = await supabase
    .from('articles')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(500)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allArticles = (allArticlesData || []) as any[]

  // お気に入り数を一括取得（N+1解消）
  const articleIds = allArticles.map(a => a.id as string)
  let favoriteCounts: Record<string, number> = {}
  if (articleIds.length > 0) {
    const { data: favData } = await supabase
      .from('article_favorites')
      .select('article_id')
      .in('article_id', articleIds)

    const favorites = favData as { article_id: string }[] | null
    if (favorites) {
      favoriteCounts = favorites.reduce((acc: Record<string, number>, row) => {
        acc[row.article_id] = (acc[row.article_id] || 0) + 1
        return acc
      }, {})
    }
  }

  // お気に入り数を記事データにマージ
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const articlesWithFavorites = allArticles.map((article: any) => ({
    ...article,
    real_favorite_count: favoriteCounts[article.id] || 0,
  }))

  const { data: sectionsData } = await supabase
    .from('homepage_sections')
    .select('id, section_key')
    .eq('is_active', true)
  const sections = sectionsData as { id: string; section_key: string }[] | null

  // セクションの記事IDを取得
  const sectionMap: Record<string, string[]> = {}
  if (sections && sections.length > 0) {
    const sectionIds = sections.map(s => s.id)
    const { data: allSectionArticlesData } = await supabase
      .from('homepage_section_articles')
      .select('section_id, article_id')
      .in('section_id', sectionIds)
      .order('sort_order')
    const allSectionArticles = allSectionArticlesData as { section_id: string; article_id: string }[] | null

    if (allSectionArticles) {
      const sectionIdToKey = Object.fromEntries(sections.map(s => [s.id, s.section_key]))
      for (const sa of allSectionArticles) {
        const key = sectionIdToKey[sa.section_id]
        if (key) {
          if (!sectionMap[key]) sectionMap[key] = []
          sectionMap[key].push(sa.article_id)
        }
      }
    }
  }

  return {
    parentCategories: parentCategories || [],
    allCategories: allCategories || [],
    allArticles: articlesWithFavorites,
    sectionMap,
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
