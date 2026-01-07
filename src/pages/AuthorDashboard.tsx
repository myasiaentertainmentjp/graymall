import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import type { Database } from '../lib/database.types';
import { FileText, DollarSign, Edit, Trash2, Eye } from 'lucide-react';

type Article = Database['public']['Tables']['articles']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];

interface ArticleWithSales extends Article {
  sales_count: number;
  total_revenue: number;
}

export default function AuthorDashboard() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<ArticleWithSales[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [thisMonthRevenue, setThisMonthRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    setLoading(true);

    const { data: articlesData } = await supabase
      .from('articles')
      .select('*')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    if (articlesData) {
      const articlesWithSales = await Promise.all(
        articlesData.map(async (article) => {
          const { data: orders } = await supabase
            .from('orders')
            .select('amount')
            .eq('article_id', article.id)
            .eq('status', 'paid');

          const salesCount = orders?.length || 0;
          const totalRevenue = orders?.reduce((sum, order) => sum + order.amount, 0) || 0;

          return {
            ...article,
            sales_count: salesCount,
            total_revenue: totalRevenue,
          };
        })
      );

      setArticles(articlesWithSales);

      const allRevenue = articlesWithSales.reduce((sum, a) => sum + a.total_revenue, 0);
      setTotalRevenue(allRevenue);

      const { data: thisMonthOrders } = await supabase
        .from('orders')
        .select('amount')
        .eq('author_id', user.id)
        .eq('status', 'paid')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      const monthRevenue = thisMonthOrders?.reduce((sum, order) => sum + order.amount, 0) || 0;
      setThisMonthRevenue(monthRevenue);
    }

    setLoading(false);
  };

  const getStatusBadge = (status: Article['status']) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-700',
      pending_review: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };

    const labels = {
      draft: '下書き',
      pending_review: '審査中',
      published: '公開中',
      rejected: '却下',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この記事を削除してもよろしいですか？')) return;

    const { error } = await supabase.from('articles').delete().eq('id', id);

    if (!error) {
      setArticles(articles.filter((a) => a.id !== id));
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-gray-600">読み込み中...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="text-gray-600 mt-2">記事と売上を管理</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">総記事数</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{articles.length}</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">今月の売上</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              ¥{thisMonthRevenue.toLocaleString()}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">総売上</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              ¥{totalRevenue.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">記事一覧</h2>
            <Link
              to="/articles/new"
              className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition text-sm font-medium"
            >
              新しい記事を作成
            </Link>
          </div>

          {articles.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              まだ記事がありません。最初の記事を作成しましょう！
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      タイトル
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      価格
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      売上件数
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                      売上合計
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {articles.map((article) => (
                    <tr key={article.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 max-w-md truncate">
                          {article.title}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(article.status)}</td>
                      <td className="px-6 py-4 text-gray-700">
                        ¥{article.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-gray-700">{article.sales_count}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium">
                        ¥{article.total_revenue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {article.status === 'published' && (
                            <Link
                              to={`/articles/${article.slug}`}
                              className="p-2 text-gray-600 hover:text-gray-900 transition"
                              title="表示"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          )}
                          <Link
                            to={`/articles/edit/${article.id}`}
                            className="p-2 text-blue-600 hover:text-blue-800 transition"
                            title="編集"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          {article.status === 'draft' && (
                            <button
                              onClick={() => handleDelete(article.id)}
                              className="p-2 text-red-600 hover:text-red-800 transition"
                              title="削除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
