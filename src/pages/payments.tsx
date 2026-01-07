// src/pages/payments.tsx
import Layout from '../components/Layout';

export default function PaymentsPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-gray-200">取引・支払いについて</h1>

        <p className="text-gray-600 leading-relaxed mb-8">本ページでは、グレーモールにおける取引や支払いの流れについてご説明します。</p>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">1. 取引の流れについて</h2>
          <p className="text-gray-600 leading-relaxed mb-4">グレーモールでの取引は、以下の流れで進行します。</p>
          <ol className="list-decimal pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>購入者がデジタルコンテンツを購入</li>
            <li>決済完了後、コンテンツが即時提供されます</li>
            <li>一定期間、購入者からの問題報告がない場合、取引が確定します</li>
            <li>取引確定後、売上が出品者のアカウントに反映されます</li>
          </ol>
          <p className="text-gray-600 leading-relaxed">デジタルコンテンツの性質上、原則として購入後すぐに内容を閲覧・利用できる形式となります。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">2. 支払方法について</h2>
          <p className="text-gray-600 leading-relaxed mb-4">現在ご利用いただける支払方法は、以下のとおりです。</p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>クレジットカード決済</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mb-2">決済は、当社が指定する決済代行サービスを通じて安全に処理されます。</p>
          <p className="text-gray-600 leading-relaxed">クレジットカード情報は、当社が直接保持することはありません。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">3. 売上の反映タイミング</h2>
          <p className="text-gray-600 leading-relaxed mb-2">購入者による決済が完了し、取引が確定した後、該当する売上金額が出品者の管理画面に反映されます。</p>
          <p className="text-gray-600 leading-relaxed">売上は、即時利用可能残高ではなく、出金可能残高として管理されます。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">4. 振込申請および振込時期について</h2>
          <p className="text-gray-600 leading-relaxed mb-4">出品者は、管理画面から売上の振込申請を行うことができます。</p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>初回の出金時には、本人確認が必要です</li>
            <li>本人確認は一度完了すれば、以降の出金時には不要となります</li>
            <li>最低出金金額が設定されています（サービス内に表示されます）</li>
          </ul>
          <p className="text-gray-600 leading-relaxed">振込申請後、所定の処理期間を経て、登録された銀行口座へお振込みします。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">5. 手数料の考え方</h2>
          <p className="text-gray-600 leading-relaxed mb-4">グレーモールでは、サービス運営のため、以下の手数料を設定しています。</p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>販売手数料</li>
            <li>出金時に発生する振込手数料</li>
          </ul>
          <p className="text-gray-600 leading-relaxed">具体的な手数料率や金額は、サービス内に明示されており、内容は将来変更される場合があります。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">6. 返金・トラブルが発生した場合</h2>
          <p className="text-gray-600 leading-relaxed mb-4">デジタルコンテンツという商品の性質上、原則として購入後の返金やキャンセルは行っていません。</p>
          <p className="text-gray-600 leading-relaxed mb-4">ただし、以下の場合には、当社の判断により個別対応を行うことがあります。</p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>コンテンツに重大な問題があると当社が判断した場合</li>
            <li>不正利用やシステム上の不具合が確認された場合</li>
          </ul>
          <p className="text-gray-600 leading-relaxed">トラブルが発生した場合は、まずは<a href="/contact" className="text-blue-600 hover:underline">お問い合わせフォーム</a>よりご連絡ください。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">7. 運営の立ち位置について</h2>
          <p className="text-gray-600 leading-relaxed mb-2">グレーモールの運営者である 合同会社マイアジアエンターテインメント は、出品者と購入者の間に立ち、取引の「場」を提供する立場です。</p>
          <p className="text-gray-600 leading-relaxed">当社は、個々のコンテンツの内容や成果を保証する当事者ではなく、取引の円滑化および安全な決済環境の提供を目的としています。</p>
        </section>

        <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-400">
          <p>取引・支払いについて</p>
          <p>最終更新日：2026年1月6日</p>
        </footer>
      </div>
    </Layout>
  );
}
