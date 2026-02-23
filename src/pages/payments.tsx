// src/pages/payments.tsx
import Layout from '../components/Layout';
import { useSEO } from '../hooks/useSEO';

export default function PaymentsPage() {
  useSEO({
    title: '取引・支払いについて',
    description: 'グレーモールにおける取引と支払いの流れ、支払方法、出金方法についてご説明します。',
    canonicalUrl: '/payments',
    breadcrumbs: [
      { name: 'ホーム', url: '/' },
      { name: '取引・支払いについて', url: '/payments' },
    ],
  });

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-white mb-6 pb-4 border-b-2 border-gray-700">取引・支払いについて</h1>

        <p className="text-gray-300 leading-relaxed mb-8">本ページでは、グレーモールにおける取引と支払いの流れについてご説明します。</p>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 pb-2 border-b border-gray-700">1. 取引の流れ</h2>
          <p className="text-gray-300 leading-relaxed mb-4">グレーモールでの取引は、以下の流れで進行します。</p>
          <ol className="list-decimal pl-6 text-gray-300 leading-relaxed mb-4 space-y-2">
            <li>購入者がデジタルコンテンツを購入します</li>
            <li>決済完了後、コンテンツが即時提供されます</li>
            <li>購入者からの問題報告の有無を確認するため、所定の確認期間を設けます</li>
            <li>確認期間内に問題報告がない場合、取引が確定します</li>
            <li>取引確定後、売上が出品者の残高に反映されます</li>
          </ol>
          <p className="text-gray-300 leading-relaxed">確認期間は、サービス内に表示します。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 pb-2 border-b border-gray-700">2. 支払方法</h2>
          <p className="text-gray-300 leading-relaxed mb-2">現在ご利用いただける支払方法は、クレジットカード決済です。</p>
          <p className="text-gray-300 leading-relaxed mb-2">決済は、当社が指定する決済代行サービスを通じて安全に処理されます。</p>
          <p className="text-gray-300 leading-relaxed">クレジットカード情報を当社が直接保持することはありません。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 pb-2 border-b border-gray-700">3. 取引確定と問題報告</h2>
          <p className="text-gray-300 leading-relaxed mb-4">デジタルコンテンツの性質上、原則として購入後すぐに内容を閲覧・利用できる形式となります。</p>
          <p className="text-gray-300 leading-relaxed mb-4">購入者は、次の場合に限り、確認期間内に問題報告を行うことができます。</p>
          <ul className="list-disc pl-6 text-gray-300 leading-relaxed mb-4 space-y-2">
            <li>当社のシステム不具合により、閲覧またはダウンロードが合理的に行えない場合</li>
            <li>同一取引の重複課金が疑われる場合</li>
            <li>その他、当社が重大な問題と判断する事情がある場合</li>
          </ul>
          <p className="text-gray-300 leading-relaxed">問題報告があった場合、当社は取引の状況を確認し、必要に応じて取引確定の保留、返金等の対応を行うことがあります。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 pb-2 border-b border-gray-700">4. 売上の反映タイミング</h2>
          <p className="text-gray-300 leading-relaxed mb-2">購入者による決済が完了し、取引が確定した後、該当する売上金額が出品者の管理画面に反映されます。</p>
          <p className="text-gray-300 leading-relaxed">売上は、出金可能残高として管理されます。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 pb-2 border-b border-gray-700">5. 出金申請と振込時期</h2>
          <p className="text-gray-300 leading-relaxed mb-4">出品者は、管理画面から出金申請を行うことができます。</p>
          <ul className="list-disc pl-6 text-gray-300 leading-relaxed mb-4 space-y-2">
            <li>初回の出金時には、本人確認が必要です</li>
            <li>本人確認は一度完了すれば、以降の出金時には原則として不要となります</li>
            <li>最低出金金額は3,000円です</li>
            <li>出金申請後、所定の処理期間を経て、登録された銀行口座へお振込みします</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 pb-2 border-b border-gray-700">6. 手数料</h2>
          <p className="text-gray-300 leading-relaxed mb-4">グレーモールでは、サービス運営のため、以下の手数料を設定しています。</p>
          <ul className="list-disc pl-6 text-gray-300 leading-relaxed mb-4 space-y-2">
            <li>販売手数料：販売価格の15％</li>
            <li>出金手数料：1回あたり350円</li>
            <li>チャージバック事務手数料：1件あたり3,000円</li>
          </ul>
          <p className="text-gray-300 leading-relaxed">当社は運営上の必要に応じて手数料の内容を変更する場合があり、変更する場合はサービス内で告知します。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 pb-2 border-b border-gray-700">7. 返金・トラブルが発生した場合</h2>
          <p className="text-gray-300 leading-relaxed mb-4">デジタルコンテンツという商品の性質上、原則として購入後の返金やキャンセルは行っていません。</p>
          <p className="text-gray-300 leading-relaxed mb-4">ただし、重複課金、当社のシステム不具合、不正利用の疑い等、当社が必要と判断した場合には、個別に対応を行うことがあります。</p>
          <p className="text-gray-300 leading-relaxed">トラブルが発生した場合は、注文情報（注文番号等）を添えて、<a href="mailto:info@graymall.jp" className="text-blue-600 hover:underline">info@graymall.jp</a> までご連絡ください。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 pb-2 border-b border-gray-700">8. 運営の立ち位置</h2>
          <p className="text-gray-300 leading-relaxed mb-2">グレーモールの運営者である合同会社マイアジアエンターテインメントは、出品者と購入者の間に立ち、取引の「場」を提供する立場です。</p>
          <p className="text-gray-300 leading-relaxed">当社は、個々のコンテンツの内容や成果を保証する当事者ではなく、取引の円滑化および安全な決済環境の提供を目的としています。</p>
        </section>

        <footer className="mt-12 pt-4 text-right text-xs text-gray-300">
          <p>最終更新：2026年1月14日</p>
        </footer>
      </div>
    </Layout>
  );
}
