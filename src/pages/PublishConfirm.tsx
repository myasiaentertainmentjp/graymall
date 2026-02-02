 // src/pages/PublishConfirm.tsx
  import { useEffect, useState } from 'react';
  import { useNavigate, useParams } from 'react-router-dom';
  import { ChevronLeft, Image, AlertCircle } from 'lucide-react';
  import { supabase } from '../lib/supabase';

  export default function PublishConfirm() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [article, setArticle] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      if (!id) {
        setError('記事IDが見つかりません');
        setLoading(false);
        return;
      }

      (async () => {
        const { data, error: fetchError } = await supabase
          .from('articles')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) {
          console.error('Fetch error:', fetchError);
          setError('記事の読み込みに失敗しました');
          setLoading(false);
          return;
        }

        if (!data) {
          setError('記事が見つかりません');
          setLoading(false);
          return;
        }

        setArticle(data);
        setLoading(false);
      })();
    }, [id]);

    const canSubmit = article?.status === 'draft' || article?.status === 'rejected';

    async function handleSubmit() {
      if (!id || !canSubmit) return;

      setSubmitting(true);

      const { error: updateError } = await supabase
        .from('articles')
        .update({
          status: 'pending_review',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('author_id', (await supabase.auth.getUser()).data.user?.id);

      setSubmitting(false);

      if (updateError) {
        console.error('Update error:', updateError);
        alert(updateError.message || '送信に失敗しました');
        return;
      }

      alert('公開申請を送信しました。管理者の確認をお待ちください。');
      navigate('/me/articles');
    }

    if (loading) {
      return <div className="min-h-[60vh] flex items-center justify-center text-gray-600">読み込み中...</div>;
    }

    if (error) {
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 text-blue-600 underline"
            >
              戻る
            </button>
          </div>
        </div>
      );
    }

    const statusLabel: Record<string, string> = {
      draft: '下書き',
      pending_review: '審査待ち',
      published: '公開済み',
      rejected: '差戻し',
    };

    // アフィリエイト対象のラベル
    const affiliateTargetLabel: Record<string, string> = {
      all: '全員',
      buyers: '購入者のみ',
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="border-b border-gray-200 bg-white">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1 text-sm font-semibold text-gray-800"
            >
              <ChevronLeft className="w-4 h-4" />
              戻る
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">公開内容の確認</h1>

          {!canSubmit && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-amber-800">公開申請できません</div>
                <div className="text-sm text-amber-700 mt-1">
                  {article?.status === 'pending_review' && '現在審査待ちです。管理者の確認をお待ちください。'}
                  {article?.status === 'published' && 'この記事は既に公開されています。'}
                </div>
              </div>
            </div>
          )}

          {article?.status === 'rejected' && article?.admin_comment && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
              <div className="text-sm font-semibold text-red-800 mb-1">差戻し理由</div>
              <div className="text-sm text-red-700">{article.admin_comment}</div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">現在のステータス</div>
              <div className="text-sm text-gray-900">{statusLabel[article?.status] || article?.status}</div>
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">サムネイル</div>
              {article?.cover_image_url ? (
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
              <div className="text-sm font-semibold text-gray-700 mb-2">タイトル</div>
              <div className="text-lg text-gray-900">{article?.title || '無題'}</div>
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">販売設定</div>
              <div className="text-sm text-gray-900">
                {article?.has_partial_paywall ? `有料（${(article.price ?? 0).toLocaleString()}円）` : '無料'}
              </div>
            </div>

            {/* 問題4修正: アフィリエイト設定の表示を追加 */}
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">紹介料設定</div>
              <div className="text-sm text-gray-900">
                {article?.affiliate_enabled ? (
                  <div className="space-y-1">
                    <div>有効</div>
                    <div className="text-gray-600">
                      対象: {affiliateTargetLabel[article.affiliate_target] || '未設定'}
                    </div>
                    <div className="text-gray-600">
                      還元率: {article.affiliate_rate ? `${article.affiliate_rate}%` : '未設定'}
                    </div>
                  </div>
                ) : (
                  '無効'
                )}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">本文（冒頭200文字）</div>
              <div className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4">
                {article?.excerpt || '（本文なし）'}
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate(`/editor/${id}`)}
              className="h-12 px-6 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-900"
            >
              編集に戻る
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !canSubmit}
              className="h-12 px-6 rounded-xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-60"
            >
              {submitting ? '送信中...' : '公開申請を送信'}
            </button>
          </div>
        </div>
      </div>
    );
  }
