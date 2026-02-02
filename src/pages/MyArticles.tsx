// src/pages/MyArticles.tsx
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import type { Database } from '../lib/database.types';
import { FileText, Plus } from 'lucide-react';

type Article = Database['public']['Tables']['articles']['Row'];
type StatusFilter = 'all' | 'draft' | 'published' | 'pending_review' | 'rejected';

export default function MyArticles() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    useEffect(() => {
      if (user) {
        loadMyArticles();
      }
    }, [user]);

    const loadMyArticles = async () => {
      if (!user) return;

      setLoading(true);
      setError('');

      try {
        const { data, error: fetchError } = await supabase
          .from('articles')
          .select('*')
          .eq('author_id', user.id)
          .order('updated_at', { ascending: false });

        if (fetchError) {
          setError('記事の読み込みに失敗しました');
          console.error('Error loading my articles:', fetchError);
        } else {
          setArticles(data);
        }
      } catch (err) {
        setError('記事の読み込みに失敗しました');
        console.error('Exception loading my articles:', err);
      } finally {
        setLoading(false);
      }
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Count articles by status
  const statusCounts = useMemo(() => {
    const counts = {
      all: articles.length,
      draft: 0,
      published: 0,
      pending_review: 0,
      rejected: 0,
    };
    articles.forEach(article => {
      if (article.status in counts) {
        counts[article.status as keyof typeof counts]++;
      }
    });
    return counts;
  }, [articles]);

  // Filter articles by status
  const filteredArticles = useMemo(() => {
    if (statusFilter === 'all') return articles;
    return articles.filter(article => article.status === statusFilter);
  }, [articles, statusFilter]);

  const statusTabs: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'すべて' },
    { id: 'draft', label: '下書き' },
    { id: 'published', label: '公開中' },
    { id: 'pending_review', label: '審査中' },
    { id: 'rejected', label: '却下' },
  ];

  return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">自分の記事</h1>
              <p className="text-gray-600">下書きと公開済みの記事を管理</p>
            </div>
            <Link
              to="/editor/new"
              className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              <Plus className="w-4 h-4" />
              <span>新規作成</span>
            </Link>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
            {statusTabs.map(tab => {
              const count = statusCounts[tab.id];
              // Hide tabs with 0 count except "all"
              if (tab.id !== 'all' && count === 0) return null;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap ${
                    statusFilter === tab.id
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-1.5 ${statusFilter === tab.id ? 'text-gray-900' : 'text-gray-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">読み込み中...</div>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">まだ記事がありません</p>
              <Link
                to="/editor/new"
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
              >
                <Plus className="w-4 h-4" />
                <span>最初の記事を作成</span>
              </Link>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">該当する記事がありません</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h2 className="text-xl font-bold text-gray-900 flex-1">
                      {article.title}
                    </h2>
                    {getStatusBadge(article.status)}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    更新日: {formatDate(article.updated_at)}
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/editor/${article.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      編集
                    </Link>
                    {article.status === 'published' && (
                      <Link
                        to={`/articles/${article.slug}`}
                        className="text-gray-600 hover:text-gray-800 font-medium text-sm"
                      >
                        表示
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }
