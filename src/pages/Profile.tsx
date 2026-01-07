import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';

export default function Profile() {
  const { profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [affiliateCode, setAffiliateCode] = useState(profile?.affiliate_code || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('users')
      .update({
        display_name: displayName || null,
        affiliate_code: affiliateCode || null,
      })
      .eq('id', profile.id);

    if (error) {
      setMessage('保存に失敗しました: ' + error.message);
    } else {
      setMessage('プロフィールを更新しました');
      await refreshProfile();
    }

    setSaving(false);
  };

  const affiliateUrl = affiliateCode
    ? `${window.location.origin}?aff=${affiliateCode}`
    : '';

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">プロフィール</h1>

          {message && (
            <div
              className={`mb-4 p-3 rounded ${
                message.includes('失敗')
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-green-50 border border-green-200 text-green-700'
              }`}
            >
              {message}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                表示名
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="表示名を入力"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                アフィリエイトコード
              </label>
              <input
                type="text"
                value={affiliateCode}
                onChange={(e) => setAffiliateCode(e.target.value)}
                placeholder="任意のコードを入力"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {affiliateUrl && (
                <div className="mt-2 p-3 bg-gray-50 rounded">
                  <div className="text-sm text-gray-700 mb-1">あなたのアフィリエイトURL:</div>
                  <code className="text-sm text-blue-600 break-all">{affiliateUrl}</code>
                </div>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
