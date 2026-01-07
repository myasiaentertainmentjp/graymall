 // src/components/ArticleSettingsPanel.tsx
  import { useRef, useState } from 'react';
  import { Upload, X, Image as ImageIcon, ExternalLink, BarChart3 } from 'lucide-react';

  type AffiliateTarget = 'all' | 'buyers';
  type AffiliateRate = 10 | 20 | 30 | 40 | 50;

  type Props = {
    thumbnailUrl: string | null;
    onChangeThumbnail: (url: string | null) => void;

    isPaid: boolean;
    onChangeIsPaid: (v: boolean) => void;

    price: number;
    onChangePrice: (v: number) => void;

    tags: string[];
    onChangeTags: (tags: string[]) => void;

    status: 'draft' | 'review' | 'published';
    onChangeStatus: (s: 'draft' | 'review' | 'published') => void;

    stats: {
      totalCharCount: number;
      totalImageCount: number;
      paidCharCount: number;
      paidImageCount: number;
    };

    onUploadThumbnail: (file: File) => Promise<string>;

    // アフィリエイト設定
    affiliateEnabled?: boolean;
    onChangeAffiliateEnabled?: (v: boolean) => void;
    affiliateTarget?: AffiliateTarget | null;
    onChangeAffiliateTarget?: (v: AffiliateTarget | null) => void;
    affiliateRate?: AffiliateRate | null;
    onChangeAffiliateRate?: (rate: AffiliateRate) => void;
    affiliateRateError?: string | null;
    affiliateRateNextChangeAt?: Date | null;

    // 有料エリア表示状態
    showPaidBoundary?: boolean;
  };

  const AFFILIATE_RATES: AffiliateRate[] = [10, 20, 30, 40, 50];

  export function ArticleSettingsPanel(props: Props) {
    const {
      thumbnailUrl,
      onChangeThumbnail,
      isPaid,
      onChangeIsPaid,
      price,
      onChangePrice,
      tags,
      onChangeTags,
      status,
      stats,
      onUploadThumbnail,
      affiliateEnabled = false,
      onChangeAffiliateEnabled,
      affiliateTarget,
      onChangeAffiliateTarget,
      affiliateRate,
      onChangeAffiliateRate,
      affiliateRateError,
      affiliateRateNextChangeAt,
      showPaidBoundary = false,
    } = props;

    const inputRef = useRef<HTMLInputElement | null>(null);
    const [tagInput, setTagInput] = useState('');

    const addTag = () => {
      const v = tagInput.trim();
      if (!v) return;
      if (tags.includes(v)) return;
      if (tags.length >= 5) return;
      onChangeTags([...tags, v]);
      setTagInput('');
    };

    const formatNextChangeAt = (date: Date | null | undefined): string => {
      if (!date) return '';
      const d = new Date(date);
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      return `${month}月${day}日 ${hours}:${minutes}`;
    };

    return (
      <div className="space-y-6">
        <div>
          <div className="text-sm font-semibold text-gray-900 mb-2">
            サムネイル
            <span className="ml-2 text-xs font-normal text-gray-500">推奨: 1280 × 670 px</span>
          </div>

          {thumbnailUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-gray-200">
              <img src={thumbnailUrl} alt="thumbnail" className="w-full h-[180px] object-cover" />
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onChangeThumbnail(null)}
                  className="px-3 py-1 rounded-xl bg-white/90 border border-gray-200 text-sm text-gray-700"
                >
                  解除
                </button>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="h-10 w-10 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center"
                  aria-label="画像を変更"
                >
                  <Upload className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full h-[120px] rounded-2xl border border-dashed border-gray-300 bg-white flex items-center justify-center gap-2 text-gray-700"
            >
              <Upload className="w-5 h-5" />
              画像を追加
            </button>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              // GIFチェック（念のため）
              if (file.type === 'image/gif') {
                alert('GIF画像はサポートされていません。JPG、PNG、WebPをお使いください。');
                e.currentTarget.value = '';
                return;
              }
              try {
                const url = await onUploadThumbnail(file);
                onChangeThumbnail(url);
              } catch (err: any) {
                alert(err?.message || 'サムネイルのアップロードに失敗しました');
              } finally {
                e.currentTarget.value = '';
              }
            }}
          />
        </div>

        <div>
          <div className="text-sm font-semibold text-gray-900 mb-2">ステータス</div>
          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {status === 'draft' ? '下書き' : status === 'review' ? '審査待ち' : '公開済み'}
                </div>
                <div className="text-xs text-gray-500">
                  {status === 'draft'
                    ? 'まだ公開されません'
                    : status === 'review'
                      ? '運営の確認待ちです'
                      : '公開中です'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold text-gray-900 mb-2">販売設定</div>
          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onChangeIsPaid(false)}
                className={[
                  'flex-1 h-10 rounded-xl border text-sm font-semibold',
                  !isPaid ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-900 border-gray-200',
                ].join(' ')}
              >
                無料
              </button>
              <button
                type="button"
                onClick={() => onChangeIsPaid(true)}
                className={[
                  'flex-1 h-10 rounded-xl border text-sm font-semibold',
                  isPaid ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-900 border-gray-200',
                ].join(' ')}
              >
                有料
              </button>
            </div>

            {!isPaid && <div className="mt-2 text-xs text-gray-500">無料の記事です。有料エリアや価格設定は表示されません。</div>}

            {isPaid && (
              <div className="mt-4">
                <div className="text-xs text-gray-600 mb-2">価格（円）</div>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={price || ''}
                  onChange={(e) => onChangePrice(Number(e.target.value) || 0)}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      onChangePrice(0);
                    }
                  }}
                  placeholder="0"
                  className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* アフィリエイト設定セクション */}
        <div>
          <div className="text-sm font-semibold text-gray-900 mb-2">紹介料の設定</div>
          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onChangeAffiliateEnabled?.(false);
                  onChangeAffiliateTarget?.(null);
                }}
                className={[
                  'flex-1 h-10 rounded-xl border text-sm font-semibold',
                  !affiliateEnabled ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-900 border-gray-200',
                ].join(' ')}
              >
                しない
              </button>
              <button
                type="button"
                onClick={() => onChangeAffiliateEnabled?.(true)}
                className={[
                  'flex-1 h-10 rounded-xl border text-sm font-semibold',
                  affiliateEnabled ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-900 border-gray-200',
                ].join(' ')}
              >
                する
              </button>
            </div>

            {affiliateEnabled && (
              <div className="mt-4 space-y-4">
                <div>
                  <div className="text-xs text-gray-600 mb-2">紹介できる人</div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onChangeAffiliateTarget?.('all')}
                      className={[
                        'flex-1 h-10 rounded-xl border text-sm font-semibold',
                        affiliateTarget === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-900 border-gray-200',
                      ].join(' ')}
                    >
                      全員
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeAffiliateTarget?.('buyers')}
                      className={[
                        'flex-1 h-10 rounded-xl border text-sm font-semibold',
                        affiliateTarget === 'buyers' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-900 border-gray-200',
                      ].join(' ')}
                    >
                      購入者のみ
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-600 mb-2">還元率</div>
                  <div className="flex flex-wrap gap-2">
                    {AFFILIATE_RATES.map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => onChangeAffiliateRate?.(rate)}
                        disabled={affiliateRateError !== null && rate !== affiliateRate}
                        className={[
                          'h-10 px-4 rounded-xl border text-sm font-semibold',
                          affiliateRate === rate
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-gray-900 border-gray-200',
                          affiliateRateError !== null && rate !== affiliateRate
                            ? 'opacity-50 cursor-not-allowed'
                            : '',
                        ].join(' ')}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>

                  {affiliateRateError && (
                    <div className="mt-2 text-xs text-red-600">
                      {affiliateRateError}
                      {affiliateRateNextChangeAt && (
                        <span className="block mt-1">
                          次回変更可能: {formatNextChangeAt(affiliateRateNextChangeAt)}
                        </span>
                      )}
                    </div>
                  )}

                  {affiliateRate === null && !affiliateRateError && (
                    <div className="mt-2 text-xs text-amber-600">
                      還元率を選択してください（保存時に必須）
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold text-gray-900 mb-2">タグ</div>
          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="text-xs text-gray-500 mb-2">最大5つまで</div>

            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="flex-1 h-10 rounded-xl border border-gray-200 px-3 text-sm"
                placeholder="タグを追加"
              />
              <button
                type="button"
                className="h-10 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold"
                onClick={addTag}
              >
                追加
              </button>
            </div>

            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-200 text-sm"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => onChangeTags(tags.filter((x) => x !== t))}
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      aria-label="remove tag"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 要件3修正: 統計セクション（デザイン調整） */}
        <div>
          <div className="border-t border-dashed border-gray-200 my-4" />

          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-900">統計</div>
            <BarChart3 className="w-4 h-4 text-gray-400" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">記事全体</div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{(stats.totalCharCount ?? 0).toLocaleString()}字</span>
                <span className="text-gray-300">/</span>
                <span className="flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" />
                  {stats.totalImageCount ?? 0}
                </span>
              </div>
            </div>

            {showPaidBoundary && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">有料部分</div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{(stats.paidCharCount ?? 0).toLocaleString()}字</span>
                  <span className="text-gray-300">/</span>
                  <span className="flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" />
                    {stats.paidImageCount ?? 0}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-gray-200 mt-4 pt-4">
            <a
              href="/help"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>ヘルプ・ガイド</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  export default ArticleSettingsPanel;