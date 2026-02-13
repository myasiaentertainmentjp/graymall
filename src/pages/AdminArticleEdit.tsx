// src/pages/AdminArticleEdit.tsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Save, Loader2, Eye, Edit3, Upload, Image, X } from 'lucide-react';
import RichTextEditor from '../components/RichTextEditor';
import type { Database } from '../lib/database.types';

type Article = Database['public']['Tables']['articles']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
type AuthorProfile = { id: string; display_name: string; avatar_url: string | null };

type TabType = 'edit' | 'preview';

// 画像をWebPに変換
async function convertImageToWebp(file: File): Promise<Blob> {
  const MAX_WIDTH = 1200;
  const WEBP_QUALITY = 0.85;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.width;
      let height = img.height;
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context取得に失敗'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('WebP変換に失敗'))),
        'image/webp',
        WEBP_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('画像の読み込みに失敗'));
    };

    img.src = objectUrl;
  });
}

export default function AdminArticleEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [article, setArticle] = useState<Article | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authorProfiles, setAuthorProfiles] = useState<AuthorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('edit');

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
  const [authorProfileId, setAuthorProfileId] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('draft');
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      loadArticle();
      loadCategories();
      loadAuthorProfiles();
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
      setAuthorProfileId((data as any).author_profile_id || null);
      setCoverImageUrl(data.cover_image_url || null);
      setStatus(data.status || 'draft');
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

  const loadAuthorProfiles = async () => {
    const { data } = await supabase
      .from('author_profiles')
      .select('id, display_name, avatar_url')
      .order('display_name');
    if (data) setAuthorProfiles(data);
  };

  // 画像アップロード関数
  const handleUploadImage = async (file: File): Promise<string> => {
    if (!id) throw new Error('記事IDがありません');

    let uploadFile: File = file;
    let contentType = file.type || 'image/*';

    try {
      // WebPに変換
      const webpBlob = await convertImageToWebp(file);
      uploadFile = new File([webpBlob], `${Date.now()}.webp`, { type: 'image/webp' });
      contentType = 'image/webp';
    } catch (err) {
      console.warn('WebP変換失敗、元ファイルを使用:', err);
    }

    const path = `articles/${id}/${Date.now()}-${Math.random().toString(16).slice(2)}.webp`;

    const { error: uploadError } = await supabase.storage
      .from('article-images')
      .upload(path, uploadFile, { upsert: true, contentType });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('article-images').getPublicUrl(path);
    if (!data?.publicUrl) throw new Error('画像URLの取得に失敗しました');

    return data.publicUrl;
  };

  // カバー画像アップロード
  const handleCoverUpload = async (file: File) => {
    if (!id || !file) return;
    setUploadingCover(true);
    try {
      const webpBlob = await convertImageToWebp(file);
      const uploadFile = new File([webpBlob], `cover-${Date.now()}.webp`, { type: 'image/webp' });
      const path = `articles/${id}/cover-${Date.now()}.webp`;

      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(path, uploadFile, { upsert: true, contentType: 'image/webp' });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('article-images').getPublicUrl(path);
      if (data?.publicUrl) {
        setCoverImageUrl(data.publicUrl);
      }
    } catch (err) {
      console.error('Cover upload error:', err);
      alert('カバー画像のアップロードに失敗しました');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSave = async () => {
    if (!id) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updateData: any = {
          title,
          excerpt,
          content,
          price,
          primary_category_id: primaryCategoryId,
          has_partial_paywall: hasPartialPaywall,
          affiliate_enabled: affiliateEnabled,
          affiliate_target: affiliateEnabled ? affiliateTarget : null,
          affiliate_rate: affiliateEnabled ? affiliateRate : null,
          author_profile_id: authorProfileId,
          cover_image_url: coverImageUrl,
          status,
          updated_at: new Date().toISOString(),
        };

        // 公開に変更した場合、published_atを設定
        if (status === 'published' && article?.status !== 'published') {
          updateData.published_at = new Date().toISOString();
        }

        const { error } = await supabase
          .from('articles')
          .update(updateData)
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
          <div className="flex items-center gap-3">
            {/* タブ切替 */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('edit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition ${
                  activeTab === 'edit'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                編集
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition ${
                  activeTab === 'preview'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Eye className="w-4 h-4" />
                プレビュー
              </button>
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
        {activeTab === 'edit' ? (
          <div className="grid gap-6">
            {/* ステータス・カバー画像 */}
            <section className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-bold mb-4">公開設定</h2>

              <div className="grid md:grid-cols-2 gap-6">
                {/* ステータス */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ステータス
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="draft">下書き</option>
                    <option value="pending_review">審査待ち</option>
                    <option value="published">公開</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {status === 'published' && '公開中 - サイトに表示されます'}
                    {status === 'pending_review' && '審査待ち - 承認後に公開されます'}
                    {status === 'draft' && '下書き - まだ公開されません'}
                  </p>
                </div>

                {/* カバー画像 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    カバー画像（サムネイル）
                  </label>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])}
                  />
                  {coverImageUrl ? (
                    <div className="relative">
                      <img
                        src={coverImageUrl}
                        alt="カバー画像"
                        className="w-full h-40 object-cover rounded-lg border"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => coverInputRef.current?.click()}
                          disabled={uploadingCover}
                          className="p-2 bg-white rounded-full shadow hover:bg-gray-100 transition"
                          title="変更"
                        >
                          <Upload className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCoverImageUrl(null)}
                          className="p-2 bg-white rounded-full shadow hover:bg-gray-100 transition"
                          title="削除"
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={uploadingCover}
                      className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition"
                    >
                      {uploadingCover ? (
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                      ) : (
                        <>
                          <Image className="w-8 h-8 text-gray-400" />
                          <span className="text-sm text-gray-500">クリックして画像を選択</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </section>

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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    著者プロフィール
                  </label>
                  <select
                    value={authorProfileId || ''}
                    onChange={(e) => setAuthorProfileId(e.target.value || null)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">デフォルト（投稿者）</option>
                    {authorProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.display_name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    記事に表示される著者を選択できます
                  </p>
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
                  onUploadImage={handleUploadImage}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                ※ 有料部分は本文中の &lt;!-- paid --&gt; 以降になります。
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
                    本文中の &lt;!-- paid --&gt; コメント以降が有料部分になります。
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
        ) : (
          /* プレビュー表示 */
          <div className="bg-white rounded-xl border">
            <div className="max-w-3xl mx-auto px-6 py-8">
              {/* タイトル */}
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                {title || '（タイトル未設定）'}
              </h1>

              {/* メタ情報 */}
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-6 border-b">
                <span>価格: {price > 0 ? `¥${price.toLocaleString()}` : '無料'}</span>
                {hasPartialPaywall && <span className="text-orange-600">部分有料</span>}
                {affiliateEnabled && <span className="text-emerald-600">アフィリエイト有効</span>}
              </div>

              {/* 概要 */}
              {excerpt && (
                <div className="bg-gray-50 rounded-lg p-4 mb-8 text-gray-700">
                  <p className="text-sm font-medium text-gray-500 mb-2">概要</p>
                  <div dangerouslySetInnerHTML={{ __html: excerpt }} />
                </div>
              )}

              {/* 本文 */}
              <article className="prose prose-lg max-w-none prose-headings:font-bold prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 prose-p:text-gray-700 prose-p:leading-relaxed prose-img:rounded-lg prose-img:my-6">
                <div dangerouslySetInnerHTML={{ __html: content || '<p class="text-gray-400">本文がありません</p>' }} />
              </article>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
