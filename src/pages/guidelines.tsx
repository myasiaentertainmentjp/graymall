// src/pages/guidelines.tsx
import Layout from '../components/Layout';

export default function GuidelinesPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-gray-200">使い方ガイド</h1>

        <p className="text-gray-600 leading-relaxed mb-4">
          本ページは、グレーモールで掲載できるコンテンツの範囲と、禁止事項を分かりやすくまとめたものです。
        </p>
        <p className="text-gray-600 leading-relaxed mb-8">
          本サービスは決済事業者の規定および法令遵守の観点から、掲載できないテーマがあります。あらかじめご確認ください。
        </p>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">1. 掲載可能なコンテンツの基本的な考え方</h2>
          <p className="text-gray-600 leading-relaxed mb-4">グレーモールでは、以下のようなコンテンツを掲載できます。</p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>個人の体験談、実体験に基づくノウハウ</li>
            <li>ビジネス、マーケティング、SNS運用、創作、スキル共有</li>
            <li>学習目的の解説、参考情報の紹介、考え方の共有</li>
            <li>恋愛、対人関係、コミュニケーションに関する一般的な情報（ただし禁止事項に該当しないもの）</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mb-4">上記は、すべて次の前提を満たす必要があります。</p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed space-y-2">
            <li>法令を遵守していること</li>
            <li>第三者の権利（著作権、商標権、肖像権、プライバシー等）を侵害しないこと</li>
            <li>本ガイドラインの禁止事項に該当しないこと</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">2. 掲載できないテーマについて（重要）</h2>
          <p className="text-gray-600 leading-relaxed mb-4">グレーモールでは、決済事業者の規定および運営方針により、以下のテーマは掲載できません。</p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed space-y-2">
            <li>成人向けコンテンツ、ポルノ、性的興奮を主目的とするコンテンツ</li>
            <li>風俗・アダルト業界の勧誘、宣伝、送客、予約・購入等の誘導を含む内容</li>
            <li>性的サービス、売買春、援助交際、性的搾取に関する内容</li>
            <li>未成年者に関連する性的表現、恋愛、勧誘、体験談その他一切</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">3. 未成年・犯罪・搾取に関する表現</h2>
          <p className="text-gray-600 leading-relaxed mb-4">以下の内容は無条件で禁止します。</p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>未成年者に関わる性的表現、恋愛、勧誘、体験談</li>
            <li>人身売買、強制、搾取、違法労働に関する内容</li>
            <li>売春防止法、児童福祉法等に抵触するおそれのある内容</li>
            <li>犯罪行為を肯定、助長、または具体的に指南する内容</li>
          </ul>
          <p className="text-gray-600 leading-relaxed">年齢に関する表現が曖昧な場合や、未成年が関与している可能性がある場合、当社の判断により非公開または削除します。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">4. 違法行為・規約回避に関する内容</h2>
          <p className="text-gray-600 leading-relaxed mb-4">以下のような内容は掲載できません。</p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>違法行為を直接的に助長する表現</li>
            <li>法令違反を前提としたノウハウ</li>
            <li>各種サービスやプラットフォームの利用規約違反を明確に推奨する内容</li>
            <li>不正アクセス、スパム、なりすまし、詐欺、フィッシング等に関する手口の具体的指南</li>
          </ul>
          <p className="text-gray-600 leading-relaxed">一般論としての解説、注意喚起、リスク説明、合法的な範囲に留まる情報提供については、当社の判断により掲載を認める場合があります。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">5. 投資・医療・法律など専門分野の取り扱い</h2>
          <h3 className="text-base font-semibold text-gray-700 mt-4 mb-3">掲載可能な内容</h3>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>個人の体験談や考え方の共有</li>
            <li>一般的な情報の紹介</li>
            <li>学習目的、参考情報としての解説</li>
          </ul>

          <h3 className="text-base font-semibold text-gray-700 mt-6 mb-3">禁止・注意事項</h3>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>投資助言、医療行為、法律判断を直接行う内容は禁止します</li>
            <li>成果や効果を保証する表現は禁止します<br /><span className="text-sm text-gray-500">例：「必ず儲かる」「確実に治る」「絶対に成功する」</span></li>
          </ul>
          <p className="text-gray-600 leading-relaxed">これらの分野を扱う場合は、「個人の見解であり、結果を保証するものではありません」といった趣旨の注意書きを含めてください。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">6. 外部リンク・外部誘導について</h2>
          <p className="text-gray-600 leading-relaxed mb-4">外部リンクは、参考情報としての掲載に限り認めます。</p>
          <p className="text-gray-600 leading-relaxed mb-4">以下のような行為は禁止します。</p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>LINE等のクローズドな連絡手段への直接誘導</li>
            <li>外部での決済、契約、有料サービスへの誘導を主目的とした記載</li>
            <li>購入後の主要な価値提供が、当サイト外で行われる設計</li>
          </ul>
          <p className="text-gray-600 leading-relaxed">SNSアカウントへの誘導については、プロフィール情報としての記載に限り許可します。ただし、外部の有料プランやサービスへの導線として過度に利用されていると当社が判断した場合、非公開または修正を求めることがあります。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">7. コンテンツ提供の完結性について</h2>
          <p className="text-gray-600 leading-relaxed mb-4">購入者は、決済完了後、グレーモール上の有料エリアにてコンテンツを受け取れる必要があります。</p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>購入後に別サービスへの参加が必須となる</li>
            <li>サイト外でのやり取りがコンテンツの中心となる</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mb-2">といった設計は、原則として認められません。</p>
          <p className="text-gray-600 leading-relaxed">販売後の軽微な質問対応や補足説明については、販売者の裁量に委ねられますが、当社はその内容や対応について関与・保証を行いません。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">8. 価格設定・コンテンツ品質</h2>
          <p className="text-gray-600 leading-relaxed mb-4">以下に該当するコンテンツは掲載できません。</p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>内容が未完成、または著しく情報量が不足しているもの</li>
            <li>価格と内容のバランスを著しく欠くもの</li>
          </ul>
          <p className="text-gray-600 leading-relaxed">価格設定の妥当性については、最終的に当社が判断します。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">9. 第三者の権利・個人情報</h2>
          <p className="text-gray-600 leading-relaxed mb-4">以下の行為は禁止されます。</p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>他者の著作物、画像、文章、動画の無断転載</li>
            <li>肖像権、プライバシーを侵害する内容</li>
            <li>実在人物や企業に対する誹謗中傷</li>
          </ul>
          <p className="text-gray-600 leading-relaxed">権利侵害の申し立てがあった場合、当社は事前通知なく当該コンテンツを非公開または削除することがあります。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">10. 通報および運営の対応</h2>
          <p className="text-gray-600 leading-relaxed mb-4">利用者は、不適切と考えるコンテンツを通報できます。</p>
          <p className="text-gray-600 leading-relaxed mb-4">通報があった場合、当社は必要に応じて一時的に非公開とします。</p>
          <p className="text-gray-600 leading-relaxed mb-4">調査結果に基づき、公開継続、修正要請、削除等を判断します。</p>
          <p className="text-gray-600 leading-relaxed mb-2">再公開の可否は当社の判断によります。</p>
          <p className="text-gray-600 leading-relaxed">措置理由について、当社は原則として個別に説明する義務を負いません。</p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">11. 運営による裁量とガイドライン変更</h2>
          <p className="text-gray-600 leading-relaxed mb-4">当社は、以下の対応を行う権限を有します。</p>
          <ul className="list-disc pl-6 text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>コンテンツの非公開、削除、修正要請</li>
            <li>販売停止</li>
            <li>アカウントの制限、停止、退会処分</li>
          </ul>
          <p className="text-gray-600 leading-relaxed">本ガイドラインは、法令改正、決済事業者の方針変更、運営上の必要に応じて、予告なく変更されることがあります。</p>
        </section>

        <footer className="mt-12 pt-4 text-right text-xs text-gray-300">
          <p>最終更新：2026年1月14日</p>
        </footer>
      </div>
    </Layout>
  );
}
