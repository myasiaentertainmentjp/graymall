// src/components/AffiliateSettings.tsx
// 記事ごとのアフィリエイト設定コンポーネント

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Settings, Users, Clock, AlertCircle, CheckCircle, Loader2, Copy, Link as LinkIcon } from 'lucide-react';

type Article = {
  id: string;
  title: string;
  slug: string;
  affiliate_enabled: boolean;
  affiliate_target: 'all' | 'buyers' | null;
  affiliate_rate: number | null;
  affiliate_rate_last_changed_at: string | null;
};

type Props = {
  article: Article;
  onUpdate?: (updated: Partial<Article>) => void;
};

const RATE_OPTIONS = [0, 10, 20, 30, 40, 50];

export default function AffiliateSettings({ article, onUpdate }: Props) {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(article.affiliate_enabled);
  const [target, setTarget] = useState<'all' | 'buyers'>(article.affiliate_target || 'all');
  const [rate, setRate] = useState(article.affiliate_rate ?? 0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // 次回変更可能時刻の計算
  const nextChangeTime = article.affiliate_rate_last_changed_at
    ? new Date(new Date(article.affiliate_rate_last_changed_at).getTime() + 48 * 60 * 60 * 1000)
    : null;
  const canChangeRate = !nextChangeTime || new Date() >= nextChangeTime;
  const hoursUntilChange = nextChangeTime
    ? Math.max(0, Math.ceil((nextChangeTime.getTime() - Date.now()) / (1000 * 60 * 60)))
    : 0;

  // 初期値を同期
  useEffect(() => {
    setEnabled(article.affiliate_enabled);
    setTarget(article.affiliate_target || 'all');
    setRate(article.affiliate_rate ?? 0);
  }, [article]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      // レート変更がある場合は DB 関数を使用
      if (rate !== article.affiliate_rate) {
        const { data: result, error: rpcError } = await supabase.rpc('update_affiliate_rate', {
          p_article_id: article.id,
          p_user_id: user.id,
          p_new_rate: rate,
        });

        if (rpcError) {
          // DB関数がない場合はフォールバック
          if (rpcError.message.includes('does not exist')) {
            // 48時間チェックをクライアント側で実施
            if (!canChangeRate) {
              setMessage({
                type: 'error',
                text: `アフィリエイト率は48時間に1回のみ変更できます。あと${hoursUntilChange}時間お待ちください。`,
              });
              setSaving(false);
              return;
            }

            // 直接更新
            const { error: updateError } = await supabase
              .from('articles')
              .update({
                affiliate_enabled: enabled,
                affiliate_target: target,
                affiliate_rate: rate,
                affiliate_rate_last_changed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', article.id);

            if (updateError) throw updateError;
          } else {
            throw rpcError;
          }
        } else if (result && !result.success) {
          if (result.error === 'rate_change_too_soon') {
            setMessage({
              type: 'error',
              text: `アフィリエイト率は48時間に1回のみ変更できます。あと${Math.ceil(result.hours_remaining)}時間お待ちください。`,
            });
            setSaving(false);
            return;
          }
          throw new Error(result.error);
        }
      }

      // enabled/target のみの変更
      if (rate === article.affiliate_rate) {
        const { error } = await supabase
          .from('articles')
          .update({
            affiliate_enabled: enabled,
            affiliate_target: target,
            updated_at: new Date().toISOString(),
          })
          .eq('id', article.id);

        if (error) throw error;
      }

      setMessage({ type: 'success', text: '設定を保存しました' });
      onUpdate?.({
        affiliate_enabled: enabled,
        affiliate_target: target,
        affiliate_rate: rate,
        affiliate_rate_last_changed_at: rate !== article.affiliate_rate
          ? new Date().toISOString()
          : article.affiliate_rate_last_changed_at,
      });
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: '保存に失敗しました' });
    } finally {
      setSaving(false);
    }
  };

  const copyAffiliateLink = async () => {
    if (!user) return;

    const affiliateUrl = `${window.location.origin}/articles/${article.slug}?ref=${user.id}`;
    try {
      await navigator.clipboard.writeText(affiliateUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // 収益シミュレーション
  const simulateEarnings = (price: number) => {
    const platformFee = Math.floor(price * 0.15);
    const afterPlatform = price - platformFee;
    const affiliateAmount = Math.floor(afterPlatform * rate / 100);
    const authorAmount = afterPlatform - affiliateAmount;

    return { platformFee, affiliateAmount, authorAmount };
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold">アフィリエイト設定</h3>
      </div>

      {/* メッセージ表示 */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* 有効/無効切り替え */}
      <div className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="font-medium">アフィリエイトを有効にする</span>
        </label>
        <p className="text-sm text-gray-500 mt-1 ml-8">
          他のユーザーがこの記事を紹介して報酬を得られるようになります
        </p>
      </div>

      {enabled && (
        <>
          {/* 紹介対象 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              紹介できるユーザー
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="target"
                  value="all"
                  checked={target === 'all'}
                  onChange={() => setTarget('all')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>誰でも紹介できる</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="target"
                  value="buyers"
                  checked={target === 'buyers'}
                  onChange={() => setTarget('buyers')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>購入者のみ紹介できる</span>
              </label>
            </div>
          </div>

          {/* アフィリエイト率 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              アフィリエイト報酬率
            </label>
            <div className="flex flex-wrap gap-2">
              {RATE_OPTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => canChangeRate && setRate(r)}
                  disabled={!canChangeRate && r !== article.affiliate_rate}
                  className={`px-4 py-2 rounded-lg border transition ${
                    rate === r
                      ? 'bg-blue-600 text-white border-blue-600'
                      : canChangeRate
                      ? 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  }`}
                >
                  {r}%
                </button>
              ))}
            </div>

            {/* 48時間制限の警告 */}
            {!canChangeRate && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <Clock className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">レート変更制限中</p>
                  <p>次回変更可能まであと約{hoursUntilChange}時間です</p>
                  <p className="text-xs text-yellow-600 mt-1">
                    {nextChangeTime?.toLocaleString('ja-JP')} 以降に変更できます
                  </p>
                </div>
              </div>
            )}

            {/* 収益シミュレーション */}
            {rate > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">収益シミュレーション（例: 1,000円の記事）</p>
                <div className="text-sm space-y-1">
                  {(() => {
                    const sim = simulateEarnings(1000);
                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">プラットフォーム手数料 (10%)</span>
                          <span>¥{sim.platformFee}</span>
                        </div>
                        <div className="flex justify-between text-green-700">
                          <span>あなたの収益</span>
                          <span className="font-medium">¥{sim.authorAmount}</span>
                        </div>
                        <div className="flex justify-between text-blue-700">
                          <span>紹介者への報酬 ({rate}%)</span>
                          <span className="font-medium">¥{sim.affiliateAmount}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* アフィリエイトリンク */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <LinkIcon className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">あなたの紹介リンク</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white p-2 rounded border border-blue-200 truncate">
                {window.location.origin}/articles/{article.slug}?ref={user?.id || 'YOUR_ID'}
              </code>
              <button
                onClick={copyAffiliateLink}
                className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>コピー済み</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>コピー</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              このリンクを経由して購入されると、あなたにも報酬が入ります
            </p>
          </div>
        </>
      )}

      {/* 保存ボタン */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{saving ? '保存中...' : '設定を保存'}</span>
        </button>
      </div>
    </div>
  );
}
