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

  export default function PurchasedArticles() {
    const { user } = useAuth();
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (!user) return;
      loadPurchasedArticles();
    }, [user]);

    const loadPurchasedArticles = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data: orders } = await supabase
          .from('orders')
          .select('article_id, paid_at')
          .eq('buyer_id', user.id)
          .eq('status', 'paid')
          .order('paid_at', { ascending: false });
        if (orders && orders.length > 0) {
          const articleIds = [...new Set(orders.map(o => o.article_id))];
          const { data: articlesData } = await supabase
            .from('articles')
            .select(`*, users:author_id (display_name, email, avatar_url), primary_category:primary_category_id (id, name, slug)`)
            .in('id', articleIds);
          const sortedArticles = articleIds.map(id => articlesData?.find(a => a.id === id)).filter(Boolean) as Article[];
          setArticles(sortedArticles);
        } else {
          setArticles([]);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">購入した記事</h1>
          {loading ? (
            <div className="text-gray-500">読み込み中...</div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">購入した記事はありません</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {articles.map(article => (<ArticleCard key={article.id} article={article} skipDbQuery />))}
            </div>
          )}
        </div>
      </Layout>
    );
  }
