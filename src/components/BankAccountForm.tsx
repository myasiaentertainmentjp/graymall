// src/components/BankAccountForm.tsx
// 口座登録フォーム（埋め込み型）

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// 主要銀行リスト（銀行コード付き）
const MAJOR_BANKS = [
  { code: '0001', name: 'みずほ銀行' },
  { code: '0005', name: '三菱UFJ銀行' },
  { code: '0009', name: '三井住友銀行' },
  { code: '0010', name: 'りそな銀行' },
  { code: '0017', name: '埼玉りそな銀行' },
  { code: '0033', name: 'PayPay銀行' },
  { code: '0034', name: 'セブン銀行' },
  { code: '0035', name: 'ソニー銀行' },
  { code: '0036', name: '楽天銀行' },
  { code: '0038', name: '住信SBIネット銀行' },
  { code: '0039', name: 'auじぶん銀行' },
  { code: '0040', name: 'イオン銀行' },
  { code: '0041', name: '大和ネクスト銀行' },
  { code: '0042', name: 'ローソン銀行' },
  { code: '0310', name: 'GMOあおぞらネット銀行' },
  { code: '0116', name: '北海道銀行' },
  { code: '0117', name: '青森銀行' },
  { code: '0119', name: '秋田銀行' },
  { code: '0128', name: '常陽銀行' },
  { code: '0130', name: '群馬銀行' },
  { code: '0131', name: '武蔵野銀行' },
  { code: '0133', name: '千葉銀行' },
  { code: '0134', name: '千葉興業銀行' },
  { code: '0137', name: '横浜銀行' },
  { code: '0140', name: '第四北越銀行' },
  { code: '0142', name: '山梨中央銀行' },
  { code: '0143', name: '八十二銀行' },
  { code: '0145', name: '北陸銀行' },
  { code: '0149', name: '静岡銀行' },
  { code: '0150', name: 'スルガ銀行' },
  { code: '0151', name: '清水銀行' },
  { code: '0153', name: '大垣共立銀行' },
  { code: '0154', name: '十六銀行' },
  { code: '0157', name: '三重銀行' },
  { code: '0158', name: '百五銀行' },
  { code: '0159', name: '滋賀銀行' },
  { code: '0160', name: '京都銀行' },
  { code: '0161', name: '関西みらい銀行' },
  { code: '0162', name: '池田泉州銀行' },
  { code: '0164', name: '南都銀行' },
  { code: '0166', name: '紀陽銀行' },
  { code: '0168', name: '鳥取銀行' },
  { code: '0169', name: '山陰合同銀行' },
  { code: '0170', name: '中国銀行' },
  { code: '0172', name: '広島銀行' },
  { code: '0173', name: '山口銀行' },
  { code: '0174', name: '阿波銀行' },
  { code: '0175', name: '百十四銀行' },
  { code: '0177', name: '伊予銀行' },
  { code: '0178', name: '四国銀行' },
  { code: '0177', name: '福岡銀行' },
  { code: '0182', name: '佐賀銀行' },
  { code: '0184', name: '十八親和銀行' },
  { code: '0185', name: '肥後銀行' },
  { code: '0187', name: '大分銀行' },
  { code: '0188', name: '宮崎銀行' },
  { code: '0190', name: '鹿児島銀行' },
  { code: '0191', name: '琉球銀行' },
  { code: '0192', name: '沖縄銀行' },
  { code: '9900', name: 'ゆうちょ銀行' },
];

type Props = {
  onComplete?: () => void;
  currentStatus?: 'none' | 'pending' | 'registered';
};

type FormData = {
  accountType: 'individual' | 'company';
  bankCode: string;
  bankName: string;
  branchCode: string;
  branchName: string;
  accountNumber: string;
  accountHolderName: string;
};

export default function BankAccountForm({ onComplete, currentStatus = 'none' }: Props) {
  const { session } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    accountType: 'individual',
    bankCode: '',
    bankName: '',
    branchCode: '',
    branchName: '',
    accountNumber: '',
    accountHolderName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [bankSuggestions, setBankSuggestions] = useState<typeof MAJOR_BANKS>([]);

  const handleBankNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, bankName: value, bankCode: '' }));

    if (value.length > 0) {
      const filtered = MAJOR_BANKS.filter(bank =>
        bank.name.includes(value) || bank.code.includes(value)
      );
      setBankSuggestions(filtered.slice(0, 10));
    } else {
      setBankSuggestions([]);
    }
  };

  const selectBank = (bank: typeof MAJOR_BANKS[0]) => {
    setFormData(prev => ({
      ...prev,
      bankName: bank.name,
      bankCode: bank.code,
    }));
    setBankSuggestions([]);
  };

  const validateForm = (): string | null => {
    if (!formData.bankCode || !formData.bankName) {
      return '銀行を選択してください';
    }
    if (!formData.branchCode || formData.branchCode.length !== 3) {
      return '支店コード（3桁）を入力してください';
    }
    if (!formData.accountNumber || formData.accountNumber.length !== 7) {
      return '口座番号（7桁）を入力してください';
    }
    if (!formData.accountHolderName || !/^[ァ-ヶー　 ]+$/.test(formData.accountHolderName)) {
      return '口座名義（カタカナ）を正しく入力してください';
    }
    return null;
  };

  const handleConfirm = () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setShowConfirm(true);
  };

  const handleSubmit = async () => {
    if (!session) return;

    setLoading(true);
    setError(null);
    setShowConfirm(false);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/register-bank-account`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_type: formData.accountType,
          bank_code: formData.bankCode,
          branch_code: formData.branchCode,
          account_number: formData.accountNumber,
          account_holder_name: formData.accountHolderName,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        onComplete?.();
      } else {
        throw new Error(data.error || '登録に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h2 className="text-lg font-bold">口座登録が完了しました</h2>
        </div>
        <p className="text-gray-600">
          登録した口座情報は出金申請時に使用されます。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-lg">
        <h2 className="text-lg font-bold">お支払い口座の設定</h2>
      </div>

      <div className="p-6">
        <h3 className="text-lg font-bold mb-4">お支払い口座を登録する</h3>

        {/* ステータス表示 */}
        <div className={`mb-6 p-3 rounded-lg flex items-center gap-2 ${
          currentStatus === 'registered'
            ? 'bg-green-100 text-green-800'
            : 'bg-orange-100 text-orange-800'
        }`}>
          <AlertTriangle className="w-5 h-5" />
          <span>
            ステータス: {currentStatus === 'registered' ? '登録済み' : '未登録'}
          </span>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* フォーム */}
        <div className="space-y-6">
          {/* 個人/法人選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              個人か法人かお選びください
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="accountType"
                  value="individual"
                  checked={formData.accountType === 'individual'}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountType: 'individual' }))}
                  className="w-4 h-4 text-blue-600"
                />
                <span>個人</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="accountType"
                  value="company"
                  checked={formData.accountType === 'company'}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountType: 'company' }))}
                  className="w-4 h-4 text-blue-600"
                />
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
              value={formData.bankName}
              onChange={(e) => handleBankNameChange(e.target.value)}
              placeholder="例：みずほ銀行"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {bankSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {bankSuggestions.map((bank) => (
                  <li
                    key={bank.code}
                    onClick={() => selectBank(bank)}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                  >
                    {bank.name}（{bank.code}）
                  </li>
                ))}
              </ul>
            )}
            {formData.bankCode && (
              <p className="mt-1 text-sm text-green-600">
                銀行コード: {formData.bankCode}
              </p>
            )}
          </div>

          {/* 支店名・コード */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              支店名・支店コード
            </label>
            <p className="text-xs text-gray-500 mb-2">
              支店コード（3桁）を入力してください。
            </p>
            <div className="flex gap-4">
              <input
                type="text"
                value={formData.branchCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                  setFormData(prev => ({ ...prev, branchCode: val }));
                }}
                placeholder="001"
                maxLength={3}
                className="w-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                value={formData.branchName}
                onChange={(e) => setFormData(prev => ({ ...prev, branchName: e.target.value }))}
                placeholder="支店名（任意）"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
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
              value={formData.accountNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 7);
                setFormData(prev => ({ ...prev, accountNumber: val }));
              }}
              placeholder="1234567"
              maxLength={7}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 口座名義 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              口座名義カナ（全角）
            </label>
            <p className="text-xs text-gray-500 mb-2">
              姓と名の間に全角スペースを入れてください。
            </p>
            <input
              type="text"
              value={formData.accountHolderName}
              onChange={(e) => setFormData(prev => ({ ...prev, accountHolderName: e.target.value }))}
              placeholder="ヤマダ　タロウ"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">例：ヤマダ　タロウ</p>
          </div>

          {/* 注意事項 */}
          <div className="text-sm text-orange-700 bg-orange-50 p-4 rounded-lg">
            <p>金融機関に登録いただいている口座名義のフリガナを正確にご入力ください。</p>
            <p>完全一致しない場合はお振込できないため、正しい情報を入力いただくようお願いします。</p>
          </div>

          {/* 送信ボタン */}
          <div className="flex justify-end">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-8 py-3 bg-gray-500 text-white rounded-full hover:bg-gray-600 disabled:opacity-50 transition"
            >
              入力情報を確認する
            </button>
          </div>
        </div>
      </div>

      {/* 確認モーダル */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">入力内容の確認</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">区分</span>
                <span className="font-medium">
                  {formData.accountType === 'individual' ? '個人' : '法人'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">銀行名</span>
                <span className="font-medium">{formData.bankName}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">支店コード</span>
                <span className="font-medium">{formData.branchCode}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">口座番号</span>
                <span className="font-medium">{formData.accountNumber}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">口座名義</span>
                <span className="font-medium">{formData.accountHolderName}</span>
              </div>
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
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    登録中...
                  </span>
                ) : (
                  '登録する'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

