import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ArticleDetailClient from './ArticleDetailClient'
import { ArticleSchema, BreadcrumbSchema } from '@/components/StructuredData'
import type { Metadata } from 'next'
import type { Database } from '@/lib/database.types'

export const revalidate = 60

type Article = Database['public']['Tables']['articles']['Row'] & {
  users?: { display_name: string | null; email: string; avatar_url?: string | null; bio?: string | null }
  author_profile?: { id?: string; display_name: string; avatar_url?: string | null; bio?: string | null } | null
  primary_category?: { id: string; name: string; slug: string } | null
  category?: string | null
}

interface Props {
  params: Promise<{ slug: string }>
}

async function getArticle(slug: string): Promise<Article | null> {
  const supabase = await createClient()

  const { data: article, error } = await supabase
    .from('articles')
    .select('*, users:author_id(id, display_name, email, avatar_url, bio)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !article) {
    return null
  }

  return {
    ...article,
    thumbnail_url: article.thumbnail_url || article.cover_image_url,
  } as Article
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article) {
    return {
      title: '記事が見つかりません',
    }
  }

  const authorName = article.author_profile?.display_name ||
    article.users?.display_name ||
    article.users?.email?.split('@')[0] ||
    '著者不明'

  const ogImage = article.thumbnail_url || article.cover_image_url || 'https://graymall.jp/og-image.png'

  return {
    title: article.title,
    description: article.excerpt || article.title,
    authors: [{ name: authorName }],
    alternates: {
      canonical: `/articles/${slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.excerpt || article.title,
      type: 'article',
      url: `https://graymall.jp/articles/${slug}`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
      publishedTime: article.published_at || undefined,
      authors: [authorName],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt || article.title,
      images: [ogImage],
    },
  }
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article) {
    notFound()
  }

  // 関連記事を取得
  const supabase = await createClient()
  let relatedArticles: Article[] = []

  if (article.category) {
    const { data } = await supabase
      .from('articles')
      .select('*, users:author_id(id, display_name, email, avatar_url)')
      .eq('category', article.category)
      .eq('status', 'published')
      .neq('id', article.id)
      .limit(4)

    relatedArticles = (data || []).map((a) => ({
      ...a,
      thumbnail_url: a.thumbnail_url || a.cover_image_url,
    })) as Article[]
  }

  const authorName = article.author_profile?.display_name ||
    article.users?.display_name ||
    article.users?.email?.split('@')[0] ||
    '著者不明'

  const breadcrumbItems = [
    { name: 'ホーム', url: 'https://graymall.jp' },
    ...(article.primary_category ? [
      { name: article.primary_category.name, url: `https://graymall.jp/search?category=${article.primary_category.slug}` }
    ] : []),
    { name: article.title, url: `https://graymall.jp/articles/${article.slug}` },
  ]

  return (
    <>
      <ArticleSchema
        title={article.title}
        description={article.excerpt || article.title}
        image={article.thumbnail_url || article.cover_image_url || 'https://graymall.jp/og-image.png'}
        datePublished={article.published_at || article.created_at}
        dateModified={article.updated_at}
        authorName={authorName}
        url={`https://graymall.jp/articles/${article.slug}`}
      />
      <BreadcrumbSchema items={breadcrumbItems} />
      <ArticleDetailClient
        article={article}
        relatedArticles={relatedArticles}
      />
    </>
  )
}
