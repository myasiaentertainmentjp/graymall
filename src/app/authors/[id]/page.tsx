import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AuthorClient from './AuthorClient'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

type AuthorProfile = {
  id: string
  display_name: string
  avatar_url: string | null
  bio: string | null
}

type UserProfile = {
  id: string
  display_name: string | null
  email: string
  avatar_url: string | null
  bio: string | null
}

async function getAuthorData(id: string) {
  const supabase = await createClient()

  // まずauthor_profilesを確認
  const { data: authorProfileData } = await supabase
    .from('author_profiles')
    .select('*')
    .eq('id', id)
    .single()

  const authorProfile = authorProfileData as AuthorProfile | null

  if (authorProfile) {
    // author_profilesの場合
    const { data: articles } = await supabase
      .from('articles')
      .select(`
        *,
        users:author_id (display_name, email, avatar_url),
        author_profile:author_profile_id (id, display_name, avatar_url),
        primary_category:primary_category_id (id, name, slug)
      `)
      .eq('author_profile_id', id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    const { count: followerCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', id)

    return {
      author: {
        id: authorProfile.id,
        display_name: authorProfile.display_name,
        avatar_url: authorProfile.avatar_url,
        bio: authorProfile.bio,
        type: 'author_profile' as const,
      },
      articles: articles || [],
      followerCount: followerCount || 0,
    }
  }

  // usersテーブルを確認
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  const user = userData as UserProfile | null

  if (!user) {
    return null
  }

  const { data: articles } = await supabase
    .from('articles')
    .select(`
      *,
      users:author_id (display_name, email, avatar_url),
      author_profile:author_profile_id (id, display_name, avatar_url),
      primary_category:primary_category_id (id, name, slug)
    `)
    .eq('author_id', id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  const { count: followerCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', id)

  return {
    author: {
      id: user.id,
      display_name: user.display_name || user.email?.split('@')[0] || 'ユーザー',
      avatar_url: user.avatar_url,
      bio: user.bio,
      type: 'user' as const,
    },
    articles: articles || [],
    followerCount: followerCount || 0,
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const data = await getAuthorData(id)

  if (!data) {
    return { title: '著者が見つかりません' }
  }

  return {
    title: `${data.author.display_name}のプロフィール`,
    description: data.author.bio || `${data.author.display_name}の投稿記事一覧`,
  }
}

export default async function AuthorPage({ params }: Props) {
  const { id } = await params
  const data = await getAuthorData(id)

  if (!data) {
    notFound()
  }

  // ログインユーザー取得
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // フォロー状態を確認
  let isFollowing = false
  if (user) {
    const { data: follow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', id)
      .maybeSingle()
    isFollowing = !!follow
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <AuthorClient
        author={data.author}
        articles={data.articles}
        followerCount={data.followerCount}
        isFollowing={isFollowing}
        currentUserId={user?.id || null}
      />
    </Suspense>
  )
}
