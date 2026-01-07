// src/pages/AdminDashboard.tsx
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, LayoutDashboard, FileText, Home } from 'lucide-react';
import { supabase } from '../lib/supabase';

  type Article = {
    id: string;
    title: string;
    created_at: string;
    status: string;
    price: number | null;
    author: {
      display_name: string | null;
      email: string;
    } | null;
  };

  export default function AdminDashboard() {
    const navigate = useNavigate();
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      let alive = true;

      async function load() {
        setLoading(true);
        const { data, error } = await supabase
          .from('articles')
          .select(`
            id,
            title,
            created_at,
            status,
            price,
            author:users!articles_author_id_fkey(display_name, email)
          `)
          .eq('status', 'pending_review')
          .eq('is_archived', false)
          .order('created_at', { ascending: false });

        if (!alive) return;

        if (error) {
          console.error(error);
          setArticles([]);
          setLoading(false);
          return;
        }

        setArticles((data || []) as Article[]);
        setLoading(false);
      }

      load();
      return () => {
        alive = false;
      };
    }, []);

    function handleReview(articleId: string) {
      navigate(`/admin/review/${articleId}`);
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">管理画面</h1>

          {/* Admin Navigation */}
          <div className="flex gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3 text-gray-900 font-medium">
              <FileText className="w-5 h-5" />
              審査待ち一覧
            </div>
            <Link
              to="/admin/homepage"
              className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3 text-gray-600 hover:text-gray-900 hover:border-gray-300 transition"
            >
              <Home className="w-5 h-5" />
              トップページ管理
            </Link>
          </div>

          <div className="text-lg font-bold mb-4">審査待ち一覧</div>

          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : articles.length === 0 ? (
            <div className="text-sm text-gray-500">審査待ちの記事はありません。</div>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
              {articles.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => handleReview(a.id)}
                  className="w-full p-4 flex items-center justify-between gap-3 hover:bg-gray-50 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 truncate">{a.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {a.author?.display_name || a.author?.email || '不明'} · {new Date(a.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-700 whitespace-nowrap">
                      {a.price ? `${a.price.toLocaleString()}円` : '無料'}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }