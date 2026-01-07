// src/pages/Settings.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import { User, Lock, CreditCard, Link as LinkIcon, ShoppingBag, Crown } from 'lucide-react';

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // SNS Links
  const [snsX, setSnsX] = useState('');
  const [snsInstagram, setSnsInstagram] = useState('');
  const [snsTiktok, setSnsTiktok] = useState('');
  const [snsYoutube, setSnsYoutube] = useState('');
  const [customLink1Url, setCustomLink1Url] = useState('');
  const [customLink1Label, setCustomLink1Label] = useState('');
  const [customLink2Url, setCustomLink2Url] = useState('');
  const [customLink2Label, setCustomLink2Label] = useState('');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'sns' | 'account' | 'purchases'>('profile');

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setDisplayName(data.display_name || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || '');
        setSnsX(data.sns_x || '');
        setSnsInstagram(data.sns_instagram || '');
        setSnsTiktok(data.sns_tiktok || '');
        setSnsYoutube(data.sns_youtube || '');
        setCustomLink1Url(data.custom_link_1_url || '');
        setCustomLink1Label(data.custom_link_1_label || '');
        setCustomLink2Url(data.custom_link_2_url || '');
        setCustomLink2Label(data.custom_link_2_label || '');
      }
    };

    loadUserData();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('users')
      .update({
        display_name: displayName || null,
        bio: bio || null,
        avatar_url: avatarUrl || null,
      })
      .eq('id', user.id);

    if (error) {
      setMessage('保存に失敗しました: ' + error.message);
    } else {
      setMessage('プロフィールを更新しました');
      await refreshProfile();
    }

    setSaving(false);
  };

  // SNS URLバリデーション
  const validateSnsUrl = (url: string, allowedDomains: string[]): boolean => {
    if (!url) return true; // 空は許可
    try {
      const parsed = new URL(url);
      return allowedDomains.some(domain =>
        parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
      );
    } catch {
      return false;
    }
  };

  const handleSaveSNS = async () => {
    if (!user) return;

    // バリデーション
    const errors: string[] = [];

    if (snsX && !validateSnsUrl(snsX, ['x.com', 'twitter.com'])) {
      errors.push('X (Twitter): x.com または twitter.com のURLを入力してください');
    }
    if (snsInstagram && !validateSnsUrl(snsInstagram, ['instagram.com'])) {
      errors.push('Instagram: instagram.com のURLを入力してください');
    }
    if (snsTiktok && !validateSnsUrl(snsTiktok, ['tiktok.com'])) {
      errors.push('TikTok: tiktok.com のURLを入力してください');
    }
    if (snsYoutube && !validateSnsUrl(snsYoutube, ['youtube.com', 'youtu.be'])) {
      errors.push('YouTube: youtube.com または youtu.be のURLを入力してください');
    }

    if (errors.length > 0) {
      setMessage(errors.join('\n'));
      return;
    }

    setSaving(true);
    setMessage('');

    const updateData: Record<string, string | null> = {
      sns_x: snsX || null,
      sns_instagram: snsInstagram || null,
      sns_tiktok: snsTiktok || null,
      sns_youtube: snsYoutube || null,
    };

    // Premium users can set custom links
    if (profile?.is_premium) {
      updateData.custom_link_1_url = customLink1Url || null;
      updateData.custom_link_1_label = customLink1Label || null;
      updateData.custom_link_2_url = customLink2Url || null;
      updateData.custom_link_2_label = customLink2Label || null;
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (error) {
      setMessage('保存に失敗しました: ' + error.message);
    } else {
      setMessage('SNSリンクを更新しました');
      await refreshProfile();
    }

    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setSaving(true);

    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('article-images')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setMessage('画像のアップロードに失敗しました');
      setSaving(false);
      return;
    }

    const { data } = supabase.storage.from('article-images').getPublicUrl(filePath);
    setAvatarUrl(data.publicUrl);
    setSaving(false);
  };

  const tabs = [
    { id: 'profile' as const, label: 'プロフィール', icon: User },
    { id: 'sns' as const, label: 'SNSリンク', icon: LinkIcon },
    { id: 'account' as const, label: 'アカウント', icon: Lock },
    { id: 'purchases' as const, label: '購入履歴', icon: ShoppingBag },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">設定</h1>

        {message && (
          <div className={`mb-4 p-3 rounded whitespace-pre-line ${
            message.includes('失敗') || message.includes('入力してください')
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-green-50 border border-green-200 text-green-700'
          }`}>
            {message}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition ${
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

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">プロフィール設定</h2>

            <div className="space-y-6">
              {/* Avatar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  プロフィール画像
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                    画像を変更
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  表示名
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="表示名を入力"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  自己紹介
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="自己紹介を入力"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                />
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        )}

        {/* SNS Links Tab */}
        {activeTab === 'sns' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">SNSリンク設定</h2>
            <p className="text-sm text-gray-600 mb-6">
              入力したSNSはプロフィールページに表示されます。
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  X (Twitter)
                </label>
                <input
                  type="url"
                  value={snsX}
                  onChange={(e) => setSnsX(e.target.value)}
                  placeholder="https://x.com/username"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instagram
                </label>
                <input
                  type="url"
                  value={snsInstagram}
                  onChange={(e) => setSnsInstagram(e.target.value)}
                  placeholder="https://instagram.com/username"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TikTok
                </label>
                <input
                  type="url"
                  value={snsTiktok}
                  onChange={(e) => setSnsTiktok(e.target.value)}
                  placeholder="https://tiktok.com/@username"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  YouTube
                </label>
                <input
                  type="url"
                  value={snsYoutube}
                  onChange={(e) => setSnsYoutube(e.target.value)}
                  placeholder="https://youtube.com/@channel"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              {/* Custom Links - Premium only */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">カスタムリンク</h3>
                  {!profile?.is_premium && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                      プレミアム限定
                    </span>
                  )}
                </div>

                {profile?.is_premium ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={customLink1Label}
                        onChange={(e) => setCustomLink1Label(e.target.value)}
                        placeholder="ラベル（例: ブログ）"
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                      <input
                        type="url"
                        value={customLink1Url}
                        onChange={(e) => setCustomLink1Url(e.target.value)}
                        placeholder="URL"
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={customLink2Label}
                        onChange={(e) => setCustomLink2Label(e.target.value)}
                        placeholder="ラベル（例: ポートフォリオ）"
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                      <input
                        type="url"
                        value={customLink2Url}
                        onChange={(e) => setCustomLink2Url(e.target.value)}
                        placeholder="URL"
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      プレミアム会員になると、任意のリンクを2つまで追加できます。
                    </p>
                    <Link
                      to="/settings/subscription"
                      className="inline-block px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition"
                    >
                      プレミアムに登録
                    </Link>
                  </div>
                )}
              </div>

              <button
                onClick={handleSaveSNS}
                disabled={saving}
                className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">アカウント設定</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                    <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                      変更
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    パスワード
                  </label>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                    パスワードを変更
                  </button>
                </div>
              </div>
            </div>

            {/* Subscription */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Crown className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-gray-900">プレミアム</h2>
                {profile?.is_premium && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                    アクティブ
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {profile?.is_premium
                  ? 'プレミアム会員として特別な機能をご利用いただけます。'
                  : 'プレミアム会員になると、より柔軟な設定と特別な機能が利用できます。'}
              </p>
              <Link
                to="/settings/subscription"
                className="inline-block px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                {profile?.is_premium ? 'サブスクリプションを管理' : 'プレミアムに登録'}
              </Link>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">支払い方法</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                記事購入時に使用するクレジットカードを登録できます。
              </p>
              <Link
                to="/settings/payments"
                className="inline-block px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                支払い方法を管理
              </Link>
            </div>
          </div>
        )}

        {/* Purchases Tab */}
        {activeTab === 'purchases' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">購入履歴</h2>
            <Link
              to="/me/purchased"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              購入した記事一覧を見る →
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
