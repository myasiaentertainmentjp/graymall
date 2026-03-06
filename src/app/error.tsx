'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // エラーログをコンソールに出力（本番では外部サービスに送信推奨）
    console.error('[App Error]:', {
      message: error.message,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    })
  }, [error])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* エラーアイコン */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 mb-4">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
        </div>

        {/* メッセージ */}
        <h1 className="text-2xl font-bold text-white mb-4">
          エラーが発生しました
        </h1>
        <p className="text-gray-400 mb-8">
          申し訳ありません。予期せぬエラーが発生しました。
          しばらく待ってからもう一度お試しください。
        </p>

        {/* エラー詳細（開発時のみ表示推奨） */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-8 p-4 bg-gray-900 rounded-lg text-left">
            <p className="text-xs text-gray-500 mb-1">エラー詳細:</p>
            <code className="text-sm text-red-400 break-all">
              {error.message}
            </code>
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition"
          >
            <RefreshCw className="w-5 h-5" />
            もう一度試す
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-700 transition"
          >
            <Home className="w-5 h-5" />
            ホームに戻る
          </Link>
        </div>

        {/* サポート案内 */}
        <p className="mt-8 text-sm text-gray-600">
          問題が解決しない場合は、
          <Link href="/contact" className="text-emerald-500 hover:underline">
            お問い合わせ
          </Link>
          ください
        </p>
      </div>
    </div>
  )
}
