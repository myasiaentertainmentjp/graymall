import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

// sitemapは1時間ごとに再生成
export const revalidate = 3600

interface ArticleRow {
  slug: string
  updated_at: string | null
  published_at: string | null
}

// 最大記事数（sitemapが大きくなりすぎないように）
const MAX_ARTICLES = 1000

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const baseUrl = 'https://graymall.jp'

  // 固定ページ
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/signin`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  // 公開記事を取得（上限付き）
  const { data: articlesData } = await supabase
    .from('articles')
    .select('slug, updated_at, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(MAX_ARTICLES)

  const articles = (articlesData || []) as ArticleRow[]

  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${baseUrl}/articles/${article.slug}`,
    lastModified: new Date(article.updated_at || article.published_at || new Date().toISOString()),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...articlePages]
}
