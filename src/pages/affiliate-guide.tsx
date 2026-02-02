// src/pages/affiliate-guide.tsx
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { Copy, Link2, DollarSign, Users, TrendingUp, ChevronRight } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

export default function AffiliateGuidePage() {
  useSEO({
    title: 'アフィリエイトの仕組み',
    description: 'GrayMallのアフィリエイト（紹介）プログラムの仕組みと報酬について解説します。',
  });

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            アフィリエイト（紹介）プログラム
          </h1>
          <p className="text-lg text-gray-600">
            記事を紹介するだけで報酬が得られる仕組みです
          </p>
        </div>

        {/* 仕組み3ステップ */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">仕組み</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Link2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-sm font-bold text-emerald-600 mb-1">STEP 1</div>
              <h3 className="font-bold text-gray-900 mb-2">紹介リンクをコピー</h3>
              <p className="text-sm text-gray-600">
                記事ページにある「紹介リンクをコピー」ボタンから、あなた専用のリンクを取得します。
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-sm font-bold text-blue-600 mb-1">STEP 2</div>
              <h3 className="font-bold text-gray-900 mb-2">リンク経由で購入される</h3>
              <p className="text-sm text-gray-600">
                あなたのリンクからアクセスした方が記事を購入すると、紹介が成立します。
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-6 h-6 text-amber-600" />
              </div>
              <div className="text-sm font-bold text-amber-600 mb-1">STEP 3</div>
              <h3 className="font-bold text-gray-900 mb-2">報酬が発生</h3>
              <p className="text-sm text-gray-600">
                購入金額の一定割合が報酬としてあなたに付与されます。報酬は売上管理画面で確認できます。
              </p>
            </div>
          </div>
          {/* Napkin AI用の図を挿入する予定エリア */}
          {/* <img src="/images/affiliate-flow.png" alt="アフィリエイトの流れ" className="w-full mt-6 rounded-lg" /> */}
        </section>

        {/* 報酬について */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">報酬について</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                報酬率は記事の著者が設定します。記事ごとに異なる場合があります。
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-700 mb-3">報酬例</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-gray-500 font-medium">記事価格</th>
                      <th className="text-left py-2 text-gray-500 font-medium">報酬率</th>
                      <th className="text-right py-2 text-gray-500 font-medium">報酬額</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-900">
                    <tr className="border-b border-gray-100">
                      <td className="py-2.5">¥500</td>
                      <td className="py-2.5">10%</td>
                      <td className="py-2.5 text-right font-medium text-emerald-600">¥50</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2.5">¥1,000</td>
                      <td className="py-2.5">15%</td>
                      <td className="py-2.5 text-right font-medium text-emerald-600">¥150</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2.5">¥3,000</td>
                      <td className="py-2.5">20%</td>
                      <td className="py-2.5 text-right font-medium text-emerald-600">¥600</td>
                    </tr>
                    <tr>
                      <td className="py-2.5">¥5,000</td>
                      <td className="py-2.5">10%</td>
                      <td className="py-2.5 text-right font-medium text-emerald-600">¥500</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {/* Napkin AI用の図を挿入する予定エリア */}
              {/* <img src="/images/affiliate-reward-table.png" alt="報酬計算例" className="w-full mt-6 rounded-lg" /> */}
            </div>
          </div>
        </section>

        {/* 紹介リンクの取得方法 */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">紹介リンクの取得方法</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <ol className="space-y-6">
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">GrayMallに無料登録・ログイン</h3>
                  <p className="text-sm text-gray-600">
                    アフィリエイトリンクの取得にはログインが必要です。まだアカウントをお持ちでない方は<Link to="/signup" className="text-emerald-600 hover:underline">こちら</Link>から無料登録できます。
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">紹介したい記事ページを開く</h3>
                  <p className="text-sm text-gray-600">
                    アフィリエイト対応の有料記事には「この記事を紹介する」セクションが表示されます。
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">「紹介リンクをコピー」をクリック</h3>
                  <p className="text-sm text-gray-600">
                    あなた専用のリンクがクリップボードにコピーされます。このリンクをSNSやブログで共有してください。
                  </p>
                  {/* ユーザーの添付画像を挿入する予定エリア */}
                  {/* <img src="/images/affiliate-copy-button.png" alt="紹介リンクのコピーボタン" className="w-full mt-3 rounded-lg border border-gray-200" /> */}
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* 報酬の確認方法 */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">報酬の確認方法</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-gray-700 mb-4">
              紹介経由で購入が発生すると、売上管理画面に報酬が反映されます。
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
            >
              売上管理画面を見る
              <ChevronRight className="w-4 h-4" />
            </Link>
            {/* ユーザーの添付画像を挿入する予定エリア */}
            {/* <img src="/images/affiliate-dashboard.png" alt="売上管理画面" className="w-full mt-4 rounded-lg border border-gray-200" /> */}
          </div>
        </section>

        {/* よくある質問 */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">よくある質問</h2>
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-2">紹介に費用はかかりますか？</h3>
              <p className="text-sm text-gray-600">
                いいえ、完全無料です。GrayMallへの無料登録だけで紹介リンクを取得できます。
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-2">すべての記事を紹介できますか？</h3>
              <p className="text-sm text-gray-600">
                アフィリエイトが有効に設定されている有料記事のみ紹介可能です。著者がアフィリエイトを有効にしている場合、記事ページに「この記事を紹介する」セクションが表示されます。
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-2">報酬はいつ受け取れますか？</h3>
              <p className="text-sm text-gray-600">
                報酬は売上管理画面から出金申請が可能です。詳しくは<Link to="/payments" className="text-emerald-600 hover:underline">お支払いについて</Link>をご確認ください。
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-2">自分の記事を自分で紹介できますか？</h3>
              <p className="text-sm text-gray-600">
                自分自身の紹介リンク経由での購入は、アフィリエイト報酬の対象外となります。
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-gradient-to-b from-emerald-50 to-white rounded-2xl p-8 sm:p-12 border border-emerald-100">
          <TrendingUp className="w-10 h-10 text-emerald-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            今すぐ紹介を始めよう
          </h2>
          <p className="text-gray-600 mb-6">
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
              className="px-6 py-3 bg-white text-gray-900 border border-gray-200 rounded-full font-medium hover:bg-gray-50 transition text-sm"
            >
              無料登録する
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}
