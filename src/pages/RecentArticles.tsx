// src/pages/RecentArticles.tsx
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ArticleCard from '../components/ArticleCard';
import { supabase } from '../lib/supabase';
import { getRecentlyViewed, clearRecentlyViewed } from '../lib/recentlyViewed';
import type { Database } from '../lib/database.types';

type Article = Database['public']['Tables']['articles']['Row'] & {
  users?: { display_name: string | null; email: string; avatar_url?: string | null };
  primary_category?: { id: string; name: string; slug: string } | null;
};

export default function RecentArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentArticles();
  }, []);

  const loadRecentArticles = async () => {
    setLoading(true);
    try {
      const recentIds = getRecentlyViewed();

      if (recentIds.length > 0) {
        const { data: articlesData } = await supabase
          .from('articles')
          .select(`
            *,
            users:author_id (display_name, email, avatar_url),
            author_profile:author_profile_id (id, display_name, avatar_url),
            primary_category:primary_category_id (id, name, slug)
          `)
          .in('id', recentIds)
          .eq('status', 'published');

        // Sort by recent order (most recent first)
        const sortedArticles = recentIds
          .map(id => articlesData?.find(a => a.id === id))
          .filter(Boolean) as Article[];

        setArticles(sortedArticles);
      } else {
        setArticles([]);
      }
    } catch (err) {
      console.error('Error loading recent articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm('閲覧履歴を削除しますか？')) {
      clearRecentlyViewed();
      setArticles([]);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">最近見た記事</h1>
          {articles.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              履歴を削除
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-gray-500">読み込み中...</div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            閲覧履歴はありません
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {articles.map(article => (
              <ArticleCard key={article.id} article={article} skipDbQuery />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
