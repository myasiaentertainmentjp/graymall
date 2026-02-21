// src/pages/terms.tsx
import Layout from '../components/Layout';

export default function TermsPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-white mb-6 pb-4 border-b-2 border-gray-700">利用規約</h1>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 pb-2 border-b border-gray-700">第1条（適用）</h2>
          <p className="text-gray-300 leading-relaxed mb-4">本規約は、合同会社マイアジアエンターテインメント（以下「当社」といいます。）が運営するマーケットプレイス「グレーモール」（以下「本サービス」といいます。）の利用条件を定めるものです。</p>
          <p className="text-gray-300 leading-relaxed mb-4">本サービスURL：<a href="https://graymall.jp" className="text-blue-600 hover:underline">https://graymall.jp</a></p>
          <p className="text-gray-300 leading-relaxed mb-4">利用者は、本サービスを利用した時点で、本規約の内容に同意したものとみなします。</p>
          <p className="text-gray-300 leading-relaxed mb-4">当社は、本サービス上にガイドライン、ヘルプ、注意事項等を定める場合があり、これらは本規約の一部を構成します。</p>
          <p className="text-gray-300 leading-relaxed">本規約と当社が別途定める個別規定の内容が異なる場合には、当該個別規定が優先されます。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 pb-2 border-b border-gray-700">第2条（定義）</h2>
          <p className="text-gray-300 leading-relaxed mb-4">本規約において使用する用語は、以下のとおり定義します。</p>
          <ol className="list-decimal pl-6 text-gray-300 leading-relaxed space-y-2">
            <li><strong className="font-semibold">利用者</strong> 本サービスを閲覧または利用するすべての者</li>
            <li><strong className="font-semibold">会員</strong> 当社所定の方法により登録を行い、当社が承認した者</li>
            <li><strong className="font-semibold">販売者</strong> 本サービス上で商品等を掲載し販売する会員</li>
            <li><strong className="font-semibold">購入者</strong> 本サービス上で商品等を購入する会員または利用者</li>
            <li><strong className="font-semibold">紹介者</strong> 本サービスの仕組みを用いて商品等を紹介し、報酬を得る会員</li>
            <li><strong className="font-semibold">商品等</strong> デジタルコンテンツ、ノウハウ、役務その他本サービス上で提供されるもの</li>
            <li><strong className="font-semibold">コンテンツ</strong> 文章、画像、動画、音声、データ、リンク等一切の情報</li>
            <li><strong className="font-semibold">決済代行サービス</strong> 当社が指定する外部の決済サービス</li>
            <li><strong className="font-semibold">内部残高</strong> 本サービス上で当社が管理する、売上・報酬等の精算対象金額</li>
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 pb-2 border-b border-gray-700">第3条（本サービスの内容および当社の立場）</h2>
          <p className="text-gray-300 leading-relaxed mb-4">本サービスは、販売者が商品等を掲載・販売し、購入者がこれを購入できる場を提供するプラットフォームです。</p>
          <p className="text-gray-300 leading-relaxed mb-4">当社は、商品等の売買契約の当事者とはならず、販売者・購入者・紹介者間の取引機会を提供する立場にあります。</p>
          <p className="text-gray-300 leading-relaxed">当社は、本サービスの健全な運営およびリスク管理のため、取引状況の確認、売上の保留、利用制限、出品停止、出金保留その他必要な措置を行うことができます。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 pb-2 border-b border-gray-700">第4条（登録）</h2>
          <p className="text-gray-300 leading-relaxed mb-4">会員登録を希望する者は、当社所定の方法により申請し、当社が承認した時点で、本規約を内容とする利用契約が成立します。</p>
          <p className="text-gray-300 leading-relaxed mb-4">登録情報は、真実かつ正確でなければなりません。虚偽、誤記、なりすまし等が判明した場合、当社は利用停止、退会処分等を行うことができます。</p>
          <p className="text-gray-300 leading-relaxed mb-4">当社は、登録の可否およびその理由について開示する義務を負いません。</p>
          <p className="text-gray-300 leading-relaxed">未成年者が本サービスを利用する場合、法定代理人の同意を得たものとみなします。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 pb-2 border-b border-gray-700">第5条（アカウント管理）</h2>
          <p className="text-gray-300 leading-relaxed mb-4">会員は、自己の責任においてアカウント情報を管理するものとします。</p>
          <p className="text-gray-300 leading-relaxed mb-4">アカウントを用いて行われた行為は、当該会員自身の行為とみなします。</p>
          <p className="text-gray-300 leading-relaxed">不正利用のおそれがある場合、会員は直ちに当社へ通知し、当社の指示に従うものとします。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 pb-2 border-b border-gray-700">第6条（手数料）</h2>
          <p className="text-gray-300 leading-relaxed mb-4">当社は、本サービスの利用に際し、販売者または紹介者に対して手数料を課すことがあります。</p>
          <p className="text-gray-300 leading-relaxed mb-4">標準的な手数料の目安は、次のとおりとします。</p>
          <ul className="list-disc pl-6 text-gray-300 leading-relaxed mb-4 space-y-2">
            <li>販売手数料 販売価格の15％</li>
            <li>出金手数料 1回あたり350円</li>
            <li>チャージバック事務手数料 1件あたり3,000円</li>
          </ul>
          <p className="text-gray-300 leading-relaxed">当社は、運営上の必要に応じ、手数料の内容を変更できるものとします。変更後の内容は本サービス上の表示または当社所定の方法で周知します。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 pb-2 border-b border-gray-700">第7条（アフィリエイト報酬）</h2>
          <p className="text-gray-300 leading-relaxed mb-4">販売者は、商品等の公開時に、当該商品に適用するアフィリエイト報酬率を、0％、10％、20％、30％、40％、50％のいずれかから選択するものとします。</p>
          <p className="text-gray-300 leading-relaxed mb-4">選択された報酬率は、当該商品ページに表示され、紹介者に適用されます。</p>
          <p className="text-gray-300 leading-relaxed mb-4">商品公開後の報酬率の変更については、当社が定める方法および条件に従うものとします。</p>
          <p className="text-gray-300 leading-relaxed">当社は、アフィリエイト報酬の発生、計算、支払に関して、本サービスの運営上必要な範囲で裁量を有します。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 pb-2 border-b border-gray-700">第8条（決済および代金受領権限）</h2>
          <p className="text-gray-300 leading-relaxed mb-4">購入者は、当社が指定する決済方法を用いて代金を支払うものとします。</p>
          <p className="text-gray-300 leading-relaxed mb-4">販売者は、当社が販売者に代わって代金を受領する権限を当社に授与するものとします。</p>
          <p className="text-gray-300 leading-relaxed mb-4">紹介者報酬が発生する場合、販売者は、当社が紹介者へ報酬を支払うために必要な権限を当社に授与するものとします。</p>
          <p className="text-gray-300 leading-relaxed">決済代行サービスに起因して生じた損害について、当社は責任を負いません。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 pb-2 border-b border-gray-700">第9条（出金）</h2>
          <p className="text-gray-300 leading-relaxed mb-4"><strong className="font-semibold">会員は、内部残高が3,000円以上となった場合に限り、出金を申請できます。</strong></p>
          <p className="text-gray-300 leading-relaxed mb-4">初回出金時には、当社が定める本人確認を完了する必要があります。本人確認が完了した後は、同一会員について原則として再度の本人確認は不要とします。</p>
          <p className="text-gray-300 leading-relaxed">当社は、不正防止その他の理由により、出金を保留または拒否することがあります。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 pb-2 border-b border-gray-700">第10条（キャンセル・返金）</h2>
          <p className="text-gray-300 leading-relaxed mb-4">商品等の性質上、購入後のキャンセル、返品、返金は原則としてできません。</p>
          <p className="text-gray-300 leading-relaxed mb-4">ただし、当社が特別に必要と判断した場合に限り、返金を認めることがあります。</p>
          <p className="text-gray-300 leading-relaxed">返金が行われる場合、当社は返金に伴う手数料等を控除できるものとします。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 pb-2 border-b border-gray-700">第11条（チャージバック等）</h2>
          <p className="text-gray-300 leading-relaxed mb-4">チャージバック、支払取消し、未払等が発生した場合、当社は当該金額および事務手数料を販売者または紹介者の内部残高から控除、または請求できるものとします。</p>
          <p className="text-gray-300 leading-relaxed mb-4">当社は、当社に不利益が生じない範囲で、合理的かつ慣例的な対応を行うものとします。</p>
          <p className="text-gray-300 leading-relaxed">悪質または反復的な場合、当社はアカウント停止その他の措置を行うことができます。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 pb-2 border-b border-gray-700">第12条（コンテンツおよび取引の安全管理）</h2>
          <p className="text-gray-300 leading-relaxed mb-4">当社は、本サービスの健全な運営のため、出品内容、取引状況、コンテンツの表示等を確認し、必要に応じて当該コンテンツの非表示、販売停止、出金保留等の措置を行うことができます。</p>
          <p className="text-gray-300 leading-relaxed">当社が求める場合、販売者は当社の合理的な範囲の照会に協力するものとします。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 pb-2 border-b border-gray-700">第13条（禁止事項）</h2>
          <p className="text-gray-300 leading-relaxed mb-4">利用者は、以下の行為を行ってはなりません。</p>
          <ol className="list-decimal pl-6 text-gray-300 leading-relaxed space-y-2">
            <li>法令違反、公序良俗違反、犯罪行為またはこれを助長する行為</li>
            <li>詐欺、脅迫、恐喝、虚偽表示、なりすまし、不正決済その他の不正行為</li>
            <li>第三者の知的財産権、肖像権、プライバシー等の権利を侵害する行為</li>
            <li>他人のアカウントへの不正アクセス、マルウェア配布、フィッシング、スパム行為等のセキュリティを害する行為</li>
            <li>本サービスの目的と無関係な外部決済への誘導、取引のサイト外誘導、または当社の手数料を回避する行為</li>
            <li>反社会的勢力への利益供与、または反社会的勢力と関係を有する行為</li>
            <li>当社または第三者に不利益、損害、不快感を与える行為</li>
            <li>その他当社が不適切と判断する行為</li>
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 pb-2 border-b border-gray-700">第14条（知的財産権）</h2>
          <p className="text-gray-300 leading-relaxed mb-4">本サービスおよび本サービス上の一切のコンテンツ（会員が投稿したコンテンツを除きます。）に関する知的財産権は当社または正当な権利者に帰属します。</p>
          <p className="text-gray-300 leading-relaxed mb-4">会員は、自己が投稿するコンテンツについて、適法な権利を有していること、または必要な許諾を得ていることを保証します。</p>
          <p className="text-gray-300 leading-relaxed">当社は、本サービスの運営、改善、不正防止、法令対応等の目的のため、必要な範囲で会員投稿コンテンツを利用できるものとします。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 pb-2 border-b border-gray-700">第15条（利用停止・退会）</h2>
          <p className="text-gray-300 leading-relaxed mb-4">当社は、会員が本規約に違反した場合、またはそのおそれがあると判断した場合、事前の通知なく、利用停止、出品停止、取引の取消し、出金保留、退会処分等の措置を行うことができます。</p>
          <p className="text-gray-300 leading-relaxed">会員は、当社所定の方法により退会できます。退会時に未精算の内部残高がある場合の取扱いは当社の定めに従うものとします。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 pb-2 border-b border-gray-700">第16条（免責）</h2>
          <p className="text-gray-300 leading-relaxed mb-4">当社は、本サービスの内容、成果、収益性等について一切保証しません。</p>
          <p className="text-gray-300 leading-relaxed mb-4">利用者間の紛争について、当社は当社に故意または重過失がある場合を除き責任を負いません。</p>
          <p className="text-gray-300 leading-relaxed mb-4">当社が責任を負う場合であっても、賠償範囲は直接かつ通常の損害に限られます。</p>
          <p className="text-gray-300 leading-relaxed">当社は、決済代行サービスの仕様変更、停止等により生じた損害について責任を負いません。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 pb-2 border-b border-gray-700">第17条（規約変更）</h2>
          <p className="text-gray-300 leading-relaxed mb-4">当社は、本規約を変更できるものとし、変更後の規約は本サービス上に掲示した時点から効力を生じます。</p>
          <p className="text-gray-300 leading-relaxed">変更後に本サービスを利用した場合、利用者は当該変更に同意したものとみなします。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 pb-2 border-b border-gray-700">第18条（準拠法・管轄）</h2>
          <p className="text-gray-300 leading-relaxed">本規約は日本法に準拠し、本サービスに関する紛争は東京地方裁判所または東京簡易裁判所を第一審の専属的合意管轄裁判所とします。</p>
        </section>

        <footer className="mt-12 pt-4 text-right text-xs text-gray-300">
          <p>最終更新：2026年1月13日</p>
        </footer>
      </div>
    </Layout>
  );
}
