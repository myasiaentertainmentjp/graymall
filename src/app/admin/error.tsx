'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[AdminError]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-lg p-8 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">
          管理画面でエラーが発生しました
        </h2>
        <p className="text-gray-400 mb-6">
          データの読み込み中にエラーが発生しました。
          再試行するか、ホームに戻ってください。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
          >
            <RefreshCw className="w-4 h-4" />
            再試行
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
          >
            <Home className="w-4 h-4" />
            ホームへ
          </Link>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs text-gray-500">
            エラーID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
