// src/pages/NotFound.tsx
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

export default function NotFound() {
  useSEO({
    title: 'ページが見つかりません',
    description: 'お探しのページは存在しないか、移動した可能性があります。',
    noIndex: true,
  });

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          {/* 404イラスト */}
          <div className="mb-8">
            <div className="text-8xl font-bold text-gray-200 mb-2">404</div>
            <div className="w-24 h-1 bg-gray-900 mx-auto rounded-full" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            ページが見つかりません
          </h1>
          <p className="text-gray-600 mb-8">
            お探しのページは存在しないか、移動した可能性があります。
            URLをご確認いただくか、以下のリンクからお探しください。
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition"
            >
              <Home className="w-4 h-4" />
              トップページへ
            </Link>
            <Link
              to="/articles"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
            >
              <Search className="w-4 h-4" />
              記事を探す
            </Link>
          </div>

          <button
            onClick={() => window.history.back()}
            className="mt-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            前のページに戻る
          </button>
        </div>
      </div>
    </Layout>
  );
}
