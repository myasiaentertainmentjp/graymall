// src/pages/company.tsx
import Layout from '../components/Layout';

export default function CompanyPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-white mb-6 pb-4 border-b-2 border-gray-700">会社概要</h1>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border border-gray-700">
                <th className="bg-gray-900 px-4 py-4 text-left font-semibold text-gray-200 w-1/3 border-r border-gray-700">運営会社</th>
                <td className="px-4 py-4 text-gray-300">
                  合同会社マイアジアエンターテインメント<br />
                  <span className="text-sm text-gray-400">MYASIA Entertainment LLC.</span>
                </td>
              </tr>
              <tr className="border border-gray-700">
                <th className="bg-gray-900 px-4 py-4 text-left font-semibold text-gray-200 border-r border-gray-700">住所</th>
                <td className="px-4 py-4 text-gray-300">
                  〒184-0004<br />
                  東京都小金井市本町6-9-39 メゾンルビエール106
                </td>
              </tr>
              <tr className="border border-gray-700">
                <th className="bg-gray-900 px-4 py-4 text-left font-semibold text-gray-200 border-r border-gray-700">設立</th>
                <td className="px-4 py-4 text-gray-300">2021年11月</td>
              </tr>
              <tr className="border border-gray-700">
                <th className="bg-gray-900 px-4 py-4 text-left font-semibold text-gray-200 border-r border-gray-700">メールアドレス</th>
                <td className="px-4 py-4">
                  <a href="mailto:info@graymall.jp" className="text-blue-600 hover:underline">info@graymall.jp</a>
                </td>
              </tr>
              <tr className="border border-gray-700">
                <th className="bg-gray-900 px-4 py-4 text-left font-semibold text-gray-200 border-r border-gray-700">電話番号</th>
                <td className="px-4 py-4 text-gray-300">090-5835-6898</td>
              </tr>
              <tr className="border border-gray-700">
                <th className="bg-gray-900 px-4 py-4 text-left font-semibold text-gray-200 border-r border-gray-700">受付時間</th>
                <td className="px-4 py-4 text-gray-300">
                  平日10:00〜18:00（年末年始を除く）
                </td>
              </tr>
              <tr className="border border-gray-700">
                <th className="bg-gray-900 px-4 py-4 text-left font-semibold text-gray-200 border-r border-gray-700 align-top">提供サービス</th>
                <td className="px-4 py-4 text-gray-300">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>グレーモール運営</li>
                    <li>SNS運用代行</li>
                    <li>メディア制作</li>
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
