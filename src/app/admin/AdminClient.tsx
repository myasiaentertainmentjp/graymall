'use client'

import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  Users,
  FileText,
  ShoppingCart,
  DollarSign,
  Clock,
  Check,
  X,
  Loader2,
  Star,
  Plus,
  Trash2,
  GripVertical,
  Eye,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Stats {
  totalUsers: number
  totalArticles: number
  totalOrders: number
  totalSales: number
}

interface Order {
  id: string
  amount: number
  created_at: string
  articles: { title: string } | null
  buyer: { display_name: string | null; email: string } | null
}

interface Article {
  id: string
  title: string
  slug: string
  status: string
  created_at: string
  thumbnail_url: string | null
  users: { display_name: string | null; email: string } | null
}

interface Withdrawal {
  id: string
  amount: number
  status: string
  created_at: string
  users: { display_name: string | null; email: string } | null
}

interface HomepageSection {
  id: string
  section_key: string
  title: string
  is_active: boolean
}

interface AdminClientProps {
  stats: Stats
  recentOrders: Order[]
  allArticles: Article[]
  pendingWithdrawals: Withdrawal[]
  pendingReviewArticles: Article[]
  homepageSections: HomepageSection[]
  sectionArticlesMap: Record<string, string[]>
  userId: string
}

type TabType = 'overview' | 'review' | 'sections' | 'withdrawals' | 'articles'

export default function AdminClient({
  stats,
  recentOrders,
  allArticles,
  pendingWithdrawals: initialWithdrawals,
  pendingReviewArticles: initialPendingArticles,
  homepageSections,
  sectionArticlesMap: initialSectionMap,
}: AdminClientProps) {
  const supabase = createClient() as ReturnType<typeof createClient> & { from: (table: string) => unknown }
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals)
  const [pendingArticles, setPendingArticles] = useState(initialPendingArticles)
  const [processing, setProcessing] = useState<string | null>(null)

  // セクション管理用state
  const [popularArticles, setPopularArticles] = useState<string[]>(initialSectionMap['popular'] || [])
  const [editorPicks, setEditorPicks] = useState<string[]>(initialSectionMap['editor_picks'] || [])
  const [savingSections, setSavingSections] = useState(false)

  const publishedArticles = allArticles.filter(a => a.status === 'published')

  // 出金処理
  const handleWithdrawal = async (id: string, approve: boolean) => {
    setProcessing(id)
    const { error } = await (supabase as unknown as { from: (table: string) => { update: (data: object) => { eq: (col: string, val: string) => Promise<{ error: Error | null }> } } })
      .from('withdraw_requests')
      .update({
        status: approve ? 'completed' : 'rejected',
        processed_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (!error) {
      setWithdrawals((prev) => prev.filter((w) => w.id !== id))
    } else {
      toast.error('処理に失敗しました')
    }
    setProcessing(null)
  }

  // 記事審査処理
  const handleArticleReview = async (id: string, approve: boolean) => {
    setProcessing(id)
    const newStatus = approve ? 'published' : 'rejected'
    const updateData: Record<string, unknown> = { status: newStatus }
    if (approve) {
      updateData.published_at = new Date().toISOString()
    }

    const { error } = await (supabase as unknown as { from: (table: string) => { update: (data: object) => { eq: (col: string, val: string) => Promise<{ error: Error | null }> } } })
      .from('articles')
      .update(updateData)
      .eq('id', id)

    if (!error) {
      setPendingArticles((prev) => prev.filter((a) => a.id !== id))
    } else {
      toast.error('処理に失敗しました')
    }
    setProcessing(null)
  }

  // セクションに記事を追加
  const addToSection = (section: 'popular' | 'editor_picks', articleId: string) => {
    if (section === 'popular') {
      if (!popularArticles.includes(articleId)) {
        setPopularArticles([...popularArticles, articleId])
      }
    } else {
      if (!editorPicks.includes(articleId)) {
        setEditorPicks([...editorPicks, articleId])
      }
    }
  }

  // セクションから記事を削除
  const removeFromSection = (section: 'popular' | 'editor_picks', articleId: string) => {
    if (section === 'popular') {
      setPopularArticles(popularArticles.filter(id => id !== articleId))
    } else {
      setEditorPicks(editorPicks.filter(id => id !== articleId))
    }
  }

  // セクション内の記事を並び替え
  const moveArticle = (section: 'popular' | 'editor_picks', index: number, direction: 'up' | 'down') => {
    const list = section === 'popular' ? [...popularArticles] : [...editorPicks]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= list.length) return

    [list[index], list[newIndex]] = [list[newIndex], list[index]]

    if (section === 'popular') {
      setPopularArticles(list)
    } else {
      setEditorPicks(list)
    }
  }

  // セクション設定を保存
  const saveSections = async () => {
    setSavingSections(true)

    try {
      // 各セクションのIDを取得または作成
      const sections = [
        { key: 'popular', title: '人気の記事', articles: popularArticles },
        { key: 'editor_picks', title: '編集部おすすめ', articles: editorPicks },
      ]

      for (const section of sections) {
        // セクションを取得または作成
        let sectionData = homepageSections.find(s => s.section_key === section.key)

        if (!sectionData) {
          const { data: newSection, error: insertError } = await (supabase as unknown as { from: (table: string) => { insert: (data: object) => { select: () => { single: () => Promise<{ data: HomepageSection | null; error: Error | null }> } } } })
            .from('homepage_sections')
            .insert({
              section_key: section.key,
              title: section.title,
              is_active: true,
            })
            .select()
            .single()

          if (insertError || !newSection) {
            throw new Error(`Failed to create section: ${section.key}`)
          }
          sectionData = newSection
        }

        // 既存の記事を削除
        await (supabase as unknown as { from: (table: string) => { delete: () => { eq: (col: string, val: string) => Promise<{ error: Error | null }> } } })
          .from('homepage_section_articles')
          .delete()
          .eq('section_id', sectionData.id)

        // 新しい記事を追加
        if (section.articles.length > 0) {
          const insertData = section.articles.map((articleId, index) => ({
            section_id: sectionData!.id,
            article_id: articleId,
            sort_order: index,
          }))

          await (supabase as unknown as { from: (table: string) => { insert: (data: object[]) => Promise<{ error: Error | null }> } })
            .from('homepage_section_articles')
            .insert(insertData)
        }
      }

      toast.success('保存しました')
    } catch (error) {
      console.error('Save error:', error)
      toast.error('保存に失敗しました')
    }

    setSavingSections(false)
  }

  // 記事をIDから取得
  const getArticleById = (id: string) => publishedArticles.find(a => a.id === id)

  const statCards = [
    { label: 'ユーザー数', value: stats.totalUsers, icon: Users, color: 'text-blue-400' },
    { label: '公開記事数', value: stats.totalArticles, icon: FileText, color: 'text-emerald-400' },
    { label: '総注文数', value: stats.totalOrders, icon: ShoppingCart, color: 'text-purple-400' },
    { label: '総売上', value: `¥${stats.totalSales.toLocaleString()}`, icon: DollarSign, color: 'text-yellow-400' },
  ]

  const tabs = [
    { key: 'overview' as const, label: '概要', badge: 0 },
    { key: 'review' as const, label: '記事審査', badge: pendingArticles.length },
    { key: 'sections' as const, label: 'ホームページ管理', badge: 0 },
    { key: 'withdrawals' as const, label: '出金申請', badge: withdrawals.length },
    { key: 'articles' as const, label: '記事一覧', badge: 0 },
  ]

  return (
    <div className="min-h-screen bg-gray-950 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-white mb-8">管理ダッシュボード</h1>

        {/* 統計カード */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-gray-400 text-sm">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* タブナビゲーション */}
        <div className="flex gap-1 mb-6 bg-gray-900 p-1 rounded-lg overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-emerald-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab.label}
              {tab.badge > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  activeTab === tab.key ? 'bg-emerald-600' : 'bg-red-500'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 概要タブ */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-900 rounded-lg p-4">
              <h2 className="text-lg font-medium text-white mb-4">最近の注文</h2>
              <div className="space-y-3">
                {recentOrders.length === 0 ? (
                  <p className="text-gray-400 text-sm">注文がありません</p>
                ) : (
                  recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                      <div>
                        <p className="text-white text-sm truncate max-w-[200px]">
                          {order.articles?.title || '不明な記事'}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {order.buyer?.display_name || order.buyer?.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-medium">¥{order.amount.toLocaleString()}</p>
                        <p className="text-gray-500 text-xs">
                          {new Date(order.created_at).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-4">
              <h2 className="text-lg font-medium text-white mb-4">審査待ち記事</h2>
              <div className="space-y-3">
                {pendingArticles.length === 0 ? (
                  <p className="text-gray-400 text-sm">審査待ちの記事はありません</p>
                ) : (
                  pendingArticles.slice(0, 5).map((article) => (
                    <div key={article.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                      <div>
                        <p className="text-white text-sm truncate max-w-[200px]">{article.title}</p>
                        <p className="text-gray-400 text-xs">
                          {article.users?.display_name || article.users?.email}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                        審査待ち
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 記事審査タブ */}
        {activeTab === 'review' && (
          <div className="bg-gray-900 rounded-lg p-4">
            <h2 className="text-lg font-medium text-white mb-4">審査待ち記事</h2>
            {pendingArticles.length === 0 ? (
              <div className="text-center py-8">
                <Check className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">審査待ちの記事はありません</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingArticles.map((article) => (
                  <div key={article.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <p className="text-white font-medium">{article.title}</p>
                      <p className="text-gray-400 text-sm">
                        {article.users?.display_name || article.users?.email} ・{' '}
                        {new Date(article.created_at).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/articles/${article.slug}`}
                        target="_blank"
                        className="flex items-center gap-1 px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
                      >
                        <Eye className="w-4 h-4" />
                        確認
                      </Link>
                      <button
                        onClick={() => handleArticleReview(article.id, true)}
                        disabled={processing === article.id}
                        className="flex items-center gap-1 px-3 py-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition disabled:opacity-50"
                      >
                        {processing === article.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        承認
                      </button>
                      <button
                        onClick={() => handleArticleReview(article.id, false)}
                        disabled={processing === article.id}
                        className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        却下
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ホームページ管理タブ */}
        {activeTab === 'sections' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={saveSections}
                disabled={savingSections}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition disabled:opacity-50"
              >
                {savingSections ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                保存
              </button>
            </div>

            {/* 人気記事セクション */}
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-yellow-400" />
                <h2 className="text-lg font-medium text-white">人気の記事</h2>
                <span className="text-gray-400 text-sm">({popularArticles.length}件)</span>
              </div>

              {/* 選択済み記事 */}
              <div className="space-y-2 mb-4">
                {popularArticles.length === 0 ? (
                  <p className="text-gray-400 text-sm py-4 text-center">記事を追加してください</p>
                ) : (
                  popularArticles.map((articleId, index) => {
                    const article = getArticleById(articleId)
                    if (!article) return null
                    return (
                      <div key={articleId} className="flex items-center gap-2 p-2 bg-gray-800 rounded">
                        <GripVertical className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-400 text-sm w-6">{index + 1}</span>
                        <span className="text-white flex-1 truncate">{article.title}</span>
                        <button
                          onClick={() => moveArticle('popular', index, 'up')}
                          disabled={index === 0}
                          className="px-2 py-1 text-gray-400 hover:text-white disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveArticle('popular', index, 'down')}
                          disabled={index === popularArticles.length - 1}
                          className="px-2 py-1 text-gray-400 hover:text-white disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeFromSection('popular', articleId)}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>

              {/* 記事追加 */}
              <details className="group">
                <summary className="flex items-center gap-2 cursor-pointer text-emerald-400 hover:text-emerald-300">
                  <Plus className="w-4 h-4" />
                  記事を追加
                </summary>
                <div className="mt-2 max-h-60 overflow-y-auto space-y-1 border-t border-gray-700 pt-2">
                  {publishedArticles
                    .filter(a => !popularArticles.includes(a.id))
                    .map((article) => (
                      <button
                        key={article.id}
                        onClick={() => addToSection('popular', article.id)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded truncate"
                      >
                        {article.title}
                      </button>
                    ))}
                </div>
              </details>
            </div>

            {/* 編集部おすすめセクション */}
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-medium text-white">編集部おすすめ</h2>
                <span className="text-gray-400 text-sm">({editorPicks.length}件)</span>
              </div>

              {/* 選択済み記事 */}
              <div className="space-y-2 mb-4">
                {editorPicks.length === 0 ? (
                  <p className="text-gray-400 text-sm py-4 text-center">記事を追加してください</p>
                ) : (
                  editorPicks.map((articleId, index) => {
                    const article = getArticleById(articleId)
                    if (!article) return null
                    return (
                      <div key={articleId} className="flex items-center gap-2 p-2 bg-gray-800 rounded">
                        <GripVertical className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-400 text-sm w-6">{index + 1}</span>
                        <span className="text-white flex-1 truncate">{article.title}</span>
                        <button
                          onClick={() => moveArticle('editor_picks', index, 'up')}
                          disabled={index === 0}
                          className="px-2 py-1 text-gray-400 hover:text-white disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveArticle('editor_picks', index, 'down')}
                          disabled={index === editorPicks.length - 1}
                          className="px-2 py-1 text-gray-400 hover:text-white disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeFromSection('editor_picks', articleId)}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>

              {/* 記事追加 */}
              <details className="group">
                <summary className="flex items-center gap-2 cursor-pointer text-emerald-400 hover:text-emerald-300">
                  <Plus className="w-4 h-4" />
                  記事を追加
                </summary>
                <div className="mt-2 max-h-60 overflow-y-auto space-y-1 border-t border-gray-700 pt-2">
                  {publishedArticles
                    .filter(a => !editorPicks.includes(a.id))
                    .map((article) => (
                      <button
                        key={article.id}
                        onClick={() => addToSection('editor_picks', article.id)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded truncate"
                      >
                        {article.title}
                      </button>
                    ))}
                </div>
              </details>
            </div>
          </div>
        )}

        {/* 出金申請タブ */}
        {activeTab === 'withdrawals' && (
          <div className="bg-gray-900 rounded-lg p-4">
            <h2 className="text-lg font-medium text-white mb-4">未処理の出金申請</h2>
            {withdrawals.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">未処理の出金申請はありません</p>
              </div>
            ) : (
              <div className="space-y-4">
                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-white font-medium">¥{withdrawal.amount.toLocaleString()}</p>
                      <p className="text-gray-400 text-sm">
                        {withdrawal.users?.display_name || withdrawal.users?.email}
                      </p>
                      <p className="text-gray-500 text-xs">
                        申請日: {new Date(withdrawal.created_at).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleWithdrawal(withdrawal.id, true)}
                        disabled={processing === withdrawal.id}
                        className="flex items-center gap-1 px-3 py-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition disabled:opacity-50"
                      >
                        {processing === withdrawal.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        承認
                      </button>
                      <button
                        onClick={() => handleWithdrawal(withdrawal.id, false)}
                        disabled={processing === withdrawal.id}
                        className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        却下
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 記事一覧タブ */}
        {activeTab === 'articles' && (
          <div className="bg-gray-900 rounded-lg p-4">
            <h2 className="text-lg font-medium text-white mb-4">全記事一覧</h2>
            <div className="space-y-3">
              {allArticles.map((article) => (
                <div key={article.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{article.title}</p>
                    <p className="text-gray-400 text-sm">
                      {article.users?.display_name || article.users?.email} ・{' '}
                      {new Date(article.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      article.status === 'published'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : article.status === 'pending_review'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : article.status === 'rejected'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {article.status === 'published' ? '公開中' :
                       article.status === 'pending_review' ? '審査待ち' :
                       article.status === 'rejected' ? '却下' : '下書き'}
                    </span>
                    <Link
                      href={`/editor?id=${article.id}`}
                      className="px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition"
                    >
                      編集
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
