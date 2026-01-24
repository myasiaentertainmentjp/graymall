// src/pages/Home.tsx
import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';
import { ChevronRight } from 'lucide-react';
import ArticleCard from '../components/ArticleCard';
import { Link, useSearchParams } from 'react-router-dom';

type Category = Database['public']['Tables']['categories']['Row'];

type Article = Database['public']['Tables']['articles']['Row'] & {
  users?: { display_name: string | null; email: string; avatar_url?: string | null };
  primary_category?: { id: string; name: string; slug: string } | null;
  sub_category?: { id: string; name: string; slug: string } | null;
};

// データ取得関数
async function fetchCategories() {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .order('sort_order');
  return data || [];
}

async function fetchArticles() {
  const { data } = await supabase
    .from('articles')
    .select(`
      *,
      users:author_id (display_name, email, avatar_url),
      primary_category:primary_category_id (id, name, slug),
      sub_category:sub_category_id (id, name, slug)
    `)
    .eq('status', 'published')
    .eq('is_archived', false)
    .order('published_at', { ascending: false })
    .limit(100);
  return (data || []) as Article[];
}

async function fetchHomepageSections() {
  const { data: sections } = await supabase
    .from('homepage_sections')
    .select('*')
    .eq('is_active', true);

  const sectionMap: Record<string, string[]> = {};
  if (sections) {
    for (const section of sections) {
      const { data: sectionArticles } = await supabase
        .from('homepage_section_articles')
        .select('article_id')
        .eq('section_id', section.id)
        .order('display_order');
      if (sectionArticles) {
        sectionMap[section.section_key] = sectionArticles.map(sa => sa.article_id);
      }
    }
  }
  return sectionMap;
}

async function fetchFollowingArticles(userId: string) {
  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  if (!follows || follows.length === 0) return [];

  const followingIds = follows.map(f => f.following_id);

  const { data: articles } = await supabase
    .from('articles')
    .select(`
      *,
      users:author_id (display_name, email, avatar_url),
      primary_category:primary_category_id (id, name, slug),
      sub_category:sub_category_id (id, name, slug)
    `)
    .in('author_id', followingIds)
    .eq('status', 'published')
    .eq('is_archived', false)
    .order('published_at', { ascending: false })
    .limit(8);

  return (articles || []) as Article[];
}

async function fetchRecommendedArticles(userId: string) {
  // ユーザーのインタラクションを取得
  const [likedRes, favoritedRes, viewedRes] = await Promise.all([
    supabase
      .from('article_likes')
      .select('article_id, articles!inner(primary_category_id)')
      .eq('user_id', userId)
      .limit(50),
    supabase
      .from('article_favorites')
      .select('article_id, articles!inner(primary_category_id)')
      .eq('user_id', userId)
      .limit(50),
    supabase
      .from('article_views')
      .select('article_id, articles!inner(primary_category_id)')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(30),
  ]);

  const categoryCount: Record<string, number> = {};
  const interactedArticleIds = new Set<string>();

  const processArticles = (items: any[] | null, weight: number) => {
    if (!items) return;
    items.forEach(item => {
      interactedArticleIds.add(item.article_id);
      const catId = item.articles?.primary_category_id;
      if (catId) {
        categoryCount[catId] = (categoryCount[catId] || 0) + weight;
      }
    });
  };

  processArticles(likedRes.data, 3);
  processArticles(favoritedRes.data, 3);
  processArticles(viewedRes.data, 1);

  const topCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([catId]) => catId);

  if (topCategories.length === 0) return [];

  const { data: recommended } = await supabase
    .from('articles')
    .select(`
      *,
      users:author_id (display_name, email, avatar_url),
      primary_category:primary_category_id (id, name, slug)
    `)
    .in('primary_category_id', topCategories)
    .eq('status', 'published')
    .eq('is_archived', false)
    .order('published_at', { ascending: false })
    .limit(20);

  const filtered = (recommended || [])
    .filter(a => !interactedArticleIds.has(a.id))
    .slice(0, 8);

  return filtered as Article[];
}

export default function Home() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category');

  // React Query でデータ取得（キャッシュ付き）
  const { data: parentCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const { data: allArticles = [], isLoading } = useQuery({
    queryKey: ['articles'],
    queryFn: fetchArticles,
  });

  const { data: sectionMap = {} } = useQuery({
    queryKey: ['homepageSections'],
    queryFn: fetchHomepageSections,
  });

  const { data: followingArticles = [] } = useQuery({
    queryKey: ['followingArticles', user?.id],
    queryFn: () => fetchFollowingArticles(user!.id),
    enabled: !!user,
  });

  const { data: recommendedArticles = [] } = useQuery({
    queryKey: ['recommendedArticles', user?.id],
    queryFn: () => fetchRecommendedArticles(user!.id),
    enabled: !!user,
  });

  // メモ化された記事リスト
  const popularArticles = useMemo(() => {
    if (sectionMap['popular']?.length) {
      return sectionMap['popular']
        .map(id => allArticles.find(a => a.id === id))
        .filter(Boolean) as Article[];
    }
    return allArticles.slice(0, 7);
  }, [allArticles, sectionMap]);

  const newArticles = useMemo(() => allArticles.slice(0, 8), [allArticles]);

  const editorPickArticles = useMemo(() => {
    if (sectionMap['editor_picks']?.length) {
      return sectionMap['editor_picks']
        .map(id => allArticles.find(a => a.id === id))
        .filter(Boolean) as Article[];
    }
    return allArticles.slice(0, 4);
  }, [allArticles, sectionMap]);

  const categoryArticles = useMemo(() => {
    const catArts: Record<string, Article[]> = {};
    parentCategories.filter(c => !c.parent_id).forEach(cat => {
      catArts[cat.id] = allArticles
        .filter(a => a.primary_category_id === cat.id)
        .slice(0, 4);
    });
    return catArts;
  }, [allArticles, parentCategories]);

  // カテゴリ選択された場合の記事フィルタ
  const filteredArticles = useMemo(() => {
    if (!selectedCategory) return null;
    const category = parentCategories.find(c => c.slug === selectedCategory);
    if (!category) return null;
    return allArticles.filter(a => a.primary_category_id === category.id);
  }, [selectedCategory, parentCategories, allArticles]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* カテゴリ横スクロール */}
        <div className="mb-6 -mx-4 px-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Link
              to="/"
              className={`flex-shrink-0 px-4 py-2 text-sm rounded-full transition whitespace-nowrap ${
                !selectedCategory
                  ? 'bg-gray-900 text-white font-medium'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              すべて
            </Link>
            {parentCategories.map(cat => (
              <Link
                key={cat.id}
                to={`/?category=${cat.slug}`}
                className={`flex-shrink-0 px-4 py-2 text-sm rounded-full transition whitespace-nowrap ${
                  selectedCategory === cat.slug
                    ? 'bg-gray-900 text-white font-medium'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="text-gray-600">読み込み中...</div>
          </div>
        ) : selectedCategory && filteredArticles ? (
          /* カテゴリ選択時 */
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {parentCategories.find(c => c.slug === selectedCategory)?.name}
            </h2>
            {filteredArticles.length === 0 ? (
              <p className="text-gray-500">まだ記事がありません</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* 通常表示 */
          <div className="space-y-10">
            {/* 人気の記事 */}
            {popularArticles.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">人気の記事</h2>
                  <Link to="/articles?sort=popular" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                    もっと見る <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {popularArticles.slice(0, 8).map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            )}

            {/* 新着記事 */}
            {newArticles.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">新着記事</h2>
                  <Link to="/articles" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                    もっと見る <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {newArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            )}

            {/* 編集部おすすめ */}
            {editorPickArticles.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4">編集部おすすめ</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {editorPickArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            )}

            {/* あなたへのおすすめ */}
            {user && recommendedArticles.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4">あなたへのおすすめ</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {recommendedArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            )}

            {/* フォロー中のユーザーの記事 */}
            {user && followingArticles.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">フォロー中</h2>
                  <Link to="/me/following" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                    もっと見る <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {followingArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            )}

            {/* カテゴリ別 */}
            {parentCategories.map(cat => {
              const arts = categoryArticles[cat.id] || [];
              if (arts.length === 0) return null;
              return (
                <section key={cat.id}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">{cat.name}</h2>
                    <Link to={`/articles?category=${cat.slug}`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                      もっと見る <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {arts.map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
