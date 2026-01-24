// src/pages/AdminArticleEdit.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import RichTextEditor from '../components/RichTextEditor';
import type { Database } from '../lib/database.types';

type Article = Database['public']['Tables']['articles']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

export default function AdminArticleEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [article, setArticle] = useState<Article | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // フォーム状態
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [price, setPrice] = useState(0);
  const [primaryCategoryId, setPrimaryCategoryId] = useState<string | null>(null);
  const [hasPartialPaywall, setHasPartialPaywall] = useState(false);
  const [affiliateEnabled, setAffiliateEnabled] = useState(false);
  const [affiliateTarget, setAffiliateTarget] = useState<'all' | 'buyers' | null>(null);
  const [affiliateRate, setAffiliateRate] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      loadArticle();
      loadCategories();
    }
  }, [id]);

  const loadArticle = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) {
        setError('記事が見つかりません');
        return;
      }

      setArticle(data);
      setTitle(data.title);
      setExcerpt(data.excerpt);
      setContent(data.content);
      setPrice(data.price || 0);
      setPrimaryCategoryId(data.primary_category_id);
      setHasPartialPaywall(data.has_partial_paywall);
      setAffiliateEnabled(data.affiliate_enabled);
      setAffiliateTarget(data.affiliate_target);
      setAffiliateRate(data.affiliate_rate);
    } catch (err) {
      console.error('Error loading article:', err);
      setError('記事の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .order('sort_order');
    if (data) setCategories(data);
  };

  const handleSave = async () => {
    if (!id) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { error } = await supabase
        .from('articles')
        .update({
          title,
          excerpt,
          content,
          price,
          primary_category_id: primaryCategoryId,
          sub_category_id: null, // サブカテゴリは使わない
          has_partial_paywall: hasPartialPaywall,
          affiliate_enabled: affiliateEnabled,
          affiliate_target: affiliateEnabled ? affiliateTarget : null,
          affiliate_rate: affiliateEnabled ? affiliateRate : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      setSuccessMessage('保存しました');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error saving article:', err);
      setError('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error && !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link to="/admin" className="text-blue-600 hover:underline">
            管理画面に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold">記事編集（管理者）</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            保存
          </button>
        </div>
      </div>

      {/* メッセージ */}
      {(error || successMessage) && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="bg-green-50 text-green-600 px-4 py-2 rounded-lg">
              {successMessage}
            </div>
          )}
        </div>
      )}

      {/* メインコンテンツ */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid gap-6">
          {/* 基本情報 */}
          <section className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-bold mb-4">基本情報</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  タイトル
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  概要（excerpt）
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  カテゴリ
                </label>
                <select
                  value={primaryCategoryId || ''}
                  onChange={(e) => setPrimaryCategoryId(e.target.value || null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">未設定</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* 本文 */}
          <section className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-bold mb-4">本文</h2>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <RichTextEditor
                key={article?.id}
                value={content}
                onChange={setContent}
                placeholder="本文を入力..."
                className="min-h-[400px]"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ※ 有料部分は本文中に「--- 有料 ---」などの区切りを入れてください。
            </p>
          </section>

          {/* 価格設定 */}
          <section className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-bold mb-4">価格設定</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  価格（円）
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  min={0}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">0円の場合は無料記事</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasPartialPaywall"
                  checked={hasPartialPaywall}
                  onChange={(e) => setHasPartialPaywall(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="hasPartialPaywall" className="text-sm text-gray-700">
                  途中から有料（部分ペイウォール）
                </label>
              </div>
              {hasPartialPaywall && (
                <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                  本文中の &lt;!-- paywall --&gt; コメント以降が有料部分になります。
                  このコメントがない場合は全体が有料になります。
                </p>
              )}
            </div>
          </section>

          {/* アフィリエイト設定 */}
          <section className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-bold mb-4">アフィリエイト設定</h2>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="affiliateEnabled"
                  checked={affiliateEnabled}
                  onChange={(e) => setAffiliateEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="affiliateEnabled" className="text-sm text-gray-700">
                  アフィリエイトを有効にする
                </label>
              </div>

              {affiliateEnabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      対象者
                    </label>
                    <select
                      value={affiliateTarget || ''}
                      onChange={(e) => setAffiliateTarget(e.target.value as 'all' | 'buyers' | null)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">選択してください</option>
                      <option value="all">全員</option>
                      <option value="buyers">購入者のみ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      アフィリエイト報酬率（%）
                    </label>
                    <input
                      type="number"
                      value={affiliateRate || ''}
                      onChange={(e) => setAffiliateRate(e.target.value ? Number(e.target.value) : null)}
                      min={0}
                      max={100}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      紹介者に支払われる報酬の割合（0〜100%）
                    </p>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* 記事情報 */}
          <section className="bg-gray-100 rounded-xl p-6 text-sm text-gray-600">
            <h2 className="font-bold mb-2">記事情報</h2>
            <dl className="grid grid-cols-2 gap-2">
              <dt>記事ID:</dt>
              <dd className="font-mono">{article?.id}</dd>
              <dt>スラッグ:</dt>
              <dd className="font-mono">{article?.slug}</dd>
              <dt>ステータス:</dt>
              <dd>{article?.status}</dd>
              <dt>作成日:</dt>
              <dd>{article?.created_at ? new Date(article.created_at).toLocaleString() : '-'}</dd>
              <dt>公開日:</dt>
              <dd>{article?.published_at ? new Date(article.published_at).toLocaleString() : '-'}</dd>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
