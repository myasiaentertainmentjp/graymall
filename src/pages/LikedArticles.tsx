// src/pages/LikedArticles.tsx
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ArticleCard from '../components/ArticleCard';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';

type Article = Database['public']['Tables']['articles']['Row'] & {
  users?: { display_name: string | null; email: string; avatar_url?: string | null };
  primary_category?: { id: string; name: string; slug: string } | null;
};

export default function LikedArticles() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadLikedArticles();
  }, [user]);

  const loadLikedArticles = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: likes } = await supabase
        .from('article_likes')
        .select('article_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (likes && likes.length > 0) {
        const articleIds = likes.map(l => l.article_id);
        const { data: articlesData } = await supabase
          .from('articles')
          .select(`
            *,
            users:author_id (display_name, email, avatar_url),
            primary_category:primary_category_id (id, name, slug)
          `)
          .in('id', articleIds)
          .eq('status', 'published');

        // Sort by like order
        const sortedArticles = articleIds
          .map(id => articlesData?.find(a => a.id === id))
          .filter(Boolean) as Article[];

        setArticles(sortedArticles);
      } else {
        setArticles([]);
      }
    } catch (err) {
      console.error('Error loading liked articles:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">高評価した記事</h1>

        {loading ? (
          <div className="text-gray-500">読み込み中...</div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            高評価した記事はありません
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
