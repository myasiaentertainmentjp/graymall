// src/pages/company.tsx
import Layout from '../components/Layout';

export default function CompanyPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-gray-200">会社概要</h1>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border border-gray-200">
                <th className="bg-gray-50 px-4 py-4 text-left font-semibold text-gray-700 w-1/3 border-r border-gray-200">運営会社</th>
                <td className="px-4 py-4 text-gray-600">
                  合同会社マイアジアエンターテインメント<br />
                  <span className="text-sm text-gray-500">MYASIA Entertainment LLC.</span>
                </td>
              </tr>
              <tr className="border border-gray-200">
                <th className="bg-gray-50 px-4 py-4 text-left font-semibold text-gray-700 border-r border-gray-200">住所</th>
                <td className="px-4 py-4 text-gray-600">
                  〒184-0004<br />
                  東京都小金井市本町6-9-39 メゾンルビエール106
                </td>
              </tr>
              <tr className="border border-gray-200">
                <th className="bg-gray-50 px-4 py-4 text-left font-semibold text-gray-700 border-r border-gray-200">設立</th>
                <td className="px-4 py-4 text-gray-600">2021年11月</td>
              </tr>
              <tr className="border border-gray-200">
                <th className="bg-gray-50 px-4 py-4 text-left font-semibold text-gray-700 border-r border-gray-200">メールアドレス</th>
                <td className="px-4 py-4">
                  <a href="mailto:info@graymall.jp" className="text-blue-600 hover:underline">info@graymall.jp</a>
                </td>
              </tr>
              <tr className="border border-gray-200">
                <th className="bg-gray-50 px-4 py-4 text-left font-semibold text-gray-700 border-r border-gray-200">電話番号</th>
                <td className="px-4 py-4 text-gray-600">090-5835-6898</td>
              </tr>
              <tr className="border border-gray-200">
                <th className="bg-gray-50 px-4 py-4 text-left font-semibold text-gray-700 border-r border-gray-200">受付時間</th>
                <td className="px-4 py-4 text-gray-600">
                  平日10:00〜18:00（年末年始を除く）
                </td>
              </tr>
              <tr className="border border-gray-200">
                <th className="bg-gray-50 px-4 py-4 text-left font-semibold text-gray-700 border-r border-gray-200 align-top">提供サービス</th>
                <td className="px-4 py-4 text-gray-600">
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
