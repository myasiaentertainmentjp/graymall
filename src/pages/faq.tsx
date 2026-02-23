// src/pages/faq.tsx
import { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { useSEO } from '../hooks/useSEO';

type FAQItem = {
  question: string;
  answer: string | string[];
};

type FAQSection = {
  title: string;
  items: FAQItem[];
};

const faqDataSections: FAQSection[] = [
  {
    title: 'アカウント・ログイン',
    items: [
      {
        question: 'ログインできない／パスワードを忘れた',
        answer: '入力ミス（大文字・小文字、全角、空白）をご確認ください。解決しない場合は「パスワード再設定」から再設定をお試しください。',
      },
      {
        question: 'パスワード再設定メールが届かない',
        answer: '迷惑メールフォルダ、受信拒否設定をご確認ください。携帯キャリアメールや一部のメールサービスでは届きにくい場合があります。可能であればGmail等の利用もご検討ください。',
      },
    ],
  },
  {
    title: '購入・閲覧',
    items: [
      {
        question: '購入したコンテンツはどこから見られますか',
        answer: 'ログイン後、マイページの「購入したコンテンツ」から閲覧・ダウンロードできます。',
      },
      {
        question: '決済完了後、いつ見られますか',
        answer: 'クレジットカード決済が完了すると、原則として即時に閲覧・ダウンロード可能です。',
      },
      {
        question: '購入したのに見られない／ダウンロードできない',
        answer: '通信環境やブラウザの影響で表示が崩れることがあります。別ブラウザ（Chrome推奨）やシークレットウィンドウでお試しください。改善しない場合はお問い合わせください。',
      },
      {
        question: '購入後に出品者が非公開にした／退会した場合はどうなりますか',
        answer: '購入済みコンテンツについては、原則として購入者は引き続き閲覧できる扱いとなります。ただし、法令対応・権利侵害・重大な規約違反等により、運営判断で閲覧停止となる場合があります。',
      },
    ],
  },
  {
    title: '決済（クレジットカード）',
    items: [
      {
        question: 'クレジットカードの登録・決済に失敗します',
        answer: 'カード番号・有効期限・セキュリティコードの誤り、利用限度額、カード会社側の判定（不正検知等）により失敗することがあります。運営側ではカード会社の判定理由を確認できず、個別に解除等もできません。別カードでお試しください。',
      },
      {
        question: '分割払いはできますか',
        answer: 'グレーモール側では分割払いの指定はできません。一括決済となります。分割の可否はカード会社のサービスに依存します。',
      },
    ],
  },
  {
    title: '出品・審査・表示',
    items: [
      {
        question: '記事（コンテンツ）を公開したのにトップや検索に出ません',
        answer: '掲載位置や露出は、閲覧者の状況や内部ロジックにより変動します。公開＝必ず上位表示、トップ掲載を保証するものではありません。',
      },
      {
        question: '審査はありますか／どのくらいかかりますか',
        answer: '運営側で確認（審査）を行う場合があります。審査がある場合でも、完了連絡や個別の審査進捗のご案内は行わない運用とします。',
      },
      {
        question: '否認・非公開の理由を教えてほしい',
        answer: '原則として個別の理由開示は行いません。ガイドラインに照らし、運営判断で「修正」「非公開」「販売停止」となる場合があります。',
      },
      {
        question: '公開後に編集（リライト）できますか',
        answer: '可能です。ただし内容の変更により、再確認（再審査）や運営判断で非公開となる場合があります。',
      },
      {
        question: 'noteやWordPressの記事をそのままコピペできますか？',
        answer: 'はい、画像を含めてそのままコピー＆ペーストで移行できます。サムネイル（アイキャッチ画像）のサイズもnoteやWordPressと同等（横長16:9程度）のため、既存の画像をそのまま流用いただけます。',
      },
    ],
  },
  {
    title: '売上・出金',
    items: [
      {
        question: '売上はいつ反映されますか',
        answer: '取引が確定した後、売上として反映されます。反映タイミングはシステム処理の都合で前後することがあります。',
      },
      {
        question: '出金申請はいつできますか',
        answer: '出金可能残高がある場合、管理画面から出金申請ができます。最低出金金額が設定されており、金額未満の場合は申請できません。',
      },
      {
        question: '初回の出金に本人確認が必要なのはなぜですか',
        answer: '不正利用防止のためです。本人確認は初回のみで、完了後は原則として次回以降の出金では不要です。ただし不正の疑い等がある場合は、追加確認をお願いする場合があります。',
      },
      {
        question: '出金申請がエラーになります',
        answer: '入力内容（名義、銀行情報）の不一致などが原因となることがあります。エラー画面の内容が分かるスクリーンショットと、登録メールアドレスを添えてお問い合わせください。',
      },
      {
        question: '出金申請したのに着金しません',
        answer: '銀行休業日やシステム処理により遅れる場合があります。一定期間経っても着金しない場合は、お問い合わせください。',
      },
    ],
  },
  {
    title: '手数料',
    items: [
      {
        question: '手数料は何がかかりますか',
        answer: '主に以下です。販売手数料、決済に関連する手数料、出金時の振込手数料。手数料率・金額はサービス内に表示されます。',
      },
    ],
  },
  {
    title: 'アフィリエイト',
    items: [
      {
        question: 'アフィリエイト報酬率は誰が決めますか',
        answer: '出品者が、記事公開時に 0％ / 10％ / 20％ / 30％ / 40％ / 50％ から選択します。',
      },
      {
        question: 'アフィリエイトリンクから購入されたのに報酬がつきません',
        answer: '多くは「リンクを開いたブラウザ」と「購入したブラウザ」が異なることが原因です。SNS内ブラウザでリンクを開き、その後に別ブラウザで購入すると、紐づきが切れることがあります。購入後に報酬を後付けで付与する対応は原則できません。',
      },
      {
        question: '自分で自分の記事を踏んで購入した場合も報酬は出ますか',
        answer: '不正防止の観点から、自己購入や不自然な取引は無効化される場合があります。運営判断となります。',
      },
    ],
  },
  {
    title: '返金・キャンセル・チャージバック',
    items: [
      {
        question: '返金やキャンセルはできますか',
        answer: 'デジタルコンテンツの性質上、原則として返金・キャンセルは行いません。ただし当社が特別に認めた場合に限り、例外対応を行うことがあります。',
      },
      {
        question: 'チャージバックが発生した場合はどうなりますか',
        answer: 'チャージバックや不正利用の疑いがある場合、該当取引の売上取消、支払い保留、アカウント制限等を行う場合があります。運営や他ユーザーに不利益が生じないよう、必要な対応を優先します。',
      },
    ],
  },
  {
    title: 'お問い合わせ',
    items: [
      {
        question: 'どこから問い合わせできますか',
        answer: 'サイト内の「お問い合わせ」よりご連絡ください。内容に応じて、確認のためスクリーンショットや取引情報の提示をお願いすることがあります。',
      },
    ],
  },
];

function FAQAccordion({ item }: { item: FAQItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        className={`w-full flex items-center gap-3 px-4 py-4 text-left transition-colors ${isOpen ? 'bg-gray-800' : 'bg-gray-900 hover:bg-gray-800'}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="flex items-center justify-center w-7 h-7 bg-emerald-600 text-white font-bold text-sm rounded-full flex-shrink-0">Q</span>
        <span className="flex-1 text-gray-100 font-medium">{item.question}</span>
        <span className="text-gray-400 text-xl font-light">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div className="flex gap-3 px-4 py-4 bg-gray-900 border-t border-gray-700">
          <span className="flex items-center justify-center w-7 h-7 bg-red-600 text-white font-bold text-sm rounded-full flex-shrink-0">A</span>
          <p className="flex-1 text-gray-300 leading-relaxed whitespace-pre-wrap">
            {Array.isArray(item.answer) ? item.answer.join('\n') : item.answer}
          </p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  // FAQ構造化データ用にフラット化
  const faqItems = useMemo(() =>
    faqDataSections.flatMap(section =>
      section.items.map(item => ({
        question: item.question,
        answer: Array.isArray(item.answer) ? item.answer.join(' ') : item.answer,
      }))
    ),
  []);

  useSEO({
    title: 'よくある質問（FAQ）',
    description: 'グレーモールの登録・購入・出品・売上・アフィリエイトに関するよくある質問と回答をまとめています。',
    canonicalUrl: '/faq',
    breadcrumbs: [
      { name: 'ホーム', url: '/' },
      { name: 'よくある質問', url: '/faq' },
    ],
    faqData: { items: faqItems },
  });

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-white mb-6 pb-4 border-b-2 border-gray-700">よくある質問（FAQ）</h1>

        <p className="text-gray-300 leading-relaxed mb-8">グレーモールの登録・購入・出品・売上・アフィリエイトに関して、よくある質問をまとめました。</p>

        {faqDataSections.map((section, index) => (
          <section key={index} className="mb-10">
            <h2 className="text-lg font-semibold text-gray-100 mb-4 pb-2 border-b border-gray-700">{section.title}</h2>
            <div className="space-y-3">
              {section.items.map((item, itemIndex) => (
                <FAQAccordion key={itemIndex} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </Layout>
  );
}
