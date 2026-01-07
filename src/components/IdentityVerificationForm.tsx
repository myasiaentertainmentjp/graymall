  // src/components/IdentityVerificationForm.tsx
  // 本人確認フォーム（グレーモール内に埋め込み、Stripe APIへ送信）

  import { useState } from 'react';
  import { useAuth } from '../contexts/AuthContext';
  import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

  type Props = {
    onComplete: () => void;
    currentStatus: 'none' | 'verified';
  };

  const PREFECTURES = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
  ];

  export default function IdentityVerificationForm({ onComplete, currentStatus }: Props) {
    const { session } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastName, setLastName] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastNameKana, setLastNameKana] = useState('');
    const [firstNameKana, setFirstNameKana] = useState('');
    const [dobYear, setDobYear] = useState('');
    const [dobMonth, setDobMonth] = useState('');
    const [dobDay, setDobDay] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [prefecture, setPrefecture] = useState('');
    const [city, setCity] = useState('');
    const [line1, setLine1] = useState('');
    const [line2, setLine2] = useState('');
    const [phone, setPhone] = useState('');

    const handlePostalCodeChange = async (value: string) => {
      const cleaned = value.replace(/[^0-9]/g, '');
      setPostalCode(cleaned);
      if (cleaned.length === 7) {
        try {
          const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleaned}`);
          const data = await res.json();
          if (data.results && data.results[0]) {
            const result = data.results[0];
            setPrefecture(result.address1);
            setCity(result.address2 + result.address3);
          }
        } catch {}
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!session) return;

      if (!lastName || !firstName || !lastNameKana || !firstNameKana) {
        setError('氏名を入力してください');
        return;
      }
      if (!dobYear || !dobMonth || !dobDay) {
        setError('生年月日を入力してください');
        return;
      }
      if (postalCode.length !== 7) {
        setError('郵便番号を7桁で入力してください');
        return;
      }
      if (!prefecture || !city || !line1) {
        setError('住所を入力してください');
        return;
      }
      if (!phone || phone.replace(/[^0-9]/g, '').length < 10) {
        setError('電話番号を正しく入力してください');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/update-identity`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            first_name_kana: firstNameKana,
            last_name_kana: lastNameKana,
            dob_year: parseInt(dobYear),
            dob_month: parseInt(dobMonth),
            dob_day: parseInt(dobDay),
            postal_code: postalCode,
            prefecture,
            city,
            line1,
            line2,
            phone: phone.replace(/[^0-9]/g, ''),
          }),
        });

        const data = await res.json();
        if (data.success) {
          onComplete();
        } else {
          setError(data.error || '登録に失敗しました');
        }
      } catch {
        setError('通信エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    if (currentStatus === 'verified') {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 text-green-600">
            <CheckCircle className="w-6 h-6" />
            <span className="font-medium">本人確認情報は登録済みです</span>
          </div>
        </div>
      );
    }

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1920 + 1 }, (_, i) => currentYear - i);

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">本人確認情報</h3>
        <p className="text-sm text-gray-500 mb-6">出金のための本人確認に必要な情報です。</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">氏名</label>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="姓" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="名" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">氏名（カナ）</label>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={lastNameKana} onChange={(e) => setLastNameKana(e.target.value)} placeholder="セイ" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              <input type="text" value={firstNameKana} onChange={(e) => setFirstNameKana(e.target.value)} placeholder="メイ" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">生年月日</label>
            <div className="grid grid-cols-3 gap-3">
              <select value={dobYear} onChange={(e) => setDobYear(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">年</option>
                {years.map((y) => <option key={y} value={y}>{y}年</option>)}
              </select>
              <select value={dobMonth} onChange={(e) => setDobMonth(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">月</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}月</option>)}
              </select>
              <select value={dobDay} onChange={(e) => setDobDay(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">日</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}日</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">郵便番号</label>
            <input type="text" value={postalCode} onChange={(e) => handlePostalCodeChange(e.target.value)} placeholder="1234567" maxLength={7} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            <p className="text-xs text-gray-500 mt-1">7桁入力で住所を自動入力</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">都道府県</label>
            <select value={prefecture} onChange={(e) => setPrefecture(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">選択</option>
              {PREFECTURES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">市区町村</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="渋谷区" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">番地</label>
            <input type="text" value={line1} onChange={(e) => setLine1(e.target.value)} placeholder="1-2-3" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">建物名（任意）</label>
            <input type="text" value={line2} onChange={(e) => setLine2(e.target.value)} placeholder="グレーマンション101" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">電話番号</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09012345678" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" />登録中...</> : '本人確認情報を登録'}
          </button>
        </form>
      </div>
    );
  }
