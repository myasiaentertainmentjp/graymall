// src/pages/ArticleList.tsx
  import { useState, useEffect } from 'react';
  import { useSearchParams } from 'react-router-dom';
  import { supabase } from '../lib/supabase';
  import Layout from '../components/Layout';
  import type { Database } from '../lib/database.types';
  import ArticleCard from '../components/ArticleCard';

  type Category = {
    id: string;
    parent_id: string | null;
    name: string;
    slug: string;
  };

  type Article = Database['public']['Tables']['articles']['Row'] & {
    users?: { display_name: string | null; email: string };
    primary_category?: { id: string; name: string; slug: string } | null;
    sub_category?: { id: string; name: string; slug: string } | null;
  };

  export default function ArticleList() {
    const [searchParams] = useSearchParams();
    const categorySlug = searchParams.get('category');

    const [articles, setArticles] = useState<Article[]>([]);
    const [category, setCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
      loadArticles();
    }, [categorySlug]);

    const loadArticles = async () => {
      setLoading(true);
      setError('');

      try {
        // カテゴリスラッグがあればカテゴリ情報を取得
        let categoryId: string | null = null;
        if (categorySlug) {
          const { data: catData } = await supabase
            .from('categories')
            .select('*')
            .eq('slug', categorySlug)
            .single();

          if (catData) {
            setCategory(catData);
            categoryId = catData.id;
          }
        } else {
          setCategory(null);
        }

        // 記事を取得
        let query = supabase
          .from('articles')
          .select(`
            *,
            users:author_id (display_name, email),
            primary_category:primary_category_id (id, name, slug),
            sub_category:sub_category_id (id, name, slug)
          `)
          .eq('status', 'published')
          .eq('is_archived', false);

        // カテゴリで絞り込み
        if (categoryId) {
          query = query.eq('primary_category_id', categoryId);
        }

        const { data, error: fetchError } = await query.order('published_at', { ascending: false });

        if (fetchError) {
          setError('記事の読み込みに失敗しました');
          console.error('Error loading articles:', fetchError);
        } else {
          setArticles((data ?? []) as Article[]);
        }
      } catch (err) {
        setError('記事の読み込みに失敗しました');
        console.error('Exception loading articles:', err);
      } finally {
        setLoading(false);
      }
    };

    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {category ? category.name : '公開記事一覧'}
            </h1>
            <p className="text-gray-600">
              {category ? `${category.name}カテゴリの記事を表示` : 'すべての公開記事を表示'}
            </p>
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
            <div className="text-center py-12 text-gray-500">
              {category ? 'このカテゴリにはまだ記事がありません' : 'まだ公開記事がありません'}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }
