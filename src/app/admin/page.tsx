import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/server'
import { Loader2 } from 'lucide-react'

// 管理画面を動的インポート（初期バンドルサイズ削減）
const AdminClient = dynamic(() => import('./AdminClient'), {
  loading: () => (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
    </div>
  ),
})

export const metadata = {
  title: '管理ダッシュボード',
}

// 管理者IDリスト（環境変数で管理するのが望ましい）
const ADMIN_IDS = process.env.ADMIN_USER_IDS?.split(',') || []

async function getDashboardData() {
  const supabase = await createClient()

  const [
    { count: totalUsers },
    { count: totalArticles },
    { count: totalOrders },
    { data: recentOrders },
    { data: allArticles },
    { data: pendingWithdrawals },
    { data: pendingReviewArticles },
    { data: homepageSections },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'paid'),
    supabase
      .from('orders')
      .select(`
        *,
        articles (title),
        buyer:buyer_id (display_name, email)
      `)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('articles')
      .select('*, users:author_id (display_name, email)')
      .order('created_at', { ascending: false }),
    supabase
      .from('withdraw_requests')
      .select('*, users:user_id (display_name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    supabase
      .from('articles')
      .select('*')
      .neq('status', 'published')
      .order('created_at', { ascending: false }),
    supabase
      .from('homepage_sections')
      .select('*')
      .eq('is_active', true),
  ])

  // セクションごとの記事IDを取得
  type SectionArticle = { section_id: string; article_id: string; sort_order: number }
  const sectionArticlesMap: Record<string, string[]> = {}

  if (homepageSections && homepageSections.length > 0) {
    const sectionIds = homepageSections.map((s: { id: string }) => s.id)
    const { data: sectionArticles } = await supabase
      .from('homepage_section_articles')
      .select('section_id, article_id, sort_order')
      .in('section_id', sectionIds)
      .order('sort_order')

    if (sectionArticles) {
      for (const sa of sectionArticles as SectionArticle[]) {
        const section = homepageSections.find((s: { id: string; section_key: string }) => s.id === sa.section_id) as { id: string; section_key: string } | undefined
        if (section) {
          if (!sectionArticlesMap[section.section_key]) {
            sectionArticlesMap[section.section_key] = []
          }
          sectionArticlesMap[section.section_key].push(sa.article_id)
        }
      }
    }
  }

  // 売上合計を計算
  const { data: salesData } = await supabase
    .from('orders')
    .select('amount')
    .eq('status', 'paid')

  const salesArray = (salesData || []) as { amount: number }[]
  const totalSales = salesArray.reduce((sum, order) => sum + (order.amount || 0), 0)

  return {
    stats: {
      totalUsers: totalUsers || 0,
      totalArticles: totalArticles || 0,
      totalOrders: totalOrders || 0,
      totalSales,
    },
    recentOrders: recentOrders || [],
    allArticles: allArticles || [],
    pendingWithdrawals: pendingWithdrawals || [],
    pendingReviewArticles: pendingReviewArticles || [],
    homepageSections: homepageSections || [],
    sectionArticlesMap,
  }
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin?redirect=/admin')
  }

  // 管理者チェック
  if (!ADMIN_IDS.includes(user.id)) {
    redirect('/')
  }

  const data = await getDashboardData()

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <AdminClient {...data} userId={user.id} />
    </Suspense>
  )
}
