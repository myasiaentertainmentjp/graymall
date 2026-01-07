// src/pages/MyArticles.tsx
  import { useState, useEffect } from 'react';
  import { Link } from 'react-router-dom';
  import { useAuth } from '../contexts/AuthContext';
  import { supabase } from '../lib/supabase';
  import Layout from '../components/Layout';
  import type { Database } from '../lib/database.types';
  import { FileText, Plus, Trash2 } from 'lucide-react';

  type Article = Database['public']['Tables']['articles']['Row'];

  export default function MyArticles() {
    const { user } = useAuth();
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleting, setDeleting] = useState<string | null>(null);

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

    // 削除処理
    const handleDelete = async (articleId: string, title: string) => {
      const confirmed = window.confirm(
        `「${title}」を削除しますか？\n\nこの操作は取り消せません。`
      );
      if (!confirmed) return;

      setDeleting(articleId);

      try {
        const { error: deleteError } = await supabase
          .from('articles')
          .delete()
          .eq('id', articleId)
          .eq('author_id', user?.id);

        if (deleteError) {
          console.error('Delete error:', deleteError);
          alert('削除に失敗しました: ' + deleteError.message);
        } else {
          // 成功したらリストから削除
          setArticles((prev) => prev.filter((a) => a.id !== articleId));
        }
      } catch (err) {
        console.error('Exception deleting article:', err);
        alert('削除に失敗しました');
      } finally {
        setDeleting(null);
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
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h2 className="text-xl font-bold text-gray-900 flex-1 break-words">
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
                    {/* 削除ボタン（公開中以外の記事のみ、または全記事で許可する場合はこの条件を外す） */}
                    <button
                      type="button"
                      onClick={() => handleDelete(article.id, article.title)}
                      disabled={deleting === article.id}
                      className="text-red-600 hover:text-red-800 font-medium text-sm inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {deleting === article.id ? '削除中...' : '削除'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }
