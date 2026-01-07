// src/pages/PaymentSettingsPage.tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { CheckCircle, AlertCircle, ExternalLink, Loader2, Wallet, TrendingUp } from 'lucide-react';

type EarningsSummary = {
  total_sales: number;
  total_earnings: number;
  transferred_amount: number;
  pending_amount: number;
};

export default function PaymentSettingsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [authorEarnings, setAuthorEarnings] = useState<EarningsSummary | null>(null);
  const [affiliateEarnings, setAffiliateEarnings] = useState<EarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // URLパラメータでメッセージ表示
    if (searchParams.get('success') === 'true') {
      setMessage({ type: 'success', text: '口座設定が完了しました' });
      // パラメータをクリア
      window.history.replaceState({}, '', window.location.pathname);
    } else if (searchParams.get('refresh') === 'true') {
      setMessage({ type: 'error', text: '設定が中断されました。再度お試しください' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProfile();
    fetchEarnings();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_account_status, stripe_payouts_enabled')
      .eq('id', user.id)
      .single();
    setProfile(data);
    setLoading(false);
  };

  const fetchEarnings = async () => {
    if (!user) return;

    // 作者としての売上
    const { data: authorData } = await supabase
      .from('orders')
      .select('author_amount, transfer_status')
      .eq('author_id', user.id)
      .eq('status', 'paid');

    if (authorData && authorData.length > 0) {
      setAuthorEarnings({
        total_sales: authorData.length,
        total_earnings: authorData.reduce((sum, o) => sum + (o.author_amount || 0), 0),
        transferred_amount: authorData
          .filter(o => o.transfer_status === 'completed')
          .reduce((sum, o) => sum + (o.author_amount || 0), 0),
        pending_amount: authorData
          .filter(o => ['ready', 'held'].includes(o.transfer_status))
          .reduce((sum, o) => sum + (o.author_amount || 0), 0),
      });
    }

    // アフィリエイトとしての売上
    const { data: affData } = await supabase
      .from('orders')
      .select('affiliate_amount, transfer_status')
      .eq('affiliate_user_id', user.id)
      .eq('status', 'paid')
      .gt('affiliate_amount', 0);

    if (affData && affData.length > 0) {
      setAffiliateEarnings({
        total_sales: affData.length,
        total_earnings: affData.reduce((sum, o) => sum + (o.affiliate_amount || 0), 0),
        transferred_amount: affData
          .filter(o => o.transfer_status === 'completed')
          .reduce((sum, o) => sum + (o.affiliate_amount || 0), 0),
        pending_amount: affData
          .filter(o => ['ready', 'held'].includes(o.transfer_status))
          .reduce((sum, o) => sum + (o.affiliate_amount || 0), 0),
      });
    }
  };

  const handleCreateAccount = async () => {
    setActionLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-connect-account`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionData.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const result = await response.json();
      if (result.account_id) {
        await handleStartOnboarding();
      } else if (result.error) {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      console.error('Error creating account:', error);
      setMessage({ type: 'error', text: 'アカウント作成に失敗しました' });
    }
    setActionLoading(false);
  };

  const handleStartOnboarding = async () => {
    setActionLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-account-link`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionData.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refreshUrl: `${window.location.origin}/settings/payments?refresh=true`,
            returnUrl: `${window.location.origin}/settings/payments?success=true`,
          }),
        }
      );
      const result = await response.json();
      if (result.url) {
        window.location.href = result.url;
      } else if (result.error) {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'リンク作成に失敗しました' });
    }
    setActionLoading(false);
  };

  const handleOpenDashboard = async () => {
    setActionLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-connect-dashboard`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionData.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const result = await response.json();
      if (result.url) {
        window.open(result.url, '_blank');
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">お支払い設定</h1>

        {/* メッセージ表示 */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
          </div>
        )}

        {/* 売上サマリー */}
        {(authorEarnings || affiliateEarnings) && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {authorEarnings && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Wallet className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold">記事売上</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">総売上</span>
                    <span className="font-bold">¥{authorEarnings.total_earnings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">振込済み</span>
                    <span>¥{authorEarnings.transferred_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">振込待ち</span>
                    <span className="text-orange-600">¥{authorEarnings.pending_amount.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t text-sm text-gray-500">
                    {authorEarnings.total_sales}件の販売
                  </div>
                </div>
              </div>
            )}
            {affiliateEarnings && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold">アフィリエイト報酬</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">総報酬</span>
                    <span className="font-bold">¥{affiliateEarnings.total_earnings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">振込済み</span>
                    <span>¥{affiliateEarnings.transferred_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">振込待ち</span>
                    <span className="text-orange-600">¥{affiliateEarnings.pending_amount.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t text-sm text-gray-500">
                    {affiliateEarnings.total_sales}件の紹介
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 振込口座設定 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">振込口座設定</h2>

          {!profile?.stripe_account_id ? (
            <div>
              <p className="text-gray-600 mb-4">
                記事を販売したり、アフィリエイト報酬を受け取るには、
                振込口座の設定が必要です。
              </p>
              <button
                onClick={handleCreateAccount}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {actionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Wallet className="w-5 h-5" />
                )}
                <span>{actionLoading ? '処理中...' : '口座を設定する'}</span>
              </button>
            </div>
          ) : profile?.stripe_payouts_enabled ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-medium">設定完了</span>
              </div>
              <p className="text-gray-600 mb-4">
                口座設定が完了しています。売上は自動的に振り込まれます。
              </p>
              <button
                onClick={handleOpenDashboard}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition"
              >
                {actionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ExternalLink className="w-5 h-5" />
                )}
                <span>口座ダッシュボードを開く</span>
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-700 font-medium">設定未完了</span>
              </div>
              <p className="text-gray-600 mb-4">
                口座設定を完了してください。本人確認と口座情報の登録が必要です。
              </p>
              <button
                onClick={handleStartOnboarding}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {actionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ExternalLink className="w-5 h-5" />
                )}
                <span>{actionLoading ? '処理中...' : '設定を続ける'}</span>
              </button>
            </div>
          )}
        </div>

        {/* 注意事項 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
          <h3 className="font-medium text-gray-700 mb-2">注意事項</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>売上の振込には口座設定が必要です</li>
            <li>口座設定が完了するまで、売上は保留されます</li>
            <li>プラットフォーム手数料は10%です</li>
            <li>振込は売上確定後、自動的に処理されます</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
