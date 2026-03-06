'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Copy, Check, DollarSign, TrendingUp, Wallet, Clock, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Commission {
  id: string
  amount: number
  affiliate_amount: number | null
  created_at: string
  articles: { title: string } | null
}

interface Withdrawal {
  id: string
  amount: number
  status: string
  created_at: string
  processed_at: string | null
}

interface AffiliateClientProps {
  affiliateCode: string | null
  totalEarnings: number
  pendingBalance: number
  totalWithdrawn: number
  commissions: Commission[]
  withdrawals: Withdrawal[]
  userId: string
}

export default function AffiliateClient({
  affiliateCode: initialCode,
  totalEarnings,
  pendingBalance: initialBalance,
  totalWithdrawn,
  commissions,
  withdrawals: initialWithdrawals,
  userId,
}: AffiliateClientProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any
  const [affiliateCode, setAffiliateCode] = useState(initialCode)
  const [pendingBalance, setPendingBalance] = useState(initialBalance)
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [activeTab, setActiveTab] = useState<'earnings' | 'withdrawals'>('earnings')

  const generateCode = async () => {
    setGenerating(true)

    // ランダムなコードを生成
    const code = Math.random().toString(36).substring(2, 10).toUpperCase()

    const { error } = await supabase
      .from('users')
      .update({ affiliate_code: code })
      .eq('id', userId)

    if (!error) {
      setAffiliateCode(code)
    } else {
      toast.error('コードの生成に失敗しました')
    }

    setGenerating(false)
  }

  const copyLink = () => {
    if (!affiliateCode) return

    const url = `${window.location.origin}?ref=${affiliateCode}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const requestWithdrawal = async () => {
    if (pendingBalance < 1000) {
      toast.error('出金は1,000円以上から可能です')
      return
    }

    setRequesting(true)

    const { data, error } = await supabase
      .from('withdraw_requests')
      .insert({
        user_id: userId,
        amount: pendingBalance,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      toast.error('出金申請に失敗しました')
    } else {
      setWithdrawals((prev) => [data, ...prev])
      setPendingBalance(0)

      // ユーザーの残高を更新
      await supabase
        .from('users')
        .update({ affiliate_balance: 0 })
        .eq('id', userId)
    }

    setRequesting(false)
  }

  const statCards = [
    { label: '累計報酬', value: `¥${totalEarnings.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-400' },
    { label: '出金可能額', value: `¥${pendingBalance.toLocaleString()}`, icon: Wallet, color: 'text-yellow-400' },
    { label: '出金済み', value: `¥${totalWithdrawn.toLocaleString()}`, icon: DollarSign, color: 'text-blue-400' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-white mb-8">アフィリエイト管理</h1>

        {/* アフィリエイトリンク */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium text-white mb-4">あなたのアフィリエイトリンク</h2>
          {affiliateCode ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}?ref=${affiliateCode}`}
                readOnly
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
              <button
                onClick={copyLink}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    コピー済み
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    コピー
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-400 mb-4">
                アフィリエイトリンクを生成して、記事を紹介しましょう
              </p>
              <button
                onClick={generateCode}
                disabled={generating}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition disabled:opacity-50 mx-auto"
              >
                {generating && <Loader2 className="w-4 h-4 animate-spin" />}
                アフィリエイトリンクを生成
              </button>
            </div>
          )}
          <p className="text-sm text-gray-500 mt-3">
            このリンク経由で記事が購入されると、設定された報酬率に応じた報酬を受け取れます
          </p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-gray-400 text-sm">{stat.label}</span>
              </div>
              <div className="text-xl font-bold text-white">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* 出金申請ボタン */}
        {pendingBalance >= 1000 && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-400 font-medium">出金可能な報酬があります</p>
                <p className="text-gray-400 text-sm">¥{pendingBalance.toLocaleString()}を出金申請できます</p>
              </div>
              <button
                onClick={requestWithdrawal}
                disabled={requesting}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition disabled:opacity-50"
              >
                {requesting && <Loader2 className="w-4 h-4 animate-spin" />}
                出金申請
              </button>
            </div>
          </div>
        )}

        {/* タブナビゲーション */}
        <div className="flex gap-1 mb-6 bg-gray-900 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('earnings')}
            className={`px-4 py-2 rounded-md font-medium transition ${
              activeTab === 'earnings'
                ? 'bg-emerald-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            報酬履歴
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`px-4 py-2 rounded-md font-medium transition ${
              activeTab === 'withdrawals'
                ? 'bg-emerald-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            出金履歴
          </button>
        </div>

        {/* 報酬履歴 */}
        {activeTab === 'earnings' && (
          <div className="bg-gray-900 rounded-lg p-4">
            {commissions.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">報酬履歴はまだありません</p>
              </div>
            ) : (
              <div className="space-y-3">
                {commissions.map((commission) => (
                  <div
                    key={commission.id}
                    className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0"
                  >
                    <div>
                      <p className="text-white">{commission.articles?.title || '不明な記事'}</p>
                      <p className="text-gray-500 text-sm">
                        {new Date(commission.created_at).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-bold">
                        +¥{(commission.affiliate_amount || 0).toLocaleString()}
                      </p>
                      <p className="text-gray-500 text-xs">
                        売上: ¥{commission.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 出金履歴 */}
        {activeTab === 'withdrawals' && (
          <div className="bg-gray-900 rounded-lg p-4">
            {withdrawals.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">出金履歴はまだありません</p>
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0"
                  >
                    <div>
                      <p className="text-white">¥{withdrawal.amount.toLocaleString()}</p>
                      <p className="text-gray-500 text-sm">
                        申請日: {new Date(withdrawal.created_at).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {withdrawal.status === 'pending' && (
                        <span className="flex items-center gap-1 text-yellow-400 text-sm">
                          <Clock className="w-4 h-4" />
                          処理中
                        </span>
                      )}
                      {withdrawal.status === 'completed' && (
                        <span className="flex items-center gap-1 text-emerald-400 text-sm">
                          <Check className="w-4 h-4" />
                          完了
                        </span>
                      )}
                      {withdrawal.status === 'rejected' && (
                        <span className="text-red-400 text-sm">却下</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
