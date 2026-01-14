// src/pages/law.tsx
import Layout from '../components/Layout';

export default function LawPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-gray-200">特定商取引法に基づく表記</h1>

        <div className="overflow-x-auto mb-10">
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border border-gray-200">
                <th className="bg-gray-50 px-4 py-3 text-left font-semibold text-gray-700 w-1/3 border-r border-gray-200">事業者名</th>
                <td className="px-4 py-3 text-gray-600">合同会社マイアジアエンターテインメント</td>
              </tr>
              <tr className="border border-gray-200">
                <th className="bg-gray-50 px-4 py-3 text-left font-semibold text-gray-700 border-r border-gray-200">所在地</th>
                <td className="px-4 py-3 text-gray-600">東京都小金井市本町6-9-39</td>
              </tr>
              <tr className="border border-gray-200">
                <th className="bg-gray-50 px-4 py-3 text-left font-semibold text-gray-700 border-r border-gray-200">代表者名</th>
                <td className="px-4 py-3 text-gray-600">三木 慎太朗</td>
              </tr>
              <tr className="border border-gray-200">
                <th className="bg-gray-50 px-4 py-3 text-left font-semibold text-gray-700 border-r border-gray-200 align-top">連絡先</th>
                <td className="px-4 py-3 text-gray-600">
                  メールアドレス：<a href="mailto:info@graymall.jp" className="text-blue-600 hover:underline">info@graymall.jp</a><br />
                  電話番号：090-5835-6898<br />
                  <span className="text-sm text-gray-500 block mt-2">受付時間：平日10:00〜18:00（年末年始を除く）</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">当社の役割</h2>
          <p className="text-gray-600 leading-relaxed mb-2">当社は、デジタルコンテンツの販売およびアフィリエイト機能を提供するマーケットプレイス「グレーモール」（以下「本サービス」といいます。）の運営事業者です。</p>
          <p className="text-gray-600 leading-relaxed mb-2">当社は、販売者および購入者間の取引の「場」を提供する立場にあり、各コンテンツの内容、品質、正確性、適法性、成果、効果等について保証するものではありません。</p>
          <p className="text-gray-600 leading-relaxed">取引に関する個別の内容（内容不備、瑕疵、提供遅延等を含みます。）は、当社が別途定める場合を除き、原則として販売者および購入者間で解決されるものとします。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">販売価格</h2>
          <p className="text-gray-600 leading-relaxed">各デジタルコンテンツの販売価格は、各商品ページに表示された金額となります。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">商品代金以外に必要な費用</h2>
          <p className="text-gray-600 leading-relaxed mb-2">インターネット接続に必要な通信料等は、利用者の負担となります。</p>
          <p className="text-gray-600 leading-relaxed">本サービスの利用にあたり、購入者に対して当社が別途手数料を請求する場合は、事前にサービス内で明示します。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">支払方法</h2>
          <p className="text-gray-600 leading-relaxed">クレジットカード決済（当社が指定する決済代行サービスを通じて行われます。）</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">支払時期</h2>
          <p className="text-gray-600 leading-relaxed mb-2">クレジットカード決済の場合、購入手続完了時に決済が行われます。</p>
          <p className="text-gray-600 leading-relaxed">実際の引落時期は、利用するクレジットカード会社の規約に基づきます。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">引渡し時期</h2>
          <p className="text-gray-600 leading-relaxed mb-2">決済手続が完了次第、直ちにデジタルコンテンツを閲覧またはダウンロードできる状態となります。</p>
          <p className="text-gray-600 leading-relaxed">一部コンテンツについては、商品ページに記載された提供時期に従う場合があります。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">返品・キャンセル・返金について</h2>
          <p className="text-gray-600 leading-relaxed mb-4">デジタルコンテンツという商品の性質上、購入確定後の返品、キャンセル、返金には原則として応じておりません。</p>
          <p className="text-gray-600 leading-relaxed mb-2">ただし、次の場合に限り、当社の判断で返金等の対応を行うことがあります。</p>
          <ol className="list-decimal pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>同一取引について重複課金が発生した場合</li>
            <li>当社のシステム上の不具合により、購入者がコンテンツの閲覧またはダウンロードを合理的に行えない状態が継続し、当社の調査により当該不具合が確認できた場合</li>
            <li>不正利用の疑いがある等、当社が対応の必要を認めた場合</li>
          </ol>
          <p className="text-gray-600 leading-relaxed mb-2">上記の例外対応を希望する場合は、購入日から7日以内に、購入情報（注文番号等）を添えて当社へご連絡ください。</p>
          <p className="text-gray-600 leading-relaxed mb-2">連絡先：<a href="mailto:info@graymall.jp" className="text-blue-600 hover:underline">info@graymall.jp</a></p>
          <p className="text-gray-600 leading-relaxed">当社は内容を確認のうえ、合理的な範囲で対応を判断します。返金を行う場合、決済手段および決済代行事業者の仕様に従って返金処理を行います。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">中途解約について</h2>
          <p className="text-gray-600 leading-relaxed mb-2">単発購入型のデジタルコンテンツについては、中途解約はできません。</p>
          <p className="text-gray-600 leading-relaxed">定期課金サービス等を提供する場合には、別途サービス内にて条件を明示します。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">表現および商品に関する注意書き</h2>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed space-y-2">
            <li>本サービスで提供される情報、ノウハウ、コンテンツは、特定の成果や効果を保証するものではありません。</li>
            <li>コンテンツの内容の正確性、完全性、有用性について、当社は保証しません。</li>
            <li>コンテンツの利用による判断および行動は、すべて購入者自身の責任において行うものとします。</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">販売者向け手数料（本サービス内での取扱い）</h2>
          <p className="text-gray-600 leading-relaxed mb-4">当社は、販売者に対して以下の手数料を設定しています。</p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>販売手数料：販売価格の15％</li>
            <li>出金手数料：1回あたり350円</li>
            <li>チャージバック事務手数料：1件あたり3,000円</li>
          </ul>
          <p className="text-gray-600 leading-relaxed">手数料の詳細条件はサービス内の表示に従うものとし、当社は運営上の必要に応じて変更する場合があります。</p>
        </section>

        <footer className="mt-12 pt-4 text-right text-xs text-gray-300">
          <p>最終更新：2026年1月13日</p>
        </footer>
      </div>
    </Layout>
  );
}
