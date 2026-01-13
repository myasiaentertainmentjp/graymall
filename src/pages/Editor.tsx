// src/pages/Editor.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Eye, Save, Send, MoreHorizontal, Trash2, X, List, Settings } from 'lucide-react';

import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import EnhancedRichTextEditor, { HeadingItem, RichTextEditorRef } from '../components/EnhancedRichTextEditor';
import { TableOfContentsPanel } from '../components/TableOfContentsPanel';
import ArticleSettingsPanel from '../components/ArticleSettingsPanel';

type AffiliateTarget = 'all' | 'buyers';
type AffiliateRate = 0 | 10 | 20 | 30 | 40 | 50;

  function htmlToPlainText(html: string) {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return (tmp.textContent || tmp.innerText || '').replace(/\u00A0/g, ' ');
  }

  function cleanHtml(html: string) {
    return (html || '').trim();
  }

  function countTextChars(html: string) {
    return htmlToPlainText(html).length;
  }

  // 還元率変更制限時間（ミリ秒）
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;      // 無料ユーザー: 7日
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;   // プレミアムユーザー: 24時間

  // BroadcastChannel名
  const PREVIEW_CHANNEL_NAME = 'graymall_preview';

  // paidContentが実質的に空かどうかを判定
  function isPaidContentEmpty(content: string): boolean {
    if (!content) return true;
    const trimmed = content.trim();
    if (!trimmed) return true;
    if (trimmed === '<p></p>' || trimmed === '<p><br></p>' || trimmed === '<p><br/></p>') return true;
    const text = htmlToPlainText(content).trim();
    return text.length === 0;
  }

  export default function Editor() {
    const { id: articleIdParam } = useParams();
    const navigate = useNavigate();
    const editorRef = useRef<RichTextEditorRef>(null);
    const { profile } = useAuth();

    const articleId = useMemo(() => {
      if (!articleIdParam) return crypto.randomUUID();
      return articleIdParam === 'new' ? crypto.randomUUID() : articleIdParam;
    }, [articleIdParam]);

    const isNew = articleIdParam === 'new';

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [title, setTitle] = useState<string>('');
    const [content, setContent] = useState<string>('');
    const [paidContent, setPaidContent] = useState<string>('');

    const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

    const [isPaid, setIsPaid] = useState<boolean>(false);
    const [price, setPrice] = useState<number>(0);
    const [status, setStatus] = useState<'draft' | 'review' | 'published'>('draft');

    const [tags, setTags] = useState<string[]>([]);
    const [headings, setHeadings] = useState<HeadingItem[]>([]);

    // 有料エリア表示状態を販売設定(isPaid)から分離
    const [showPaidBoundary, setShowPaidBoundary] = useState<boolean>(false);

    // SP用メニュー表示状態
    const [spMenuOpen, setSpMenuOpen] = useState(false);

    // サイドバーの表示状態
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
    const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

    // アフィリエイト関連
    const [affiliateEnabled, setAffiliateEnabled] = useState(false);
    const [affiliateTarget, setAffiliateTarget] = useState<AffiliateTarget | null>(null);
    const [affiliateRate, setAffiliateRate] = useState<AffiliateRate | null>(null);
    const [affiliateRateLastChangedAt, setAffiliateRateLastChangedAt] = useState<string | null>(null);
    const [originalAffiliateRate, setOriginalAffiliateRate] = useState<AffiliateRate | null>(null);
    const [affiliateRateError, setAffiliateRateError] = useState<string | null>(null);
    const [affiliateRateNextChangeAt, setAffiliateRateNextChangeAt] = useState<Date | null>(null);

    const paidEnabled = showPaidBoundary;

    const stats = useMemo(() => {
      const freeCharCount = countTextChars(content);
      const paidCharCount = showPaidBoundary ? countTextChars(paidContent) : 0;
      const freeImageCount = (content.match(/<img\b/gi) || []).length;
      const paidImageCount = showPaidBoundary ? (paidContent.match(/<img\b/gi) || []).length : 0;

      return {
        totalCharCount: freeCharCount + paidCharCount,
        totalImageCount: freeImageCount + paidImageCount,
        paidCharCount,
        paidImageCount,
      };
    }, [content, paidContent, showPaidBoundary]);

    useEffect(() => {
      let cancelled = false;

      (async () => {
        if (!articleIdParam || articleIdParam === 'new') return;

        setLoading(true);

        const { data, error } = await supabase.from('articles').select('*').eq('id', articleIdParam).single();

        if (cancelled) return;

        if (error) {
          console.error(error);
          setLoading(false);
          return;
        }

        setTitle(data?.title || '');

        const fullContent = data?.content || '';
        if (fullContent.includes('<!-- paid -->')) {
          const [free, paid] = fullContent.split('<!-- paid -->');
          setContent(free.trim());
          setPaidContent(paid.trim());
          setShowPaidBoundary(true);
        } else {
          setContent(fullContent);
          setPaidContent('');
          setShowPaidBoundary(false);
        }

        setCoverImageUrl(data?.cover_image_url || null);

        setIsPaid(Boolean(data?.has_partial_paywall));
        setPrice(Number(data?.price || 0));

        const dbStatus = data?.status;
        if (dbStatus === 'pending_review') {
          setStatus('review');
        } else if (dbStatus === 'published') {
          setStatus('published');
        } else {
          setStatus('draft');
        }

        setAffiliateEnabled(Boolean(data?.affiliate_enabled));
        setAffiliateTarget((data?.affiliate_target as AffiliateTarget) || null);
        const loadedRate = data?.affiliate_rate as AffiliateRate | null;
        setAffiliateRate(loadedRate);
        setOriginalAffiliateRate(loadedRate);
        setAffiliateRateLastChangedAt(data?.affiliate_rate_last_changed_at || null);

        // タグを読み込む
        setTags(Array.isArray(data?.tags) ? data.tags : []);

        setLoading(false);
      })();

      return () => {
        cancelled = true;
      };
    }, [articleIdParam]);

    const checkAffiliateRateChange = (newRate: AffiliateRate | null): boolean => {
      if (newRate === originalAffiliateRate) {
        setAffiliateRateError(null);
        setAffiliateRateNextChangeAt(null);
        return true;
      }

      if (!affiliateRateLastChangedAt) {
        setAffiliateRateError(null);
        setAffiliateRateNextChangeAt(null);
        return true;
      }

      const lastChanged = new Date(affiliateRateLastChangedAt);
      const now = new Date();
      const diff = now.getTime() - lastChanged.getTime();

      // プレミアムユーザーは24時間、無料ユーザーは7日
      const isPremium = profile?.is_premium === true;
      const limitMs = isPremium ? TWENTY_FOUR_HOURS_MS : SEVEN_DAYS_MS;
      const limitLabel = isPremium ? '24時間' : '7日間';

      if (diff < limitMs) {
        const nextChangeAt = new Date(lastChanged.getTime() + limitMs);
        setAffiliateRateError(`${limitLabel}以内に還元率を変更済みです`);
        setAffiliateRateNextChangeAt(nextChangeAt);
        return false;
      }

      setAffiliateRateError(null);
      setAffiliateRateNextChangeAt(null);
      return true;
    };

    const validateBeforeSave = (): boolean => {
      if (affiliateEnabled && affiliateRate === null) {
        alert('紹介料の還元率を選択してください');
        return false;
      }

      if (affiliateEnabled && affiliateRate !== originalAffiliateRate) {
        if (!checkAffiliateRateChange(affiliateRate)) {
          return false;
        }
      }

      return true;
    };

    async function upsertArticle(nextStatus: 'draft' | 'review' | 'published') {
      if (!validateBeforeSave()) {
        return null;
      }

      setSaving(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert('ログインが必要です');
        setSaving(false);
        return null;
      }

      const dbStatus = nextStatus === 'review' ? 'pending_review' : nextStatus;

      // paidContentが実質的に存在する場合は常に保存
      const hasPaidContent = !isPaidContentEmpty(paidContent);
      const fullContent = hasPaidContent
        ? cleanHtml(content) + '\n<!-- paid -->\n' + cleanHtml(paidContent)
        : cleanHtml(content);

      const rateChanged = affiliateEnabled && affiliateRate !== originalAffiliateRate;

      const payload: Record<string, any> = {
        id: articleId,
        author_id: user.id,
        title: title.trim() || '無題',
        slug: articleId,
        excerpt: htmlToPlainText(content).slice(0, 200) || ' ',
        content: fullContent,
        cover_image_url: coverImageUrl || null,
        has_partial_paywall: isPaid,
        price: isPaid ? price : 0,
        status: dbStatus as 'draft' | 'pending_review' | 'published',
        updated_at: new Date().toISOString(),
        affiliate_enabled: affiliateEnabled,
        affiliate_target: affiliateEnabled ? affiliateTarget : null,
        affiliate_rate: affiliateEnabled ? affiliateRate : null,
        tags: tags,
      };

      if (rateChanged) {
        payload.affiliate_rate_last_changed_at = new Date().toISOString();
      }

      const { data, error } = await supabase.from('articles').upsert(payload).select().single();

      setSaving(false);

      if (error) {
        console.error(error);
        alert(error.message || '保存に失敗しました');
        return null;
      }

      if (affiliateEnabled) {
        setOriginalAffiliateRate(affiliateRate);
        if (rateChanged) {
          setAffiliateRateLastChangedAt(payload.affiliate_rate_last_changed_at);
        }
      }

      if (isNew) {
        navigate(`/editor/${data.id}`, { replace: true });
      }

      return data;
    }

    // サムネイルをWebPに変換
    async function convertThumbnailToWebp(file: File): Promise<Blob> {
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
            (blob) => blob ? resolve(blob) : reject(new Error('WebP変換に失敗')),
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

    async function uploadThumbnail(file: File): Promise<string> {
      // GIFは禁止
      if (file.type === 'image/gif') {
        throw new Error('GIF画像はサポートされていません。JPG、PNG、WebPをお使いください。');
      }

      let uploadFile: File = file;
      let contentType = file.type || 'image/*';

      try {
        // WebPに変換
        const webpBlob = await convertThumbnailToWebp(file);
        uploadFile = new File([webpBlob], `${Date.now()}.webp`, { type: 'image/webp' });
        contentType = 'image/webp';
      } catch (err) {
        console.warn('WebP変換失敗、元ファイルを使用:', err);
        // フォールバック: 変換失敗時は元ファイルを使用
      }

      const path = `covers/${articleId}/${Date.now()}.webp`;

      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(path, uploadFile, { upsert: true, contentType });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('article-images').getPublicUrl(path);
      const url = data?.publicUrl;
      if (!url) throw new Error('サムネイルURLの取得に失敗しました');

      return url;
    }

    async function saveDraft() {
      const result = await upsertArticle('draft');
      if (result) {
        alert('下書き保存されました');
      }
    }

    function openPreview() {
      const previewData = {
        title: title.trim() || '無題',
        content,
        paidContent,
        isPaid,
        price,
        coverImageUrl,
        tags,
      };

      const key = `preview_${articleId}`;

      try {
        localStorage.setItem(key, JSON.stringify(previewData));
      } catch (e) {
        console.warn('localStorage保存失敗:', e);
      }

      const url = `${window.location.origin}/preview/${articleId}`;
      window.open(url, '_blank');

      try {
        const channel = new BroadcastChannel(PREVIEW_CHANNEL_NAME);
        setTimeout(() => {
          channel.postMessage({ key, data: previewData });
          setTimeout(() => channel.close(), 2000);
        }, 300);
      } catch (e) {
        console.warn('BroadcastChannel送信失敗:', e);
      }
    }

    async function goToPublish() {
      const result = await upsertArticle('draft');
      if (!result) return;

      navigate(`/publish/${result.id}`);
    }

    // 記事削除
    async function handleDeleteArticle() {
      if (!articleIdParam || articleIdParam === 'new') {
        navigate('/my-articles');
        return;
      }

      const confirmed = window.confirm('この記事を削除しますか？この操作は取り消せません。');
      if (!confirmed) return;

      const { error } = await supabase.from('articles').delete().eq('id', articleIdParam);
      if (error) {
        alert('削除に失敗しました');
        return;
      }

      navigate('/my-articles');
    }

    function handleJumpToHeading(index: number) {
      editorRef.current?.scrollToHeadingIndex(index);
    }

    function handleChangeIsPaid(newIsPaid: boolean) {
      setIsPaid(newIsPaid);
    }

    // 要件1修正: 有料エリア削除時にpaidContentを保持
    // 要件2修正: カーソル位置以降を有料エリアに移動
    function handleTogglePaidBoundary(cursorContentAfter?: string) {
      setShowPaidBoundary((prev) => {
        const next = !prev;
        if (next) {
          // 有料エリアを表示する場合
          if (cursorContentAfter && cursorContentAfter.trim()) {
            // カーソル位置以降のコンテンツがある場合、それを有料エリアに移動
            setPaidContent(cursorContentAfter);
          } else if (isPaidContentEmpty(paidContent)) {
            // 既存の paidContent がなければ初期化
            setPaidContent('<p></p>');
          }
          // 既存の paidContent がある場合はそのまま保持
        }
        // 非表示にする場合、paidContentは絶対に消さない（保持）
        return next;
      });
    }

    const handleAffiliateRateChange = (rate: AffiliateRate) => {
      setAffiliateRate(rate);
      if (rate !== originalAffiliateRate) {
        checkAffiliateRateChange(rate);
      } else {
        setAffiliateRateError(null);
        setAffiliateRateNextChangeAt(null);
      }
    };

    // SPメニュー外クリックで閉じる
    useEffect(() => {
      const handleClickOutside = () => setSpMenuOpen(false);
      if (spMenuOpen) {
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
      }
    }, [spMenuOpen]);

    if (loading) {
      return <div className="min-h-[60vh] flex items-center justify-center text-gray-600">読み込み中...</div>;
    }

    const isSaveDisabled = saving || (affiliateRateError !== null);

    return (
      <div className="min-h-screen bg-white">
        <div className="border-b border-gray-200 bg-white sticky top-0 z-40">
          <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center justify-between gap-3">
            {/* 戻るボタン */}
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1 text-sm font-semibold text-gray-800"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">戻る</span>
            </button>

            {/* PC用ボタン */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={saveDraft}
                disabled={isSaveDisabled}
                className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-900 inline-flex items-center gap-2 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                下書き保存
              </button>

              <button
                type="button"
                onClick={openPreview}
                disabled={saving}
                className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-900 inline-flex items-center gap-2 disabled:opacity-60"
              >
                <Eye className="w-4 h-4" />
                プレビュー
              </button>

              <button
                type="button"
                onClick={goToPublish}
                disabled={isSaveDisabled}
                className="h-10 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                公開に進む
              </button>
            </div>

            {/* SP用ボタン（要件4修正） */}
            <div className="flex sm:hidden items-center gap-2">
              <button
                type="button"
                onClick={saveDraft}
                disabled={isSaveDisabled}
                className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-900 disabled:opacity-60"
              >
                保存
              </button>

              <button
                type="button"
                onClick={goToPublish}
                disabled={isSaveDisabled}
                className="h-9 px-3 rounded-lg bg-slate-900 text-white text-xs font-semibold disabled:opacity-60"
              >
                公開
              </button>

              {/* 3点メニュー */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSpMenuOpen(!spMenuOpen);
                  }}
                  className="h-9 w-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center"
                >
                  <MoreHorizontal className="w-5 h-5 text-gray-600" />
                </button>

                {spMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-1 min-w-[140px] z-50">
                    <button
                      type="button"
                      onClick={() => {
                        setSpMenuOpen(false);
                        openPreview();
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      プレビュー
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSpMenuOpen(false);
                        handleDeleteArticle();
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      削除
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 py-4">
          <div className="grid grid-cols-12 gap-4">
            {/* 左サイドバー（目次） */}
            <div className={`hidden lg:block col-span-3 ${leftSidebarOpen ? '' : 'lg:hidden'}`}>
              <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
                <div className="rounded-2xl border border-gray-200 bg-white p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-gray-900">目次</div>
                    <button
                      type="button"
                      onClick={() => setLeftSidebarOpen(false)}
                      className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                      title="閉じる"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <TableOfContentsPanel
                    headings={headings}
                    onJump={handleJumpToHeading}
                  />
                </div>
              </div>
            </div>

            {/* メインエディタ - サイドバーの開閉に応じて幅を調整 */}
            <div className={`col-span-12 ${
              leftSidebarOpen && rightSidebarOpen ? 'lg:col-span-6' :
              leftSidebarOpen || rightSidebarOpen ? 'lg:col-span-9' :
              'lg:col-span-12'
            }`}>
              {/* サイドバー再表示ボタン */}
              <div className="hidden lg:flex gap-2 mb-4">
                {!leftSidebarOpen && (
                  <button
                    type="button"
                    onClick={() => setLeftSidebarOpen(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50"
                  >
                    <List className="w-4 h-4" />
                    目次を表示
                  </button>
                )}
                {!rightSidebarOpen && (
                  <button
                    type="button"
                    onClick={() => setRightSidebarOpen(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50"
                  >
                    <Settings className="w-4 h-4" />
                    設定を表示
                  </button>
                )}
              </div>

              <div className="bg-white p-4">
                <textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="記事タイトル"
                  rows={1}
                  className="w-full text-3xl font-extrabold outline-none placeholder:text-gray-300 resize-none overflow-hidden"
                  style={{ minHeight: '2.5rem' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                />

                <div className="mt-4">
                  <EnhancedRichTextEditor
                    ref={editorRef}
                    articleId={articleId}
                    content={content}
                    paidContent={paidContent}
                    paidEnabled={paidEnabled}
                    onChangeContent={setContent}
                    onChangePaidContent={setPaidContent}
                    onHeadingsChange={setHeadings}
                    onTogglePaid={handleTogglePaidBoundary}
                  />
                </div>
              </div>
            </div>

            {/* 右サイドバー（記事設定） */}
            <div className={`hidden lg:block col-span-3 ${rightSidebarOpen ? '' : 'lg:hidden'}`}>
              <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-gray-900">記事設定</div>
                    <button
                      type="button"
                      onClick={() => setRightSidebarOpen(false)}
                      className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                      title="閉じる"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <ArticleSettingsPanel
                    thumbnailUrl={coverImageUrl || null}
                    onChangeThumbnail={setCoverImageUrl}
                    isPaid={isPaid}
                    onChangeIsPaid={handleChangeIsPaid}
                    price={price}
                    onChangePrice={setPrice}
                    tags={tags}
                    onChangeTags={setTags}
                    status={status}
                    onChangeStatus={setStatus}
                    stats={stats}
                    onUploadThumbnail={uploadThumbnail}
                    affiliateEnabled={affiliateEnabled}
                    onChangeAffiliateEnabled={setAffiliateEnabled}
                    affiliateTarget={affiliateTarget}
                    onChangeAffiliateTarget={setAffiliateTarget}
                    affiliateRate={affiliateRate}
                    onChangeAffiliateRate={handleAffiliateRateChange}
                    affiliateRateError={affiliateRateError}
                    affiliateRateNextChangeAt={affiliateRateNextChangeAt}
                    showPaidBoundary={showPaidBoundary}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
