import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AffiliateClient from './AffiliateClient'

export const metadata = {
  title: 'アフィリエイト管理',
}

async function getAffiliateData(userId: string) {
  const supabase = await createClient()

  // ユーザーのアフィリエイトコード取得
  const { data: userData } = await supabase
    .from('users')
    .select('affiliate_code')
    .eq('id', userId)
    .single()

  const user = userData as { affiliate_code: string | null } | null

  // アフィリエイト報酬履歴取得
  const { data: commissions } = await supabase
    .from('orders')
    .select(`
      id,
      amount,
      affiliate_amount,
      created_at,
      articles (title)
    `)
    .eq('affiliate_user_id', userId)
    .eq('status', 'paid')
    .order('created_at', { ascending: false })

  // 出金履歴取得
  const { data: withdrawals } = await supabase
    .from('withdraw_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  // 統計計算
  type CommissionItem = { id: string; amount: number; affiliate_amount: number | null; created_at: string; articles: { title: string } | null }
  type WithdrawalItem = { id: string; amount: number; status: string; created_at: string; processed_at: string | null }

  const commissionsList = (commissions || []) as CommissionItem[]
  const withdrawalsList = (withdrawals || []) as WithdrawalItem[]

  const totalEarnings = commissionsList.reduce((sum, c) => sum + (c.affiliate_amount || 0), 0)
  const totalWithdrawn = withdrawalsList
    .filter((w) => w.status === 'completed')
    .reduce((sum, w) => sum + w.amount, 0)
  const pendingWithdrawals = withdrawalsList
    .filter((w) => w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0)
  const pendingBalance = totalEarnings - totalWithdrawn - pendingWithdrawals

  return {
    affiliateCode: user?.affiliate_code || null,
    totalEarnings,
    pendingBalance,
    totalWithdrawn,
    commissions: commissionsList,
    withdrawals: withdrawalsList,
  }
}

export default async function AffiliatePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin?redirect=/affiliate')
  }

  const data = await getAffiliateData(user.id)

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <AffiliateClient {...data} userId={user.id} />
    </Suspense>
  )
}
