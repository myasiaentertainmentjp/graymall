import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/server'
import { Loader2 } from 'lucide-react'

// TipTapエディタを含むため、SSRを無効化して動的インポート
const EditorClient = dynamic(() => import('./EditorClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
    </div>
  ),
})

export const metadata = {
  title: '記事エディター',
}

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin?redirect=/editor')
  }

  const params = await searchParams
  const articleId = params.id

  // 編集の場合は記事を取得
  let article = null
  if (articleId) {
    const { data } = await supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .eq('author_id', user.id)
      .single()
    article = data
  }

  // カテゴリ一覧を取得
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <EditorClient
        article={article}
        categories={categories || []}
        userId={user.id}
      />
    </Suspense>
  )
}
