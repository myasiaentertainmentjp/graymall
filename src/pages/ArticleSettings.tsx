// src/pages/ArticleSettings.tsx
// 記事ごとの詳細設定ページ

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import AffiliateSettings from '../components/AffiliateSettings';
import { ArrowLeft, Loader2, FileText, Eye, Edit } from 'lucide-react';

type Article = {
  id: string;
  title: string;
  slug: string;
  price: number;
  status: 'draft' | 'pending_review' | 'published' | 'rejected';
  affiliate_enabled: boolean;
  affiliate_target: 'all' | 'buyers' | null;
  affiliate_rate: number | null;
  affiliate_rate_last_changed_at: string | null;
};

export default function ArticleSettings() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && id) {
      loadArticle();
    }
  }, [user, id]);

  const loadArticle = async () => {
    if (!user || !id) return;

    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('articles')
        .select(`
          id, title, slug, price, status,
          affiliate_enabled, affiliate_target, affiliate_rate, affiliate_rate_last_changed_at
        `)
        .eq('id', id)
        .eq('author_id', user.id)
        .single();

      if (fetchError) {
        setError('記事が見つかりません');
        console.error('Error:', fetchError);
      } else if (data) {
        setArticle(data as Article);
      }
    } catch (err) {
      setError('読み込みに失敗しました');
      console.error('Exception:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAffiliateUpdate = (updated: Partial<Article>) => {
    if (article) {
      setArticle({ ...article, ...updated });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </Layout>
    );
  }

  if (error || !article) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700">{error || '記事が見つかりません'}</p>
            <button
              onClick={() => navigate('/my-articles')}
              className="mt-4 text-blue-600 hover:underline"
            >
              記事一覧に戻る
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const statusLabels: Record<string, string> = {
    draft: '下書き',
    pending_review: '審査中',
    published: '公開中',
    rejected: '却下',
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-6">
          <Link
            to="/my-articles"
            className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>記事一覧に戻る</span>
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{article.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  article.status === 'published'
                    ? 'bg-green-100 text-green-800'
                    : article.status === 'pending_review'
                    ? 'bg-yellow-100 text-yellow-800'
                    : article.status === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {statusLabels[article.status]}
                </span>
                <span>¥{article.price.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                to={`/editor/${article.id}`}
                className="inline-flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                <Edit className="w-4 h-4" />
                <span>編集</span>
              </Link>
              {article.status === 'published' && (
                <Link
                  to={`/articles/${article.slug}`}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Eye className="w-4 h-4" />
                  <span>表示</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* アフィリエイト設定 */}
        {article.price > 0 ? (
          <AffiliateSettings article={article} onUpdate={handleAffiliateUpdate} />
        ) : (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">
              無料記事にはアフィリエイト設定は適用されません
            </p>
            <p className="text-sm text-gray-500 mt-2">
              有料記事に設定するには、記事を編集して価格を設定してください
            </p>
          </div>
        )}

        {/* 売上情報（公開記事のみ） */}
        {article.status === 'published' && article.price > 0 && (
          <ArticleSalesInfo articleId={article.id} />
        )}
      </div>
    </Layout>
  );
}

// 記事別売上情報コンポーネント
function ArticleSalesInfo({ articleId }: { articleId: string }) {
  const [sales, setSales] = useState<{
    total: number;
    count: number;
    affiliateCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSales();
  }, [articleId]);

  const loadSales = async () => {
    try {
      const { data } = await supabase
        .from('orders')
        .select('amount, author_amount, affiliate_user_id')
        .eq('article_id', articleId)
        .eq('status', 'paid');

      if (data) {
        setSales({
          total: data.reduce((sum, o) => sum + (o.author_amount || 0), 0),
          count: data.length,
          affiliateCount: data.filter(o => o.affiliate_user_id).length,
        });
      }
    } catch (err) {
      console.error('Error loading sales:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!sales || sales.count === 0) {
    return null;
  }

  return (
    <div className="mt-6 bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">この記事の売上</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            ¥{sales.total.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">総収益</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            {sales.count}
          </div>
          <div className="text-sm text-gray-600">販売数</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {sales.affiliateCount}
          </div>
          <div className="text-sm text-gray-600">紹介経由</div>
        </div>
      </div>
    </div>
  );
}
