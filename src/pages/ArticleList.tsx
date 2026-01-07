// src/pages/ArticleList.tsx
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import CategorySidebar from '../components/CategorySidebar';
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
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadArticles();
  }, [categorySlug]);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .order('sort_order');
    if (data) {
      setParentCategories(data);
    }
  };

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* モバイル: カテゴリ横スクロール */}
        <div className="lg:hidden mb-4 -mx-4 px-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Link
              to="/articles"
              className={`flex-shrink-0 px-4 py-2 text-sm rounded-full transition whitespace-nowrap ${
                !categorySlug
                  ? 'bg-gray-900 text-white font-medium'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              すべて
            </Link>
            {parentCategories.map(cat => (
              <Link
                key={cat.id}
                to={`/articles?category=${cat.slug}`}
                className={`flex-shrink-0 px-4 py-2 text-sm rounded-full transition whitespace-nowrap ${
                  categorySlug === cat.slug
                    ? 'bg-gray-900 text-white font-medium'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex gap-8">
          {/* 左サイドバー（デスクトップのみ） */}
          <CategorySidebar className="hidden lg:block w-56 flex-shrink-0" />

          {/* メインコンテンツ */}
          <div className="flex-1 min-w-0">
            <div className="mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {category ? category.name : '記事一覧'}
              </h1>
              {category && (
                <p className="text-gray-500 text-sm mt-1">
                  {articles.length}件の記事
                </p>
              )}
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
