// src/pages/AdminReviewArticle.tsx
  import { useEffect, useState } from 'react';
  import { useNavigate, useParams } from 'react-router-dom';
  import { ChevronLeft, Check, X, Image, Tag } from 'lucide-react';
  import { supabase } from '../lib/supabase';

  type Category = {
    id: string;
    parent_id: string | null;
    name: string;
    slug: string;
    sort_order: number;
  };

  type Article = {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    status: string;
    price: number | null;
    has_partial_paywall: boolean;
    cover_image_url: string | null;
    created_at: string;
    parent_article_id: string | null;
    primary_category_id: string | null;
    sub_category_id: string | null;
    author: {
      display_name: string | null;
      email: string;
    } | null;
  };

  // その他（非アダルト）の固定ID
  const OTHER_NON_ADULT_ID = '11111111-1111-1111-1111-111111111107';

  export default function AdminReviewArticle() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [article, setArticle] = useState<Article | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);

    // カテゴリ関連
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedPrimaryCategoryId, setSelectedPrimaryCategoryId] = useState<string>('');
    const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>('');

    // 親カテゴリ一覧
    const parentCategories = categories.filter((c) => c.parent_id === null);

    // 選択中の親カテゴリに紐づく子カテゴリ一覧
    const childCategories = categories.filter((c) => c.parent_id === selectedPrimaryCategoryId);

    // 「その他（非アダルト）」を選択中かどうか
    const isOtherNonAdult = selectedPrimaryCategoryId === OTHER_NON_ADULT_ID;

    useEffect(() => {
      loadCategories();
    }, []);

    useEffect(() => {
      if (!id) return;
      loadArticle();
    }, [id]);

    async function loadCategories() {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');

      if (!error && data) {
        setCategories(data);
      }
    }

    async function loadArticle() {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          excerpt,
          content,
          status,
          price,
          has_partial_paywall,
          cover_image_url,
          created_at,
          parent_article_id,
          primary_category_id,
          sub_category_id,
          author:users!articles_author_id_fkey(display_name, email)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error(error);
        navigate('/admin');
        return;
      }

      setArticle(data as Article);

      // 既存のカテゴリがあれば選択状態にセット
      if (data.primary_category_id) {
        setSelectedPrimaryCategoryId(data.primary_category_id);
      }
      if (data.sub_category_id) {
        setSelectedSubCategoryId(data.sub_category_id);
      }

      setLoading(false);
    }

    // 親カテゴリ変更時
    function handlePrimaryCategoryChange(categoryId: string) {
      setSelectedPrimaryCategoryId(categoryId);
      // 子カテゴリをリセット（その他非アダルトの場合は不要）
      if (categoryId === OTHER_NON_ADULT_ID) {
        setSelectedSubCategoryId('');
      } else {
        setSelectedSubCategoryId('');
      }
    }

    async function handleApprove() {
      if (!id || !article) return;

      // カテゴリ必須チェック
      if (!selectedPrimaryCategoryId) {
        alert('親カテゴリを選択してください');
        return;
      }

      // 「その他（非アダルト）」以外は子カテゴリ必須
      if (!isOtherNonAdult && !selectedSubCategoryId) {
        alert('子カテゴリを選択してください');
        return;
      }

      setSubmitting(true);

      // 1. 記事を公開 + カテゴリ設定
      const { error } = await supabase
        .from('articles')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          admin_comment: null,
          primary_category_id: selectedPrimaryCategoryId,
          sub_category_id: isOtherNonAdult ? null : selectedSubCategoryId,
        })
        .eq('id', id);

      if (error) {
        setSubmitting(false);
        alert(error.message || '承認に失敗しました');
        return;
      }

      // 2. 旧バージョンがあればアーカイブ
      if (article.parent_article_id) {
        const { error: archiveError } = await supabase
          .from('articles')
          .update({ is_archived: true })
          .eq('id', article.parent_article_id);

        if (archiveError) {
          console.error('Failed to archive parent article:', archiveError);
        }
      }

      setSubmitting(false);
      alert('記事を公開しました。');
      navigate('/admin');
    }

    async function handleReject() {
      if (!id || !rejectReason.trim()) {
        alert('差戻し理由を入力してください');
        return;
      }

      setSubmitting(true);

      const { error } = await supabase
        .from('articles')
        .update({
          status: 'rejected',
          admin_comment: rejectReason.trim(),
        })
        .eq('id', id);

      setSubmitting(false);

      if (error) {
        alert(error.message || '差戻しに失敗しました');
        return;
      }

      alert('記事を差戻しました。');
      navigate('/admin');
    }

    if (loading) {
      return <div className="min-h-[60vh] flex items-center justify-center text-gray-600">読み込み中...</div>;
    }

    if (!article) {
      return <div className="min-h-[60vh] flex items-center justify-center text-gray-600">記事が見つかりません</div>;
    }

    function htmlToText(html: string) {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="border-b border-gray-200 bg-white">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="inline-flex items-center gap-1 text-sm font-semibold text-gray-800"
            >
              <ChevronLeft className="w-4 h-4" />
              一覧に戻る
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                disabled={submitting}
                className="h-10 px-4 rounded-xl border border-red-200 bg-white text-red-600 text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60"
              >
                <X className="w-4 h-4" />
                差戻し
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={submitting}
                className="h-10 px-4 rounded-xl bg-green-600 text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60"
              >
                <Check className="w-4 h-4" />
                承認して公開
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
            {/* 改訂版の場合は表示 */}
            {article.parent_article_id && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <div className="text-sm text-blue-800 font-medium">
                  これは既存記事の改訂版です。承認すると旧版は自動的にアーカイブされます。
                </div>
              </div>
            )}

            {/* カテゴリ選択UI */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2 text-orange-800 font-semibold">
                <Tag className="w-4 h-4" />
                カテゴリ設定（必須）
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    親カテゴリ <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedPrimaryCategoryId}
                    onChange={(e) => handlePrimaryCategoryChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">選択してください</option>
                    {parentCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    子カテゴリ {!isOtherNonAdult && <span className="text-red-500">*</span>}
                  </label>
                  {isOtherNonAdult ? (
                    <div className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500">
                      （子カテゴリなし）
                    </div>
                  ) : (
                    <select
                      value={selectedSubCategoryId}
                      onChange={(e) => setSelectedSubCategoryId(e.target.value)}
                      disabled={!selectedPrimaryCategoryId}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
                    >
                      <option value="">選択してください</option>
                      {childCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-1">投稿者</div>
              <div className="text-sm text-gray-900">
                {article.author?.display_name || article.author?.email || '不明'}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-1">投稿日時</div>
              <div className="text-sm text-gray-900">{new Date(article.created_at).toLocaleString()}</div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-1">販売設定</div>
              <div className="text-sm text-gray-900">
                {article.has_partial_paywall ? `有料（${(article.price ?? 0).toLocaleString()}円）` : '無料'}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-2">サムネイル</div>
              {article.cover_image_url ? (
                <img
                  src={article.cover_image_url}
                  alt="thumbnail"
                  className="w-full max-w-[400px] h-auto rounded-xl border border-gray-200"
                />
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Image className="w-4 h-4" />
                  未設定
                </div>
              )}
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-2">タイトル</div>
              <div className="text-xl font-bold text-gray-900">{article.title}</div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-2">本文（冒頭）</div>
              <div className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4 whitespace-pre-wrap">
                {article.excerpt || htmlToText(article.content).slice(0, 500) || '（本文なし）'}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-2">本文全文</div>
              <div
                className="prose prose-sm max-w-none bg-gray-50 rounded-xl p-4"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            </div>
          </div>
        </div>

        {/* 差戻しモーダル */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <div className="text-lg font-bold text-gray-900 mb-4">差戻し理由を入力</div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="差戻し理由を入力してください..."
                className="w-full h-32 rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none"
              />
              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={submitting || !rejectReason.trim()}
                  className="h-10 px-4 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-60"
                >
                  {submitting ? '送信中...' : '差戻しを確定'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
