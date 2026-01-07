// src/pages/SalesManagement.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import {
  TrendingUp,
  FileText,
  Users,
  Wallet,
  AlertCircle,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const MINIMUM_WITHDRAWAL = 3000;

type SalesSummary = {
  todaySales: number;
  thisMonthSales: number;
  totalSales: number;
  todayAffiliate: number;
  thisMonthAffiliate: number;
  totalAffiliate: number;
};

type SaleRecord = {
  id: string;
  amount: number;
  author_amount: number;
  affiliate_amount: number;
  affiliate_user_id: string | null;
  paid_at: string;
  article: { title: string } | null;
  buyer: { display_name: string | null } | null;
};

type AffiliateRecord = {
  id: string;
  amount: number;
  affiliate_amount: number;
  paid_at: string;
  article: { title: string; author_id: string } | null;
  author: { display_name: string | null } | null;
};

type WithdrawRequest = {
  id: string;
  amount_jpy: number;
  status: string;
  requested_at: string;
  processed_at: string | null;
};

type Balance = {
  author_amount: number;
  affiliate_amount: number;
  total_amount: number;
  pending_withdrawal_amount: number;
  withdrawable_amount: number;
};

export default function SalesManagement() {
  const { user, session, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'summary' | 'sales' | 'affiliate' | 'withdrawal'>('summary');
  const [loading, setLoading] = useState(true);

  // Summary
  const [summary, setSummary] = useState<SalesSummary>({
    todaySales: 0,
    thisMonthSales: 0,
    totalSales: 0,
    todayAffiliate: 0,
    thisMonthAffiliate: 0,
    totalAffiliate: 0,
  });

  // Sales
  const [sales, setSales] = useState<SaleRecord[]>([]);

  // Affiliate
  const [affiliateEarnings, setAffiliateEarnings] = useState<AffiliateRecord[]>([]);

  // Withdrawal
  const [balance, setBalance] = useState<Balance | null>(null);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user && session) {
      loadData();
    }
  }, [user, session]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadSummary(),
        loadSales(),
        loadAffiliateEarnings(),
        loadBalance(),
        loadWithdrawRequests(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    if (!user) return;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Author sales
    const { data: authorOrders } = await supabase
      .from('orders')
      .select('author_amount, paid_at')
      .eq('author_id', user.id)
      .eq('status', 'paid');

    // Affiliate earnings
    const { data: affiliateOrders } = await supabase
      .from('orders')
      .select('affiliate_amount, paid_at')
      .eq('affiliate_user_id', user.id)
      .eq('status', 'paid');

    let todaySales = 0, thisMonthSales = 0, totalSales = 0;
    let todayAffiliate = 0, thisMonthAffiliate = 0, totalAffiliate = 0;

    (authorOrders || []).forEach(o => {
      totalSales += o.author_amount || 0;
      if (o.paid_at && o.paid_at >= monthStart) thisMonthSales += o.author_amount || 0;
      if (o.paid_at && o.paid_at >= todayStart) todaySales += o.author_amount || 0;
    });

    (affiliateOrders || []).forEach(o => {
      totalAffiliate += o.affiliate_amount || 0;
      if (o.paid_at && o.paid_at >= monthStart) thisMonthAffiliate += o.affiliate_amount || 0;
      if (o.paid_at && o.paid_at >= todayStart) todayAffiliate += o.affiliate_amount || 0;
    });

    setSummary({
      todaySales, thisMonthSales, totalSales,
      todayAffiliate, thisMonthAffiliate, totalAffiliate,
    });
  };

  const loadSales = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('orders')
      .select(`
        id, amount, author_amount, affiliate_amount, affiliate_user_id, paid_at,
        article:article_id (title),
        buyer:buyer_id (display_name)
      `)
      .eq('author_id', user.id)
      .eq('status', 'paid')
      .order('paid_at', { ascending: false })
      .limit(50);

    setSales((data || []) as SaleRecord[]);
  };

  const loadAffiliateEarnings = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('orders')
      .select(`
        id, amount, affiliate_amount, paid_at,
        article:article_id (title, author_id),
        author:author_id (display_name)
      `)
      .eq('affiliate_user_id', user.id)
      .eq('status', 'paid')
      .order('paid_at', { ascending: false })
      .limit(50);

    setAffiliateEarnings((data || []) as AffiliateRecord[]);
  };

  const loadBalance = async () => {
    if (!session) return;

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/get-balance`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setBalance(data);
      }
    } catch (err) {
      console.error('Failed to load balance:', err);
    }
  };

  const loadWithdrawRequests = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('withdraw_requests')
      .select('id, amount_jpy, status, requested_at, processed_at')
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false })
      .limit(20);

    setWithdrawRequests(data || []);
  };

  const handleWithdraw = async () => {
    if (!session || !withdrawAmount) return;

    const amountNum = parseInt(withdrawAmount, 10);
    if (isNaN(amountNum) || amountNum < MINIMUM_WITHDRAWAL) {
      setMessage({ type: 'error', text: `最低出金額は${MINIMUM_WITHDRAWAL.toLocaleString()}円です` });
      return;
    }

    if (balance && amountNum > balance.withdrawable_amount) {
      setMessage({ type: 'error', text: '出金可能額を超えています' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/request-withdrawal`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: amountNum }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '出金申請に失敗しました');
      }

      setMessage({ type: 'success', text: '出金申請を受け付けました' });
      setWithdrawAmount('');
      await Promise.all([loadBalance(), loadWithdrawRequests()]);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '出金申請に失敗しました' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      requested: 'bg-yellow-100 text-yellow-800',
      queued: 'bg-blue-100 text-blue-800',
      processing: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      canceled: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<string, string> = {
      requested: '申請中',
      queued: '処理待ち',
      processing: '処理中',
      paid: '完了',
      failed: '失敗',
      canceled: 'キャンセル',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const tabs = [
    { id: 'summary' as const, label: 'サマリ', icon: TrendingUp },
    { id: 'sales' as const, label: '販売明細', icon: FileText },
    { id: 'affiliate' as const, label: '紹介報酬', icon: Users },
    { id: 'withdrawal' as const, label: '出金', icon: Wallet },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-gray-600">読み込み中...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">売上管理</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Sales Summary */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">販売収益</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <div className="text-sm text-gray-600 mb-1">今日</div>
                  <div className="text-2xl font-bold text-gray-900">
                    ¥{summary.todaySales.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <div className="text-sm text-gray-600 mb-1">今月</div>
                  <div className="text-2xl font-bold text-gray-900">
                    ¥{summary.thisMonthSales.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <div className="text-sm text-gray-600 mb-1">累計</div>
                  <div className="text-2xl font-bold text-gray-900">
                    ¥{summary.totalSales.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Affiliate Summary */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">紹介報酬</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <div className="text-sm text-gray-600 mb-1">今日</div>
                  <div className="text-2xl font-bold text-orange-500">
                    ¥{summary.todayAffiliate.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <div className="text-sm text-gray-600 mb-1">今月</div>
                  <div className="text-2xl font-bold text-orange-500">
                    ¥{summary.thisMonthAffiliate.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <div className="text-sm text-gray-600 mb-1">累計</div>
                  <div className="text-2xl font-bold text-orange-500">
                    ¥{summary.totalAffiliate.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Balance */}
            {balance && (
              <div className="bg-gray-900 text-white rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">出金可能額</div>
                    <div className="text-3xl font-bold">
                      ¥{balance.withdrawable_amount.toLocaleString()}
                    </div>
                    {balance.pending_withdrawal_amount > 0 && (
                      <div className="text-sm text-gray-400 mt-1">
                        出金処理中: ¥{balance.pending_withdrawal_amount.toLocaleString()}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setActiveTab('withdrawal')}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition"
                  >
                    出金申請
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">販売明細</h2>
              <p className="text-sm text-gray-500">あなたの記事が購入された履歴</p>
            </div>

            {sales.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                まだ販売がありません
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {sales.map(sale => (
                  <div key={sale.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">
                          {sale.article?.title || '記事'}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          購入者: {sale.buyer?.display_name || '匿名'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {formatDate(sale.paid_at)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">
                          ¥{sale.author_amount.toLocaleString()}
                        </div>
                        {sale.affiliate_user_id && (
                          <div className="text-xs text-orange-500">
                            紹介経由
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Affiliate Tab */}
        {activeTab === 'affiliate' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">紹介報酬明細</h2>
              <p className="text-sm text-gray-500">あなたの紹介リンク経由で購入された履歴</p>
            </div>

            {affiliateEarnings.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                まだ紹介報酬がありません
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {affiliateEarnings.map(record => (
                  <div key={record.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">
                          {record.article?.title || '記事'}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          著者: {record.author?.display_name || '著者'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {formatDate(record.paid_at)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-orange-500">
                          ¥{record.affiliate_amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          売上 ¥{record.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Withdrawal Tab */}
        {activeTab === 'withdrawal' && (
          <div className="space-y-6">
            {/* Balance Card */}
            {balance && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">残高</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <div className="text-sm text-gray-500">販売収益</div>
                    <div className="text-lg font-bold">¥{balance.author_amount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">紹介報酬</div>
                    <div className="text-lg font-bold">¥{balance.affiliate_amount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">処理中</div>
                    <div className="text-lg font-bold text-gray-400">¥{balance.pending_withdrawal_amount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">出金可能</div>
                    <div className="text-lg font-bold text-green-600">¥{balance.withdrawable_amount.toLocaleString()}</div>
                  </div>
                </div>

                {/* Withdrawal Form */}
                {balance.withdrawable_amount >= MINIMUM_WITHDRAWAL ? (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          出金額
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                          <input
                            type="number"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            placeholder={`${MINIMUM_WITHDRAWAL.toLocaleString()}以上`}
                            min={MINIMUM_WITHDRAWAL}
                            max={balance.withdrawable_amount}
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleWithdraw}
                        disabled={submitting || !withdrawAmount}
                        className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 self-end"
                      >
                        {submitting ? '処理中...' : '出金申請'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      最低出金額: ¥{MINIMUM_WITHDRAWAL.toLocaleString()} / 振込手数料は出金額から差し引かれます
                    </p>
                  </div>
                ) : (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center gap-2 text-gray-500">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">
                        出金可能額が¥{MINIMUM_WITHDRAWAL.toLocaleString()}に達すると出金できます
                      </span>
                    </div>
                  </div>
                )}

                {/* Account Setup Warning */}
                {!profile?.stripe_payouts_enabled && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-yellow-800">口座登録が必要です</div>
                        <p className="text-sm text-yellow-700 mt-1">
                          出金を行うには、先に振込先口座を登録してください。
                        </p>
                        <Link
                          to="/withdrawal"
                          className="inline-flex items-center gap-1 text-sm text-yellow-800 font-medium mt-2 hover:underline"
                        >
                          口座を登録する
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {message && (
              <div className={`p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {message.text}
              </div>
            )}

            {/* Withdrawal History */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">出金履歴</h2>
              </div>

              {withdrawRequests.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  出金履歴がありません
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {withdrawRequests.map(req => (
                    <div key={req.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            ¥{req.amount_jpy.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(req.requested_at)}
                          </div>
                        </div>
                        <div>
                          {getStatusBadge(req.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
