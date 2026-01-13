// src/pages/privacy.tsx
import Layout from '../components/Layout';

export default function PrivacyPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-gray-200">プライバシーポリシー</h1>

        <p className="text-gray-600 leading-relaxed mb-8">
          合同会社マイアジアエンターテインメント（以下「当社」といいます。）は、当社が運営する「グレーモール」（以下「本サービス」といいます。）における、利用者の個人情報および利用者情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます。）を定めます。
        </p>
        <p className="text-gray-600 leading-relaxed mb-8">
          本サービスURL：<a href="https://graymall.jp/" className="text-blue-600 hover:underline">https://graymall.jp/</a>
        </p>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">第1条（取得する情報の種類）</h2>
          <p className="text-gray-600 leading-relaxed mb-4">当社は、本サービスの提供にあたり、以下の情報を取得することがあります。</p>

          <h3 className="font-semibold text-gray-700 mt-4 mb-2">1. 会員登録・本人確認等に関する情報</h3>
          <p className="text-gray-600 leading-relaxed mb-4">メールアドレス、パスワード（当社が直接保存する場合は適切に暗号化されたもの）、ニックネーム、表示名等の任意入力情報、本人確認に関する情報（必要な場合）</p>

          <h3 className="font-semibold text-gray-700 mt-4 mb-2">2. 取引に関する情報</h3>
          <p className="text-gray-600 leading-relaxed mb-4">購入履歴、出品履歴、売上・報酬に関する情報、問い合わせ履歴</p>

          <h3 className="font-semibold text-gray-700 mt-4 mb-2">3. 技術情報等</h3>
          <p className="text-gray-600 leading-relaxed mb-4">IPアドレス、端末情報、ブラウザ情報、アクセスログ、Cookieその他の識別子等</p>

          <p className="text-gray-600 leading-relaxed">これらの情報には、単体では個人を識別できない情報も含まれますが、他の情報と組み合わされることで個人情報に該当する場合があります。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">第2条（利用目的）</h2>
          <p className="text-gray-600 leading-relaxed mb-4">当社は、取得した情報を以下の目的で利用します。</p>
          <ol className="list-decimal pl-6 text-gray-600 leading-relaxed space-y-2">
            <li>本サービスの提供、運営、維持、改善のため</li>
            <li>会員登録、ログイン認証、本人確認のため</li>
            <li>購入、出品、報酬支払等の取引管理のため</li>
            <li>利用規約、ガイドライン等への違反対応および権利侵害対応のため</li>
            <li>不正行為の防止およびセキュリティ確保のため</li>
            <li>お問い合わせ対応および本人確認のため</li>
            <li>重要なお知らせ、運営上必要な連絡のため</li>
            <li>サービス改善、分析、統計データ作成のため</li>
            <li>上記目的に付随する目的のため</li>
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">第3条（第三者提供）</h2>
          <p className="text-gray-600 leading-relaxed mb-4">当社は、次の場合を除き、利用者の個人情報を第三者に提供しません。</p>
          <ol className="list-decimal pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>本人の同意がある場合</li>
            <li>法令に基づく場合</li>
            <li>人の生命、身体または財産の保護のために必要な場合で、本人の同意を得ることが困難な場合</li>
            <li>公的機関からの適法な要請がある場合</li>
          </ol>
          <p className="text-gray-600 leading-relaxed mb-4">なお、以下の場合は第三者提供に該当しないものとします。</p>
          <ol className="list-decimal pl-6 text-gray-600 leading-relaxed space-y-2">
            <li>業務委託先に対し、必要な範囲で情報を提供する場合</li>
            <li>事業譲渡、合併等に伴い個人情報が承継される場合</li>
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">第4条（委託先の取扱い）</h2>
          <p className="text-gray-600 leading-relaxed mb-2">当社は、決済、本人確認、システム運用、データ管理、カスタマーサポート等の業務を、第三者に委託する場合があります。</p>
          <p className="text-gray-600 leading-relaxed">この場合、当社は委託先に対して、個人情報の適切な管理を求め、必要かつ適切な監督を行います。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">第5条（決済および本人確認に関する外部サービス）</h2>
          <p className="text-gray-600 leading-relaxed mb-2">本サービスでは、クレジットカード決済等の処理のため、当社が指定する決済代行サービスを利用します。</p>
          <p className="text-gray-600 leading-relaxed mb-2">また、不正防止等のため、必要に応じて本人確認に関する外部サービスを利用する場合があります。</p>
          <p className="text-gray-600 leading-relaxed">これらの外部サービスに提供される情報、または外部サービスが収集する情報の取扱いは、各提供事業者の規約・プライバシーポリシーに従います。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">第6条（Cookieおよび解析ツール）</h2>
          <p className="text-gray-600 leading-relaxed mb-4">本サービスでは、利便性向上および利用状況分析のため、Cookie等を使用する場合があります。</p>
          <p className="text-gray-600 leading-relaxed mb-4">当社は、以下の目的でCookie等を利用することがあります。</p>
          <ol className="list-decimal pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>ログイン状態の維持</li>
            <li>利用状況の把握</li>
            <li>サービス改善のための分析</li>
          </ol>
          <p className="text-gray-600 leading-relaxed mb-2">解析ツールとして、Google Analytics等の外部サービスを利用する場合があります。</p>
          <p className="text-gray-600 leading-relaxed mb-2">これらのツールにより収集される情報は、各提供事業者のプライバシーポリシーに基づいて管理されます。</p>
          <p className="text-gray-600 leading-relaxed">利用者は、ブラウザ設定によりCookieの使用を拒否できますが、その場合、本サービスの一部機能が利用できないことがあります。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">第7条（広告配信）</h2>
          <p className="text-gray-600 leading-relaxed mb-2">当社は、現時点では第三者による広告配信を行っていません。</p>
          <p className="text-gray-600 leading-relaxed">ただし、将来、サービス向上や運営上の必要により、広告配信を行う場合があります。その際は、本ポリシーを適切に改定します。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">第8条（個人情報の管理）</h2>
          <p className="text-gray-600 leading-relaxed mb-2">当社は、個人情報の漏えい、滅失、改ざん等を防止するため、合理的かつ適切な安全管理措置を講じます。</p>
          <p className="text-gray-600 leading-relaxed">また、個人情報へのアクセスは、業務上必要な者に限定します。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">第9条（開示・訂正・削除等の請求）</h2>
          <p className="text-gray-600 leading-relaxed mb-2">利用者は、当社が保有する自己の個人情報について、開示、訂正、追加、削除、利用停止等を求めることができます。</p>
          <p className="text-gray-600 leading-relaxed mb-2">これらの請求を行う場合は、第11条のお問い合わせ窓口までご連絡ください。</p>
          <p className="text-gray-600 leading-relaxed">当社は、法令に従い、合理的な範囲で対応します。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">第10条（改定）</h2>
          <p className="text-gray-600 leading-relaxed mb-2">当社は、本ポリシーを、法令改正、サービス内容の変更等に応じて、予告なく改定することがあります。</p>
          <p className="text-gray-600 leading-relaxed">改定後のプライバシーポリシーは、本サイトに掲載した時点から効力を生じます。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">第11条（お問い合わせ窓口）</h2>
          <p className="text-gray-600 leading-relaxed mb-4">本ポリシーに関するお問い合わせは、以下までご連絡ください。</p>
          <div className="bg-gray-50 p-6 rounded-lg">
            <dl className="space-y-3">
              <div>
                <dt className="font-semibold text-gray-700">運営者</dt>
                <dd className="text-gray-600">合同会社マイアジアエンターテインメント</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-700">住所</dt>
                <dd className="text-gray-600">東京都小金井市本町6-9-39</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-700">メールアドレス</dt>
                <dd><a href="mailto:info@graymall.jp" className="text-blue-600 hover:underline">info@graymall.jp</a></dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-700">電話番号</dt>
                <dd className="text-gray-600">090-5835-6898</dd>
              </div>
            </dl>
          </div>
        </section>

        <footer className="mt-12 pt-4 text-right text-xs text-gray-300">
          <p>最終更新：2026年1月13日</p>
        </footer>
      </div>
    </Layout>
  );
}
