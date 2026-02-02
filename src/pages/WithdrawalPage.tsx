// src/pages/WithdrawalPage.tsx
// 出金申請ページ（口座登録・本人確認を分離）

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import BankAccountForm from '../components/BankAccountForm';
import IdentityVerificationForm from '../components/IdentityVerificationForm';
import {
  Wallet,
  AlertCircle,
  CheckCircle,
  Loader2,
  XCircle,
  Clock,
  ArrowRight,
  Info,
  CreditCard,
  User,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const MINIMUM_WITHDRAWAL = 3000;

type Balance = {
  author_amount: number;
  affiliate_amount: number;
  total_amount: number;
  pending_withdrawal_amount: number;
  withdrawable_amount: number;
  minimum_withdrawal: number;
};

type WithdrawRequest = {
  id: string;
  amount_jpy: number;
  status: string;
  requested_at: string;
  processed_at: string | null;
  stripe_transfer_id: string | null;
  failure_reason: string | null;
};

type AccountStatus = {
  has_stripe_account: boolean;
  bank_account_registered: boolean;
  kyc_submitted: boolean;
  payouts_enabled: boolean;
};

export default function WithdrawalPage() {
  const { user, session } = useAuth();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [requests, setRequests] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // セクション表示制御
  const [showBankForm, setShowBankForm] = useState(false);
  const [showKycForm, setShowKycForm] = useState(false);
  const [redirectingToStripe, setRedirectingToStripe] = useState(false);

  useEffect(() => {
    if (user && session) {
      loadData();
    }
  }, [user, session]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadBalance(), loadAccountStatus(), loadRequests()]);
    } finally {
      setLoading(false);
    }
  };

  const loadBalance = async () => {
    if (!session) return;

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
  };

  const loadAccountStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_payouts_enabled, bank_account_registered, kyc_submitted')
      .eq('id', user.id)
      .single();

    setAccountStatus({
      has_stripe_account: !!data?.stripe_account_id,
      bank_account_registered: data?.bank_account_registered ?? false,
      kyc_submitted: data?.kyc_submitted ?? false,
      payouts_enabled: data?.stripe_payouts_enabled ?? false,
    });
  };

  const loadRequests = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('withdraw_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false })
      .limit(20);

    setRequests(data || []);
  };

  const handleSubmit = async () => {
    if (!session || !amount) return;

    const amountNum = parseInt(amount, 10);
    if (isNaN(amountNum) || amountNum < MINIMUM_WITHDRAWAL) {
      setMessage({ type: 'error', text: `最低出金額は${MINIMUM_WITHDRAWAL.toLocaleString()}円です` });
      return;
    }

    if (balance && amountNum > balance.withdrawable_amount) {
      setMessage({ type: 'error', text: '出金可能額を超えています' });
      return;
    }

    setShowConfirm(false);
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

      if (data.success) {
        setMessage({
          type: 'success',
          text: `¥${amountNum.toLocaleString()} の出金申請を受け付けました。月末に振り込まれます。`,
        });
        setAmount('');
        await loadData();
      } else {
        setMessage({ type: 'error', text: data.message || '申請に失敗しました' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: '申請処理中にエラーが発生しました' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (requestId: string) => {
    if (!session || !confirm('この出金申請をキャンセルしますか？')) return;

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/cancel-withdrawal`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ request_id: requestId }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: '出金申請をキャンセルしました' });
        await loadData();
      } else {
        setMessage({ type: 'error', text: data.message || 'キャンセルに失敗しました' });
      }
    } catch {
      setMessage({ type: 'error', text: 'キャンセル処理中にエラーが発生しました' });
    }
  };

  const handleBankComplete = () => {
    setMessage({ type: 'success', text: '口座登録が完了しました！' });
    loadAccountStatus();
    setShowBankForm(false);
  };

  const handleKycComplete = () => {
    setMessage({ type: 'success', text: '本人確認情報を登録しました！' });
    loadAccountStatus();
    setShowKycForm(false);
  };

  // Stripeで追加認証が必要な場合のリダイレクト
  const handleStripeRedirect = async () => {
    if (!session) return;

    setRedirectingToStripe(true);
    setMessage(null);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-account-link`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/withdrawal?success=true`,
          refreshUrl: `${window.location.origin}/withdrawal?refresh=true`,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessage({ type: 'error', text: data.error || 'リンクの取得に失敗しました' });
        setRedirectingToStripe(false);
      }
    } catch (err) {
      setMessage({ type: 'error', text: '通信エラーが発生しました' });
      setRedirectingToStripe(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string; icon: typeof Clock }> = {
      requested: { color: 'bg-blue-100 text-blue-800', label: '申請中', icon: Clock },
      queued: { color: 'bg-yellow-100 text-yellow-800', label: '振込待ち', icon: Clock },
      processing: { color: 'bg-purple-100 text-purple-800', label: '処理中', icon: Loader2 },
      paid: { color: 'bg-green-100 text-green-800', label: '振込完了', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', label: '失敗', icon: XCircle },
      canceled: { color: 'bg-gray-100 text-gray-600', label: 'キャンセル', icon: XCircle },
    };

    const c = config[status] || config.requested;
    const Icon = c.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${c.color}`}>
        <Icon className="w-3 h-3" />
        {c.label}
      </span>
    );
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

  const canWithdraw = accountStatus?.bank_account_registered &&
                      accountStatus?.kyc_submitted &&
                      (balance?.withdrawable_amount || 0) >= MINIMUM_WITHDRAWAL;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">出金申請</h1>

        {/* メッセージ */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : message.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : message.type === 'error' ? (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-auto text-gray-500 hover:text-gray-700">
              ×
            </button>
          </div>
        )}

        {/* 残高と設定状況 */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* 残高カード */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">残高</h2>
            </div>

            {balance && (
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-gray-600">出金可能額</span>
                  <span className="text-3xl font-bold text-gray-900">
                    ¥{balance.withdrawable_amount.toLocaleString()}
                  </span>
                </div>

                <div className="pt-4 border-t space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">記事売上</span>
                    <span>¥{balance.author_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">アフィリエイト報酬</span>
                    <span>¥{balance.affiliate_amount.toLocaleString()}</span>
                  </div>
                  {balance.pending_withdrawal_amount > 0 && (
                    <div className="flex justify-between text-yellow-600">
                      <span>申請中</span>
                      <span>-¥{balance.pending_withdrawal_amount.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 text-xs text-gray-500">
                  最低出金額: ¥{MINIMUM_WITHDRAWAL.toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* 設定状況カード */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">出金設定</h2>

            <div className="space-y-4">
              {/* 口座登録 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <span>口座登録</span>
                </div>
                {accountStatus?.bank_account_registered ? (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    完了
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-yellow-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    未登録
                  </span>
                )}
              </div>

              {/* 本人確認 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-600" />
                  <span>本人確認</span>
                </div>
                {accountStatus?.kyc_submitted ? (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    完了
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-yellow-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    未登録
                  </span>
                )}
              </div>

              {/* 出金可否 */}
              {accountStatus?.bank_account_registered && accountStatus?.kyc_submitted ? (
                <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  出金申請が可能です
                </div>
              ) : (
                <div className="p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  口座登録と本人確認を完了すると出金申請できます
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 口座登録セクション */}
        <div className="mt-6">
          <button
            onClick={() => setShowBankForm(!showBankForm)}
            className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span className="font-medium">口座登録</span>
              {accountStatus?.bank_account_registered ? (
                <span className="text-sm text-green-600">（登録済み）</span>
              ) : (
                <span className="text-sm text-yellow-600">（未登録）</span>
              )}
            </div>
            {showBankForm ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showBankForm && (
            <div className="mt-4">
              <BankAccountForm
                onComplete={handleBankComplete}
                currentStatus={accountStatus?.bank_account_registered ? 'registered' : 'none'}
              />
            </div>
          )}
        </div>

        {/* 本人確認セクション */}
        <div className="mt-4">
          <button
            onClick={() => setShowKycForm(!showKycForm)}
            className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-green-600" />
              <span className="font-medium">本人確認</span>
              {accountStatus?.kyc_submitted ? (
                <span className="text-sm text-green-600">（登録済み）</span>
              ) : (
                <span className="text-sm text-yellow-600">（未登録）</span>
              )}
            </div>
            {showKycForm ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showKycForm && (
            <div className="mt-4">
              <IdentityVerificationForm
                onComplete={handleKycComplete}
                currentStatus={accountStatus?.kyc_submitted ? 'verified' : 'none'}
              />
            </div>
          )}
        </div>

        {/* Stripeで追加認証が必要な場合（口座・本人確認完了後、payouts_enabledがfalseの場合） */}
        {accountStatus?.bank_account_registered &&
         accountStatus?.kyc_submitted &&
         !accountStatus?.payouts_enabled && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-yellow-800 mb-2">追加認証が必要です</h3>
                <p className="text-sm text-yellow-700 mb-4">
                  Stripeから追加の本人確認が求められています。
                  下のボタンからStripeのページで認証を完了してください。
                </p>
                <button
                  onClick={handleStripeRedirect}
                  disabled={redirectingToStripe}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition"
                >
                  {redirectingToStripe ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      移動中...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      Stripeで認証を完了
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 出金申請フォーム */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">出金申請</h2>

          {!accountStatus?.bank_account_registered || !accountStatus?.kyc_submitted ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
              <p className="mb-2">出金申請には口座登録と本人確認が必要です</p>
              <p className="text-sm text-gray-400">
                上のセクションから設定を完了してください
              </p>
            </div>
          ) : (balance?.withdrawable_amount || 0) < MINIMUM_WITHDRAWAL ? (
            <div className="text-center py-8 text-gray-500">
              <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>出金可能額が最低出金額（¥{MINIMUM_WITHDRAWAL.toLocaleString()}）に達していません</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">出金額</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min={MINIMUM_WITHDRAWAL}
                    max={balance?.withdrawable_amount || 0}
                    placeholder={MINIMUM_WITHDRAWAL.toLocaleString()}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-gray-500">最低: ¥{MINIMUM_WITHDRAWAL.toLocaleString()}</span>
                  <button
                    type="button"
                    onClick={() => setAmount(String(balance?.withdrawable_amount || 0))}
                    className="text-blue-600 hover:underline"
                  >
                    全額申請
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowConfirm(true)}
                disabled={!amount || parseInt(amount) < MINIMUM_WITHDRAWAL || submitting}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                出金申請する
              </button>

              <p className="text-xs text-gray-500 text-center">
                申請は月末にまとめて処理され、登録口座に振り込まれます
              </p>
            </div>
          )}
        </div>

        {/* 確認モーダル */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">出金申請の確認</h3>
              <div className="mb-6">
                <p className="text-gray-600 mb-4">以下の内容で出金申請を行います：</p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between text-lg">
                    <span>出金額</span>
                    <span className="font-bold">¥{parseInt(amount || '0').toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  振込は月末にまとめて処理されます。申請後のキャンセルは振込処理開始前まで可能です。
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  戻る
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? '処理中...' : '申請する'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 申請履歴 */}
        {requests.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">申請履歴</h2>
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">¥{req.amount_jpy.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(req.requested_at).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                    {req.failure_reason && (
                      <div className="text-sm text-red-600 mt-1">{req.failure_reason}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(req.status)}
                    {req.status === 'queued' && (
                      <button
                        onClick={() => handleCancel(req.id)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        キャンセル
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 注意事項 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
          <h3 className="font-medium text-gray-700 mb-2">注意事項</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>最低出金額は¥{MINIMUM_WITHDRAWAL.toLocaleString()}です</li>
            <li>出金申請は月末にまとめて処理されます</li>
            <li>振込処理開始前であればキャンセル可能です</li>
            <li>プラットフォーム手数料（15%）は売上時点で差し引かれています</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
