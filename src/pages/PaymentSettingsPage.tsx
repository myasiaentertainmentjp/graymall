// src/pages/PaymentSettingsPage.tsx
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import {
  CheckCircle, AlertCircle, Loader2, Wallet, ChevronLeft,
  ChevronDown, ChevronUp, User, Building2
} from 'lucide-react';

// 日本の主要銀行リスト（銀行コード順）
const MAJOR_BANKS = [
  { code: '0001', name: 'みずほ銀行' },
  { code: '0005', name: '三菱UFJ銀行' },
  { code: '0009', name: '三井住友銀行' },
  { code: '0010', name: 'りそな銀行' },
  { code: '0017', name: '埼玉りそな銀行' },
  { code: '0033', name: 'ジャパンネット銀行' },
  { code: '0034', name: 'セブン銀行' },
  { code: '0035', name: 'ソニー銀行' },
  { code: '0036', name: '楽天銀行' },
  { code: '0038', name: '住信SBIネット銀行' },
  { code: '0039', name: 'auじぶん銀行' },
  { code: '0040', name: 'イオン銀行' },
  { code: '0041', name: '大和ネクスト銀行' },
  { code: '0042', name: 'ローソン銀行' },
  { code: '0043', name: 'みんなの銀行' },
  { code: '0044', name: 'UI銀行' },
  { code: '0116', name: '北海道銀行' },
  { code: '0117', name: '青森銀行' },
  { code: '0118', name: 'みちのく銀行' },
  { code: '0119', name: '秋田銀行' },
  { code: '0120', name: '北都銀行' },
  { code: '0121', name: '荘内銀行' },
  { code: '0122', name: '山形銀行' },
  { code: '0123', name: '岩手銀行' },
  { code: '0124', name: '東北銀行' },
  { code: '0125', name: '七十七銀行' },
  { code: '0126', name: '東邦銀行' },
  { code: '0128', name: '群馬銀行' },
  { code: '0129', name: '足利銀行' },
  { code: '0130', name: '常陽銀行' },
  { code: '0131', name: '筑波銀行' },
  { code: '0133', name: '武蔵野銀行' },
  { code: '0134', name: '千葉銀行' },
  { code: '0135', name: '千葉興業銀行' },
  { code: '0137', name: 'きらぼし銀行' },
  { code: '0138', name: '横浜銀行' },
  { code: '0140', name: '第四北越銀行' },
  { code: '0142', name: '山梨中央銀行' },
  { code: '0143', name: '八十二銀行' },
  { code: '0144', name: '北陸銀行' },
  { code: '0145', name: '富山銀行' },
  { code: '0146', name: '北國銀行' },
  { code: '0147', name: '福井銀行' },
  { code: '0149', name: '静岡銀行' },
  { code: '0150', name: 'スルガ銀行' },
  { code: '0151', name: '清水銀行' },
  { code: '0152', name: '大垣共立銀行' },
  { code: '0153', name: '十六銀行' },
  { code: '0154', name: '三十三銀行' },
  { code: '0155', name: '百五銀行' },
  { code: '0157', name: '滋賀銀行' },
  { code: '0158', name: '京都銀行' },
  { code: '0159', name: '関西みらい銀行' },
  { code: '0161', name: '池田泉州銀行' },
  { code: '0162', name: '南都銀行' },
  { code: '0163', name: '紀陽銀行' },
  { code: '0164', name: '但馬銀行' },
  { code: '0166', name: '鳥取銀行' },
  { code: '0167', name: '山陰合同銀行' },
  { code: '0168', name: '中国銀行' },
  { code: '0169', name: '広島銀行' },
  { code: '0170', name: '山口銀行' },
  { code: '0172', name: '阿波銀行' },
  { code: '0173', name: '百十四銀行' },
  { code: '0174', name: '伊予銀行' },
  { code: '0175', name: '四国銀行' },
  { code: '0177', name: '福岡銀行' },
  { code: '0178', name: '筑邦銀行' },
  { code: '0179', name: '佐賀銀行' },
  { code: '0180', name: '十八親和銀行' },
  { code: '0181', name: '肥後銀行' },
  { code: '0182', name: '大分銀行' },
  { code: '0183', name: '宮崎銀行' },
  { code: '0184', name: '鹿児島銀行' },
  { code: '0185', name: '琉球銀行' },
  { code: '0186', name: '沖縄銀行' },
  { code: '0188', name: '西日本シティ銀行' },
  { code: '0190', name: '北九州銀行' },
  { code: '9900', name: 'ゆうちょ銀行' },
];

type BankAccountStatus = {
  registered: boolean;
  last4?: string;
  bank_name?: string;
};

type IdentityStatus = {
  verified: boolean;
  pending: boolean;
  requirements?: string[];
};

export default function PaymentSettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 口座登録フォーム
  const [bankFormOpen, setBankFormOpen] = useState(false);
  const [accountType, setAccountType] = useState<'individual' | 'company'>('individual');
  const [bankSearch, setBankSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState<{ code: string; name: string } | null>(null);
  const [branchCode, setBranchCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankSuggestions, setBankSuggestions] = useState<typeof MAJOR_BANKS>([]);
  const [showBankDropdown, setShowBankDropdown] = useState(false);

  // 本人確認フォーム
  const [identityFormOpen, setIdentityFormOpen] = useState(false);

  // ステータス
  const [bankAccountStatus, setBankAccountStatus] = useState<BankAccountStatus>({ registered: false });
  const [identityStatus, setIdentityStatus] = useState<IdentityStatus>({ verified: false, pending: false });

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setMessage({ type: 'success', text: '設定が完了しました' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_account_status, stripe_payouts_enabled, bank_account_registered, bank_account_last4, bank_name')
      .eq('id', user.id)
      .single();

    setProfile(data);

    if (data) {
      setBankAccountStatus({
        registered: data.bank_account_registered || false,
        last4: data.bank_account_last4,
        bank_name: data.bank_name,
      });

      // 本人確認ステータスをStripeから取得
      if (data.stripe_account_id) {
        await checkIdentityStatus(data.stripe_account_id);
      }
    }

    setLoading(false);
  };

  const checkIdentityStatus = async (accountId: string) => {
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
          body: JSON.stringify({ checkOnly: true }),
        }
      );
      const result = await response.json();

      if (result.requirements) {
        setIdentityStatus({
          verified: result.requirements.currently_due?.length === 0,
          pending: result.requirements.pending_verification?.length > 0,
          requirements: result.requirements.currently_due,
        });
      }
    } catch (err) {
      console.error('Error checking identity:', err);
    }
  };

  // 銀行検索
  const handleBankSearch = (value: string) => {
    setBankSearch(value);
    setSelectedBank(null);

    if (value.length > 0) {
      const filtered = MAJOR_BANKS.filter(
        bank => bank.name.includes(value) || bank.code.includes(value)
      );
      setBankSuggestions(filtered);
      setShowBankDropdown(true);
    } else {
      setBankSuggestions([]);
      setShowBankDropdown(false);
    }
  };

  const selectBank = (bank: typeof MAJOR_BANKS[0]) => {
    setSelectedBank(bank);
    setBankSearch(bank.name);
    setShowBankDropdown(false);
  };

  // 口座登録
  const handleRegisterBankAccount = async () => {
    if (!selectedBank || !branchCode || !accountNumber || !accountHolderName) {
      setMessage({ type: 'error', text: '必須項目をすべて入力してください' });
      return;
    }

    if (branchCode.length !== 3) {
      setMessage({ type: 'error', text: '支店コードは3桁で入力してください' });
      return;
    }

    if (accountNumber.length !== 7) {
      setMessage({ type: 'error', text: '口座番号は7桁で入力してください' });
      return;
    }

    // カタカナチェック
    if (!/^[ァ-ヶー\s]+$/.test(accountHolderName)) {
      setMessage({ type: 'error', text: '口座名義は全角カタカナで入力してください' });
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/register-bank-account`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionData.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            account_type: accountType,
            bank_code: selectedBank.code,
            branch_code: branchCode,
            account_number: accountNumber,
            account_holder_name: accountHolderName,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: '口座登録が完了しました' });
        setBankAccountStatus({
          registered: true,
          last4: result.last4,
          bank_name: selectedBank.name,
        });
        setBankFormOpen(false);
        await fetchProfile();
      } else {
        setMessage({ type: 'error', text: result.error || '口座登録に失敗しました' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: '口座登録に失敗しました' });
    } finally {
      setActionLoading(false);
    }
  };

  // 本人確認（Stripe Connect Onboarding）
  const handleStartIdentityVerification = async () => {
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
      setMessage({ type: 'error', text: '本人確認の開始に失敗しました' });
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
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          設定に戻る
        </button>

        <div className="flex items-center gap-3 mb-6">
          <Wallet className="w-6 h-6 text-gray-700" />
          <h1 className="text-2xl font-bold text-gray-900">振込口座設定</h1>
        </div>

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

        {/* 口座登録セクション */}
        <div className="bg-white rounded-lg border border-gray-200 mb-4 overflow-hidden">
          <button
            onClick={() => setBankFormOpen(!bankFormOpen)}
            className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-gray-600" />
              <span className="font-medium">口座登録</span>
              {bankAccountStatus.registered && (
                <span className="text-sm text-green-600">（登録済み）</span>
              )}
            </div>
            {bankFormOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {bankFormOpen && (
            <div className="px-4 pb-4 border-t border-gray-100">
              {bankAccountStatus.registered ? (
                <div className="py-4">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">登録済み</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {bankAccountStatus.bank_name} ****{bankAccountStatus.last4}
                  </p>
                  <button
                    onClick={() => setBankAccountStatus({ ...bankAccountStatus, registered: false })}
                    className="mt-3 text-sm text-blue-600 hover:underline"
                  >
                    口座を変更する
                  </button>
                </div>
              ) : (
                <div className="py-4 space-y-4">
                  {/* ステータス */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <span className="text-orange-800 font-medium">ステータス: 未登録</span>
                  </div>

                  {/* 個人/法人選択 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      個人か法人かお選びください
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="accountType"
                          checked={accountType === 'individual'}
                          onChange={() => setAccountType('individual')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <User className="w-4 h-4 text-gray-500" />
                        <span>個人</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="accountType"
                          checked={accountType === 'company'}
                          onChange={() => setAccountType('company')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <Building2 className="w-4 h-4 text-gray-500" />
                        <span>法人</span>
                      </label>
                    </div>
                  </div>

                  {/* 銀行名 */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      銀行名
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      銀行名を入力後、リストから選択してください。
                    </p>
                    <input
                      type="text"
                      value={bankSearch}
                      onChange={(e) => handleBankSearch(e.target.value)}
                      onFocus={() => bankSearch && setShowBankDropdown(true)}
                      placeholder="例: みずほ銀行"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {showBankDropdown && bankSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {bankSuggestions.map(bank => (
                          <button
                            key={bank.code}
                            onClick={() => selectBank(bank)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex justify-between items-center"
                          >
                            <span>{bank.name}</span>
                            <span className="text-xs text-gray-400">{bank.code}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 支店コード */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      支店コード（3桁）
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      通帳やキャッシュカードに記載の支店コードを入力してください。
                    </p>
                    <input
                      type="text"
                      value={branchCode}
                      onChange={(e) => setBranchCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      placeholder="例: 001"
                      maxLength={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 口座番号 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      口座番号（半角7ケタ）
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      半角6ケタの場合は先頭に「0」を追加してください。
                    </p>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 7))}
                      placeholder="例: 1234567"
                      maxLength={7}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 口座名義カナ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      口座名義カナ（全角）
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      姓と名の間に全角スペースを入れてください。
                    </p>
                    <input
                      type="text"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="例: ヤマダ　タロウ"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      金融機関に登録いただいている口座名義のフリガナを正確にご入力ください。<br />
                      完全一致しない場合はお振込できないため、正しい情報を入力いただくようお願いします。
                    </p>
                  </div>

                  {/* 登録ボタン */}
                  <button
                    onClick={handleRegisterBankAccount}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Wallet className="w-5 h-5" />
                    )}
                    <span>{actionLoading ? '処理中...' : '口座を登録する'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 本人確認セクション */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
          <button
            onClick={() => setIdentityFormOpen(!identityFormOpen)}
            className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-600" />
              <span className="font-medium">本人確認</span>
              {identityStatus.verified && (
                <span className="text-sm text-green-600">（登録済み）</span>
              )}
              {identityStatus.pending && (
                <span className="text-sm text-yellow-600">（確認中）</span>
              )}
            </div>
            {identityFormOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {identityFormOpen && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <div className="py-4">
                {identityStatus.verified ? (
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">本人確認完了</span>
                  </div>
                ) : identityStatus.pending ? (
                  <div>
                    <div className="flex items-center gap-2 text-yellow-700 mb-2">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">確認中</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      本人確認書類を確認中です。通常1〜2営業日で完了します。
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-4">
                      <p className="text-sm text-yellow-800">
                        売上を受け取るには本人確認が必要です。<br />
                        本人確認書類（運転免許証、マイナンバーカード等）をご用意ください。
                      </p>
                    </div>
                    <button
                      onClick={handleStartIdentityVerification}
                      disabled={actionLoading || !bankAccountStatus.registered}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                      <span>{actionLoading ? '処理中...' : '本人確認を開始'}</span>
                    </button>
                    {!bankAccountStatus.registered && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        ※ 先に口座登録を完了してください
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 追加認証が必要な場合の警告 */}
        {identityStatus.requirements && identityStatus.requirements.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">追加認証が必要です</p>
                <p className="text-sm text-yellow-700 mt-1">
                  追加の本人確認が求められています。下のボタンから認証を完了してください。
                </p>
                <button
                  onClick={handleStartIdentityVerification}
                  disabled={actionLoading}
                  className="mt-3 inline-flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition disabled:opacity-50"
                >
                  認証を完了
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 注意事項 */}
        <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
          <h3 className="font-medium text-gray-700 mb-2">注意事項</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>売上の振込には口座設定が必要です</li>
            <li>口座設定が完了するまで、売上は保留されます</li>
            <li>プラットフォーム手数料は15%です</li>
            <li>振込は売上確定後、自動的に処理されます</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
