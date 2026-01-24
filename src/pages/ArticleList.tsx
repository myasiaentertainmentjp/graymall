// src/pages/ArticleList.tsx
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import CategorySidebar from '../components/CategorySidebar';
import type { Database } from '../lib/database.types';
import ArticleCard from '../components/ArticleCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 60;

type Category = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
};

type Article = Database['public']['Tables']['articles']['Row'] & {
  users?: { display_name: string | null; email: string; avatar_url?: string | null };
  primary_category?: { id: string; name: string; slug: string } | null;
  sub_category?: { id: string; name: string; slug: string } | null;
};

type SortType = 'new' | 'popular';

const SORT_OPTIONS: { value: SortType; label: string }[] = [
  { value: 'new', label: '新着' },
  { value: 'popular', label: '人気' },
];

export default function ArticleList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get('category');
  const searchQuery = searchParams.get('q');
  const sortParam = searchParams.get('sort') as SortType | null;
  const currentSort: SortType = sortParam === 'popular' ? 'popular' : 'new';
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

  const [articles, setArticles] = useState<Article[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [category, setCategory] = useState<Category | null>(null);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // ページタイトルを決定
  const getPageTitle = () => {
    if (searchQuery) return `「${searchQuery}」の検索結果`;
    if (category) return category.name;
    if (currentSort === 'popular') return '人気の記事';
    return '新着記事';
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadArticles();
  }, [categorySlug, searchQuery, currentSort, currentPage]);

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

      // 記事を取得（ページネーション付き）
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('articles')
        .select(`
          *,
          users:author_id (display_name, email, avatar_url),
          primary_category:primary_category_id (id, name, slug),
          sub_category:sub_category_id (id, name, slug)
        `, { count: 'exact' })
        .eq('status', 'published')
        .eq('is_archived', false);

      // 検索クエリで絞り込み（タイトル、概要、本文）
      if (searchQuery) {
        const searchPattern = `%${searchQuery}%`;
        query = query.or(`title.ilike.${searchPattern},excerpt.ilike.${searchPattern},content.ilike.${searchPattern}`);
      }

      // カテゴリで絞り込み（primary_category_id または sub_category_id で一致）
      if (categoryId) {
        query = query.or(`primary_category_id.eq.${categoryId},sub_category_id.eq.${categoryId}`);
      }

      // ソート順を設定
      if (currentSort === 'popular') {
        query = query.order('view_count', { ascending: false, nullsFirst: false });
      } else {
        query = query.order('published_at', { ascending: false });
      }

      let { data, error: fetchError, count } = await query.range(from, to);

      // view_countカラムが存在しない場合のフォールバック
      if (fetchError && currentSort === 'popular') {
        console.warn('Falling back to published_at sort:', fetchError);
        const fallbackQuery = supabase
          .from('articles')
          .select(`
            *,
            users:author_id (display_name, email, avatar_url),
            primary_category:primary_category_id (id, name, slug),
            sub_category:sub_category_id (id, name, slug)
          `, { count: 'exact' })
          .eq('status', 'published')
          .eq('is_archived', false)
          .order('published_at', { ascending: false });

        if (categoryId) {
          fallbackQuery.or(`primary_category_id.eq.${categoryId},sub_category_id.eq.${categoryId}`);
        }

        const fallbackResult = await fallbackQuery.range(from, to);
        data = fallbackResult.data;
        count = fallbackResult.count;
        fetchError = fallbackResult.error;
      }

      if (fetchError) {
        setError('記事の読み込みに失敗しました');
        console.error('Error loading articles:', fetchError);
      } else {
        setArticles((data ?? []) as Article[]);
        setTotalCount(count ?? 0);
      }
    } catch (err) {
      setError('記事の読み込みに失敗しました');
      console.error('Exception loading articles:', err);
    } finally {
      setLoading(false);
    }
  };

  // ソート変更
  const changeSort = (sort: SortType) => {
    const newParams = new URLSearchParams(searchParams);
    if (sort === 'new') {
      newParams.delete('sort');
    } else {
      newParams.set('sort', sort);
    }
    newParams.delete('page'); // ソート変更時はページをリセット
    setSearchParams(newParams);
  };

  // ページ変更
  const goToPage = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    if (page === 1) {
      newParams.delete('page');
    } else {
      newParams.set('page', String(page));
    }
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ページネーションの番号を生成
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const showPages = 5;

    if (totalPages <= showPages + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      pages.push(totalPages);
    }

    return pages;
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
                !categorySlug && !sortParam
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
                {getPageTitle()}
              </h1>
            </div>

            {/* ソートタブ（カテゴリ未選択時のみ表示） */}
            {!categorySlug && (
              <div className="flex gap-2 mb-6">
                {SORT_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => changeSort(option.value)}
                    className={`px-4 py-2 text-sm rounded-lg transition ${
                      currentSort === option.value
                        ? 'bg-gray-900 text-white font-medium'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
                {error}
              </div>
            )}

            {/* 検索結果の場合、検索ワードとクリアボタンを表示 */}
            {searchQuery && (
              <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                <span>{totalCount}件の記事が見つかりました</span>
                <Link
                  to="/articles"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  検索をクリア
                </Link>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600">読み込み中...</div>
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {searchQuery
                  ? `「${searchQuery}」に一致する記事が見つかりませんでした`
                  : category
                  ? 'このカテゴリにはまだ記事がありません'
                  : 'まだ公開記事がありません'}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {articles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                    />
                  ))}
                </div>

                {/* ページネーション */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-1 sm:gap-2">
                    {/* 前へボタン */}
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-lg transition ${
                        currentPage === 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      aria-label="前のページ"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* ページ番号 */}
                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((page, idx) =>
                        page === 'ellipsis' ? (
                          <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                            ...
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium transition ${
                              currentPage === page
                                ? 'bg-gray-900 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}
                    </div>

                    {/* 次へボタン */}
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-lg transition ${
                        currentPage === totalPages
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      aria-label="次のページ"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
