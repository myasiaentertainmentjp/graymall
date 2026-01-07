 // src/pages/PreviewArticle.tsx
  import { useEffect, useState, useRef } from 'react';
  import { useParams, Link } from 'react-router-dom';

  type PreviewData = {
    title: string;
    content: string;
    paidContent: string;
    isPaid: boolean;
    price: number;
    coverImageUrl: string | null;
    tags: string[];
  };

  // BroadcastChannel名（Editor.tsxと同じ）
  const PREVIEW_CHANNEL_NAME = 'graymall_preview';

  export default function PreviewArticle() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<PreviewData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const channelRef = useRef<BroadcastChannel | null>(null);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
      if (!id) {
        setError('IDが見つかりません');
        setLoading(false);
        return;
      }

      const key = `preview_${id}`;

      // まずlocalStorageを確認
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored) as PreviewData;
          setData(parsed);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn('localStorage読み込みエラー:', e);
      }

      // localStorageにない場合、BroadcastChannelで待機
      try {
        const channel = new BroadcastChannel(PREVIEW_CHANNEL_NAME);
        channelRef.current = channel;

        const handleMessage = (event: MessageEvent) => {
          if (event.data && event.data.key === key) {
            setData(event.data.data as PreviewData);
            setLoading(false);
            // データ受信後、localStorageにも保存（リロード対応）
            try {
              localStorage.setItem(key, JSON.stringify(event.data.data));
            } catch {}
            // タイムアウトをクリア
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
          }
        };

        channel.addEventListener('message', handleMessage);

        // 5秒でタイムアウト
        timeoutRef.current = window.setTimeout(() => {
          if (loading && !data) {
            setError('プレビューデータが見つかりません。エディタから再度プレビューを開いてください。');
            setLoading(false);
          }
        }, 5000);

      } catch (e) {
        console.warn('BroadcastChannel非対応:', e);
        setError('プレビューデータが見つかりません。エディタから再度プレビューを開いてください。');
        setLoading(false);
      }

      return () => {
        if (channelRef.current) {
          channelRef.current.close();
          channelRef.current = null;
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }, [id]);

    if (!id) {
      return (
        <div className="min-h-screen bg-white p-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-gray-900 font-semibold">IDが見つかりません</div>
            <div className="mt-4">
              <Link to="/articles" className="text-blue-600 underline">
                記事一覧へ
              </Link>
            </div>
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="min-h-screen bg-white p-6">
          <div className="max-w-3xl mx-auto text-gray-600">読み込み中...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="min-h-screen bg-white p-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-gray-900 font-semibold">プレビューを表示できません</div>
            <div className="mt-2 text-sm text-red-600">{error}</div>
            <div className="mt-4">
              <Link to={`/editor/${id}`} className="text-blue-600 underline">
                エディタに戻る
              </Link>
            </div>
          </div>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="min-h-screen bg-white p-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-gray-900 font-semibold">記事が見つかりません</div>
            <div className="mt-4">
              <Link to="/articles" className="text-blue-600 underline">
                記事一覧へ
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
            <div className="flex-1 min-w-0">
              <div className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mb-2">
                プレビュー（未保存）
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 break-words">{data.title}</h1>
            </div>

            <Link
              to={`/editor/${id}`}
              className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-900 flex items-center whitespace-nowrap flex-shrink-0"
            >
              エディタに戻る
            </Link>
          </div>

          {data.coverImageUrl && (
            <div className="mt-6 rounded-2xl overflow-hidden border border-gray-200">
              <img src={data.coverImageUrl} alt="thumbnail" className="w-full h-[220px] object-cover" />
            </div>
          )}

          {data.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {data.tags.map((t) => (
                <span key={t} className="px-3 py-1 rounded-full border border-gray-200 text-sm text-gray-700">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* 要件3修正: リンクがクリック可能になるようにスタイルを明示的に指定 */}
          {/* proseクラスでリンクのスタイルが上書きされるのを防ぐ */}
          <style>{`
            .preview-content a {
              color: #2563eb !important;
              text-decoration: underline !important;
              cursor: pointer !important;
              pointer-events: auto !important;
            }
            .preview-content a:hover {
              color: #1d4ed8 !important;
            }
          `}</style>

          <div className="mt-8 prose prose-slate max-w-none preview-content">
            <div dangerouslySetInnerHTML={{ __html: data.content || '' }} />
          </div>

          {/* paidContentがあれば表示（isPaidは販売設定であり、有料エリアの存在とは別） */}
          {data.paidContent && data.paidContent.trim() && data.paidContent !== '<p></p>' && (
            <>
              <div className="my-10 flex items-center gap-3">
                <div className="flex-1 border-t-2 border-dashed border-gray-300" />
                <div className="text-sm text-gray-500 whitespace-nowrap">
                  ここから先は有料部分（{(data.price ?? 0).toLocaleString()}円）
                </div>
                <div className="flex-1 border-t-2 border-dashed border-gray-300" />
              </div>

              <div className="prose prose-slate max-w-none preview-content">
                <div dangerouslySetInnerHTML={{ __html: data.paidContent || '' }} />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
