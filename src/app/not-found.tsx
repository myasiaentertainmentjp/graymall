'use client'

import Link from 'next/link'
import { Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 404 アイコン */}
        <div className="mb-8">
          <div className="text-8xl font-bold text-gray-700 mb-2">404</div>
          <div className="w-24 h-1 bg-emerald-500 mx-auto rounded-full" />
        </div>

        {/* メッセージ */}
        <h1 className="text-2xl font-bold text-white mb-4">
          ページが見つかりません
        </h1>
        <p className="text-gray-400 mb-8">
          お探しのページは移動または削除された可能性があります。
          URLが正しいかご確認ください。
        </p>

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition"
          >
            <Home className="w-5 h-5" />
            ホームに戻る
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-700 transition"
          >
            <Search className="w-5 h-5" />
            記事を検索
          </Link>
        </div>

        {/* 戻るリンク */}
        <button
          onClick={() => typeof window !== 'undefined' && window.history.back()}
          className="inline-flex items-center gap-1 mt-8 text-gray-500 hover:text-gray-300 transition text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          前のページに戻る
        </button>
      </div>
    </div>
  )
}
