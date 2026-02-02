// src/components/Footer.tsx
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-20">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* 上部: ロゴ + リンク */}
        <div className="flex flex-col lg:flex-row lg:justify-between gap-12 mb-12">
          {/* ロゴ・説明 */}
          <div className="lg:max-w-xs">
            <Link to="/" className="inline-block text-xl font-bold text-gray-900 mb-4">
              グレーモール
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              個人の体験談やノウハウを売買できるデジタルコンテンツマーケットプレイス
            </p>
          </div>

          {/* リンク群 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 lg:gap-16">
            <div>
              <h4 className="text-base font-semibold text-gray-900 mb-4">
                サービス
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/terms" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    利用規約
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    プライバシーポリシー
                  </Link>
                </li>
                <li>
                  <Link to="/law" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    特定商取引法に基づく表記
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-base font-semibold text-gray-900 mb-4">
                ガイド
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/guidelines" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    使い方ガイド
                  </Link>
                </li>
                <li>
                  <Link to="/payments" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    取引・支払いについて
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    よくある質問
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-base font-semibold text-gray-900 mb-4">
                サポート
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/contact" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    お問い合わせ
                  </Link>
                </li>
                <li>
                  <Link to="/company" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    会社概要
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 下部: コピーライト */}
        <div className="border-t border-gray-200 pt-8">
          <p className="text-xs text-gray-400 text-center">
            &copy; {currentYear} グレーモール / 合同会社マイアジアエンターテインメント
          </p>
        </div>
      </div>
    </footer>
  );
}
