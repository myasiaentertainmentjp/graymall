// src/pages/terms.tsx
import Layout from '../components/Layout';

export default function TermsPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-gray-200">利用規約</h1>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">第1条（適用）</h2>
          <ol className="list-decimal pl-6 text-gray-600 leading-relaxed space-y-2">
            <li>本規約は、合同会社マイアジアエンターテインメント（以下「当社」といいます。）が運営するマーケットプレイス「グレーモール」（以下「本サービス」といいます。）の利用条件を定めるものです。</li>
            <li>本サービスのURLは <a href="https://graymall.jp/" className="text-blue-600 hover:underline">https://graymall.jp/</a> です。</li>
            <li>利用者は、本サービスを利用した時点で、本規約の内容に同意したものとみなします。</li>
            <li>当社は、本サービス上にガイドライン、ヘルプ、注意事項等を定める場合があり、これらは本規約の一部を構成します。</li>
            <li>本規約と当社が別途定める個別規定の内容が異なる場合には、当該個別規定が優先されます。</li>
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">第2条（定義）</h2>
          <p className="text-gray-600 leading-relaxed mb-4">本規約において使用する用語は、以下のとおり定義します。</p>
          <ol className="list-decimal pl-6 text-gray-600 leading-relaxed space-y-2">
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
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">第3条（本サービスの内容および当社の立場）</h2>
          <ol className="list-decimal pl-6 text-gray-600 leading-relaxed space-y-2">
            <li>本サービスは、販売者が商品等を掲載・販売し、購入者がこれを購入できる場を提供するプラットフォームです。</li>
            <li>当社は、商品等の売買契約の当事者とはならず、販売者・購入者・紹介者間の取引機会を提供する立場にあります。</li>
            <li>当社は、本サービスの健全な運営およびリスク管理のため、取引状況の確認、売上の保留、利用制限その他必要な措置を行うことができます。</li>
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">第4条（登録）</h2>
          <ol className="list-decimal pl-6 text-gray-600 leading-relaxed space-y-2">
            <li>会員登録を希望する者は、当社所定の方法により申請し、当社が承認した時点で、本規約を内容とする利用契約が成立します。</li>
            <li>登録情報は、真実かつ正確でなければなりません。虚偽、誤記、なりすまし等が判明した場合、当社は利用停止、退会処分等を行うことができます。</li>
            <li>当社は、登録の可否およびその理由について開示する義務を負いません。</li>
            <li>未成年者が本サービスを利用する場合、法定代理人の同意を得たものとみなします。</li>
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">第5条（アカウント管理）</h2>
          <ol className="list-decimal pl-6 text-gray-600 leading-relaxed space-y-2">
            <li>会員は、自己の責任においてアカウント情報を管理するものとします。</li>
            <li>アカウントを用いて行われた行為は、当該会員自身の行為とみなします。</li>
            <li>不正利用のおそれがある場合、会員は直ちに当社へ通知し、当社の指示に従うものとします。</li>
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">第6条（手数料）</h2>
          <ol className="list-decimal pl-6 text-gray-600 leading-relaxed space-y-2">
            <li>当社は、本サービスの利用に際し、販売者または紹介者に対して手数料を課すことがあります。</li>
            <li>標準的な手数料の目安は、次のとおりとします。
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>販売手数料 販売価格の10％</li>
                <li>出金手数料 1回あたり350円</li>
                <li>チャージバック事務手数料 1件あたり3,000円</li>
              </ul>
            </li>
            <li>当社は、運営上の必要に応じ、手数料の内容を変更できるものとします。</li>
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">第7条（アフィリエイト報酬）</h2>
          <ol className="list-decimal pl-6 text-gray-600 leading-relaxed space-y-2">
            <li>販売者は、商品等の公開時に、当該商品に適用するアフィリエイト報酬率を、0％、10％、20％、30％、40％、50％のいずれかから選択するものとします。</li>
            <li>選択された報酬率は、当該商品ページに表示され、紹介者に適用されます。</li>
            <li>商品公開後の報酬率の変更については、当社が定める方法および条件に従うものとします。</li>
            <li>当社は、アフィリエイト報酬の発生、計算、支払について、最終的な裁量を有します。</li>
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">第8条（決済および代金受領権限）</h2>
          <ol className="list-decimal pl-6 text-gray-600 leading-relaxed space-y-2">
            <li>購入者は、当社が指定する決済方法を用いて代金を支払うものとします。</li>
            <li>販売者は、当社が販売者に代わって代金を受領する権限を当社に授与するものとします。</li>
            <li>紹介者報酬が発生する場合、販売者は、当社が紹介者へ報酬を支払うために必要な権限を当社に授与するものとします。</li>
            <li>決済代行サービスに起因して生じた損害について、当社は責任を負いません。</li>
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">第9条（出金）</h2>
          <ol className="list-decimal pl-6 text-gray-600 leading-relaxed space-y-2">
            <li><strong className="font-semibold">会員は、内部残高が3,000円以上となった場合に限り、出金を申請できます。</strong></li>
            <li>初回出金時には、当社が定める本人確認を完了する必要があります。本人確認が完了した後は、同一会員について原則として再度の本人確認は不要とします。</li>
            <li>当社は、不正防止その他の理由により、出金を保留または拒否することがあります。</li>
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">第10条（キャンセル・返金）</h2>
          <ol className="list-decimal pl-6 text-gray-600 leading-relaxed space-y-2">
            <li>商品等の性質上、購入後のキャンセル、返品、返金は原則としてできません。</li>
            <li>ただし、当社が特別に必要と判断した場合に限り、返金を認めることがあります。</li>
            <li>返金が行われる場合、当社は返金に伴う手数料等を控除できるものとします。</li>
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">第11条（チャージバック等）</h2>
          <ol className="list-decimal pl-6 text-gray-600 leading-relaxed space-y-2">
            <li>チャージバック、支払取消し、未払等が発生した場合、当社は当該金額および事務手数料を販売者または紹介者の内部残高から控除、または請求できるものとします。</li>
            <li>当社は、当社に不利益が生じない範囲で、合理的かつ慣例的な対応を行うものとします。</li>
            <li>悪質または反復的な場合、当社はアカウント停止その他の措置を行うことができます。</li>
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">第12条（禁止事項）</h2>
          <p className="text-gray-600 leading-relaxed mb-2">利用者は、以下の行為を行ってはなりません。</p>
          <p className="text-gray-600 leading-relaxed">法令違反、公序良俗違反、権利侵害、不正決済、虚偽表示、なりすまし、反社会的勢力への関与、その他当社が不適切と判断する行為。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">第13条（免責）</h2>
          <ol className="list-decimal pl-6 text-gray-600 leading-relaxed space-y-2">
            <li>当社は、本サービスの内容、成果、収益性等について一切保証しません。</li>
            <li>利用者間の紛争について、当社は当社に故意または重過失がある場合を除き責任を負いません。</li>
            <li>当社が責任を負う場合であっても、賠償範囲は直接かつ通常の損害に限られます。</li>
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">第14条（規約変更）</h2>
          <p className="text-gray-600 leading-relaxed">当社は、本規約を変更できるものとし、変更後に本サービスを利用した場合、当該変更に同意したものとみなします。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">第15条（準拠法・管轄）</h2>
          <p className="text-gray-600 leading-relaxed">本規約は日本法に準拠し、本サービスに関する紛争は東京地方裁判所または東京簡易裁判所を第一審の専属的合意管轄裁判所とします。</p>
        </section>

        <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-400">
          <p>グレーモール利用規約</p>
          <p>最終更新日：2026年1月6日</p>
        </footer>
      </div>
    </Layout>
  );
}
