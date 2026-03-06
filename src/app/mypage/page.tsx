import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MypageClient from './MypageClient'

export const metadata = {
  title: 'マイページ',
}

async function getData(userId: string) {
  const supabase = await createClient()

  const [
    { data: profile },
    { data: purchasedOrders },
    { data: favorites },
    { data: myArticles },
  ] = await Promise.all([
    supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single(),
    supabase
      .from('orders')
      .select(`
        *,
        articles (id, title, slug, thumbnail_url, price)
      `)
      .eq('buyer_id', userId)
      .eq('status', 'paid')
      .order('created_at', { ascending: false }),
    supabase
      .from('article_favorites')
      .select(`
        *,
        articles (
          id, title, slug, thumbnail_url, price, published_at,
          users:author_id (display_name, avatar_url),
          author_profile:author_profile_id (id, display_name, avatar_url)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('articles')
      .select('*')
      .eq('author_id', userId)
      .order('created_at', { ascending: false }),
  ])

  return {
    profile,
    purchasedOrders: purchasedOrders || [],
    favorites: favorites || [],
    myArticles: myArticles || [],
  }
}

export default async function MypagePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin?redirect=/mypage')
  }

  const data = await getData(user.id)

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <MypageClient {...data} userId={user.id} />
    </Suspense>
  )
}
