import Link from 'next/link'
import { Home, ChevronRight, BookOpen, PenSquare, CreditCard, Users } from 'lucide-react'

export const metadata = {
  title: '使い方ガイド | グレーモール',
  description: 'グレーモールの使い方をご紹介します。記事の購入方法、出品方法、支払いについてなど。',
}

export default function GuidelinesPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* パンくずリスト */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="flex items-center gap-1 hover:text-gray-700">
            <Home className="w-4 h-4" />
            <span>ホーム</span>
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-700">使い方ガイド</span>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
          使い方ガイド
        </h1>

        <div className="space-y-8">
          {/* グレーモールとは */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">グレーモールとは？</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              グレーモールは、個人の体験談やノウハウを売買できるデジタルコンテンツマーケットプレイスです。
              あなたの知識や経験を記事にして販売したり、他のユーザーが書いた有益な情報を購入することができます。
            </p>
          </section>

          {/* 記事を購入する */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">記事を購入する</h2>
            </div>
            <ol className="text-gray-600 leading-relaxed space-y-3 list-decimal list-inside">
              <li>興味のある記事を見つけてクリック</li>
              <li>無料で読める部分を確認</li>
              <li>「購入する」ボタンをクリック</li>
              <li>クレジットカードで支払い</li>
              <li>購入完了後、すぐに全文が読めます</li>
            </ol>
          </section>

          {/* 記事を出品する */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <PenSquare className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">記事を出品する</h2>
            </div>
            <ol className="text-gray-600 leading-relaxed space-y-3 list-decimal list-inside">
              <li>アカウントを作成してログイン</li>
              <li>「投稿」ボタンから記事を作成</li>
              <li>タイトル、本文、価格を設定</li>
              <li>アイキャッチ画像をアップロード</li>
              <li>「公開」をクリックして完了</li>
            </ol>
            <p className="mt-4 text-sm text-gray-500">
              ※ 売上の振込には本人確認が必要です。設定画面から手続きを行ってください。
            </p>
          </section>

          {/* アフィリエイト */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-pink-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">アフィリエイト機能</h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              気に入った記事を紹介して報酬をもらえます。
              記事のアフィリエイトリンクをSNSなどでシェアし、そのリンク経由で購入があった場合に報酬が発生します。
            </p>
            <Link
              href="/affiliate"
              className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
            >
              アフィリエイトの詳細を見る
              <ChevronRight className="w-4 h-4" />
            </Link>
          </section>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 text-white font-bold rounded-full hover:bg-emerald-600 transition"
          >
            記事を探す
          </Link>
        </div>
      </div>
    </div>
  )
}
