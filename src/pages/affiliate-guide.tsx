// src/pages/affiliate-guide.tsx
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { Copy, Link2, DollarSign, Users, TrendingUp, ChevronRight } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

export default function AffiliateGuidePage() {
  useSEO({
    title: 'アフィリエイトの仕組み',
    description: 'グレーモールのアフィリエイト（紹介）プログラムの仕組みと報酬について解説します。',
  });

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            アフィリエイト（紹介）プログラム
          </h1>
          <p className="text-lg text-gray-400">
            記事を紹介するだけで報酬が得られる仕組みです
          </p>
        </div>

        {/* 仕組み3ステップ */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6">仕組み</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center">
              <div className="w-12 h-12 bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Link2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="text-sm font-bold text-emerald-400 mb-1">STEP 1</div>
              <h3 className="font-bold text-white mb-2">紹介リンクをコピー</h3>
              <p className="text-sm text-gray-400">
                記事ページにある「紹介リンクをコピー」ボタンから、あなた専用のリンクを取得します。
              </p>
            </div>
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center">
              <div className="w-12 h-12 bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-sm font-bold text-blue-400 mb-1">STEP 2</div>
              <h3 className="font-bold text-white mb-2">リンク経由で購入される</h3>
              <p className="text-sm text-gray-400">
                あなたのリンクからアクセスした方が記事を購入すると、紹介が成立します。
              </p>
            </div>
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center">
              <div className="w-12 h-12 bg-amber-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-6 h-6 text-amber-400" />
              </div>
              <div className="text-sm font-bold text-amber-400 mb-1">STEP 3</div>
              <h3 className="font-bold text-white mb-2">報酬が発生</h3>
              <p className="text-sm text-gray-400">
                購入金額の一定割合が報酬としてあなたに付与されます。報酬は売上管理画面で確認できます。
              </p>
            </div>
          </div>
        </section>

        {/* 報酬について */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6">報酬について</h2>
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-6">
              <p className="text-gray-300 mb-4">
                報酬率は記事の著者が設定します（0%〜50%）。記事ごとに異なる場合があります。
              </p>
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-300 mb-3">報酬例</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-gray-400 font-medium">記事価格</th>
                      <th className="text-left py-2 text-gray-400 font-medium">報酬率</th>
                      <th className="text-right py-2 text-gray-400 font-medium">報酬額</th>
                    </tr>
                  </thead>
                  <tbody className="text-white">
                    <tr className="border-b border-gray-800">
                      <td className="py-2.5">¥4,980</td>
                      <td className="py-2.5">30%</td>
                      <td className="py-2.5 text-right font-bold text-emerald-400">¥1,494</td>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <td className="py-2.5">¥9,800</td>
                      <td className="py-2.5">20%</td>
                      <td className="py-2.5 text-right font-bold text-emerald-400">¥1,960</td>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <td className="py-2.5">¥19,800</td>
                      <td className="py-2.5">40%</td>
                      <td className="py-2.5 text-right font-bold text-emerald-400">¥7,920</td>
                    </tr>
                    <tr>
                      <td className="py-2.5">¥49,800</td>
                      <td className="py-2.5">50%</td>
                      <td className="py-2.5 text-right font-bold text-emerald-400">¥24,900</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                ※ 実際の報酬額は各記事の設定により異なります
              </p>
            </div>
          </div>
        </section>

        {/* 紹介リンクの取得方法 */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6">紹介リンクの取得方法</h2>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <ol className="space-y-6">
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h3 className="font-bold text-white mb-1">グレーモールに無料登録・ログイン</h3>
                  <p className="text-sm text-gray-400">
                    アフィリエイトリンクの取得にはログインが必要です。まだアカウントをお持ちでない方は<Link to="/signup" className="text-emerald-400 hover:underline">こちら</Link>から無料登録できます。
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <h3 className="font-bold text-white mb-1">紹介したい記事ページを開く</h3>
                  <p className="text-sm text-gray-400">
                    アフィリエイト対応の有料記事には「この記事を紹介する」セクションが表示されます。
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <h3 className="font-bold text-white mb-1">「紹介リンクをコピー」をクリック</h3>
                  <p className="text-sm text-gray-400">
                    あなた専用のリンクがクリップボードにコピーされます。このリンクをSNSやブログで共有してください。
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* 報酬の確認方法 */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6">報酬の確認方法</h2>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <p className="text-gray-300 mb-4">
              紹介経由で購入が発生すると、売上管理画面に報酬が反映されます。
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium text-sm"
            >
              売上管理画面を見る
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* 広告表記について（重要） */}
        <section id="pr-disclosure" className="mb-12 scroll-mt-20">
          <h2 className="text-xl font-bold text-white mb-6">広告表記について（重要）</h2>
          <div className="bg-amber-900/30 border border-amber-700 rounded-xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-bold text-amber-300 mb-2">アフィリエイトリンクを共有する際は「PR」「広告」等の表記が必要です</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  2023年10月施行の景品表示法改正（ステルスマーケティング規制）により、アフィリエイトリンクを共有する際には、その投稿が広告であることを明示する必要があります。
                </p>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 mt-4">
              <h4 className="text-sm font-bold text-white mb-3">表記例</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• <span className="text-amber-300">「#PR」「#広告」「#AD」</span> をSNS投稿に含める</li>
                <li>• <span className="text-amber-300">「アフィリエイト広告を利用しています」</span> とブログ記事に記載</li>
                <li>• <span className="text-amber-300">「プロモーションを含みます」</span> と明記</li>
              </ul>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              ※ 表記は投稿の冒頭など、読者が認識しやすい位置に記載してください。規制の詳細は消費者庁のガイドラインをご確認ください。
            </p>
          </div>
        </section>

        {/* よくある質問 */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6">よくある質問</h2>
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="font-bold text-white mb-2">紹介に費用はかかりますか？</h3>
              <p className="text-sm text-gray-400">
                いいえ、完全無料です。グレーモールへの無料登録だけで紹介リンクを取得できます。
              </p>
            </div>
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="font-bold text-white mb-2">すべての記事を紹介できますか？</h3>
              <p className="text-sm text-gray-400">
                アフィリエイトが有効に設定されている有料記事のみ紹介可能です。著者がアフィリエイトを有効にしている場合、記事ページに「この記事を紹介する」セクションが表示されます。
              </p>
            </div>
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="font-bold text-white mb-2">報酬はいつ受け取れますか？</h3>
              <p className="text-sm text-gray-400">
                報酬は売上管理画面から出金申請が可能です。詳しくは<Link to="/payments" className="text-emerald-400 hover:underline">お支払いについて</Link>をご確認ください。
              </p>
            </div>
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="font-bold text-white mb-2">自分の記事を自分で紹介できますか？</h3>
              <p className="text-sm text-gray-400">
                自分自身の紹介リンク経由での購入は、アフィリエイト報酬の対象外となります。
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-8 sm:p-12 border border-gray-700">
          <TrendingUp className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">
            今すぐ紹介を始めよう
          </h2>
          <p className="text-gray-400 mb-6">
            気に入った記事を紹介するだけで報酬が得られます。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/articles"
              className="px-6 py-3 bg-emerald-600 text-white rounded-full font-medium hover:bg-emerald-700 transition text-sm"
            >
              記事を探す
            </Link>
            <Link
              to="/signup"
              className="px-6 py-3 bg-gray-700 text-white border border-gray-600 rounded-full font-medium hover:bg-gray-600 transition text-sm"
            >
              無料登録する
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}
