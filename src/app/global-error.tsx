'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[Global Error]:', {
      message: error.message,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    })
  }, [error])

  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          {/* エラーアイコン */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 mb-4">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
          </div>

          {/* メッセージ */}
          <h1 className="text-2xl font-bold text-white mb-4">
            システムエラー
          </h1>
          <p className="text-gray-400 mb-8">
            申し訳ありません。システムエラーが発生しました。
            ページを再読み込みしてください。
          </p>

          {/* アクションボタン */}
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition"
          >
            <RefreshCw className="w-5 h-5" />
            再読み込み
          </button>
        </div>
      </body>
    </html>
  )
}
