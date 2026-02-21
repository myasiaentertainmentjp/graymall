// src/pages/Home.tsx
import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';
import { ChevronRight } from 'lucide-react';
import ArticleCard from '../components/ArticleCard';
import { SkeletonRow } from '../components/SkeletonCard';
import { Link, useSearchParams } from 'react-router-dom';

type Category = Database['public']['Tables']['categories']['Row'];

type Article = Database['public']['Tables']['articles']['Row'] & {
  users?: { display_name: string | null; email: string; avatar_url?: string | null };
  author_profile?: { id: string; display_name: string; avatar_url: string | null } | null;
  primary_category?: { id: string; name: string; slug: string } | null;
};

// データ取得関数
async function fetchParentCategories() {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .order('sort_order');
  return data || [];
}

// 全カテゴリを取得（子カテゴリ含む）
async function fetchAllCategories() {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order');
  return data || [];
}

async function fetchArticles() {
  const { data } = await supabase
    .from('articles')
    .select(`
      *,
      users:author_id (display_name, email, avatar_url),
      author_profile:author_profile_id (id, display_name, avatar_url),
      primary_category:primary_category_id (id, name, slug)
    `)
    .eq('status', 'published')
    .eq('is_archived', false)
    .order('published_at', { ascending: false })
    .limit(500);
  return (data || []) as Article[];
}

async function fetchHomepageSections() {
  // N+1クエリを回避: 2クエリで完結
  const { data: sections } = await supabase
    .from('homepage_sections')
    .select('id, section_key')
    .eq('is_active', true);

  if (!sections || sections.length === 0) return {};

  const sectionIds = sections.map(s => s.id);

  // 全セクションの記事を1クエリで取得
  const { data: allSectionArticles } = await supabase
    .from('homepage_section_articles')
    .select('section_id, article_id')
    .in('section_id', sectionIds)
    .order('display_order');

  // セクションごとにグループ化
  const sectionMap: Record<string, string[]> = {};
  if (allSectionArticles) {
    const sectionIdToKey = Object.fromEntries(sections.map(s => [s.id, s.section_key]));
    for (const sa of allSectionArticles) {
      const key = sectionIdToKey[sa.section_id];
      if (key) {
        if (!sectionMap[key]) sectionMap[key] = [];
        sectionMap[key].push(sa.article_id);
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
      author_profile:author_profile_id (id, display_name, avatar_url),
      primary_category:primary_category_id (id, name, slug)
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
      author_profile:author_profile_id (id, display_name, avatar_url),
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
    queryKey: ['parentCategories'],
    queryFn: fetchParentCategories,
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ['allCategories'],
    queryFn: fetchAllCategories,
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

  // 親カテゴリごとの子カテゴリIDマップ
  const categoryIdMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    parentCategories.forEach(parent => {
      // 親カテゴリ自身と、その子カテゴリのIDを収集
      const childIds = allCategories
        .filter(c => c.parent_id === parent.id)
        .map(c => c.id);
      map[parent.id] = [parent.id, ...childIds];
    });
    return map;
  }, [parentCategories, allCategories]);

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
    return allArticles.slice(0, 8);
  }, [allArticles, sectionMap]);

  // カテゴリ別記事（子カテゴリも含む）
  const categoryArticles = useMemo(() => {
    const catArts: Record<string, Article[]> = {};
    parentCategories.forEach(cat => {
      const categoryIds = categoryIdMap[cat.id] || [cat.id];
      catArts[cat.id] = allArticles
        .filter(a => a.primary_category_id && categoryIds.includes(a.primary_category_id))
        .slice(0, 8);
    });
    return catArts;
  }, [allArticles, parentCategories, categoryIdMap]);

  // カテゴリ選択された場合の記事フィルタ（子カテゴリも含む）
  const filteredArticles = useMemo(() => {
    if (!selectedCategory) return null;
    const category = parentCategories.find(c => c.slug === selectedCategory);
    if (!category) return null;
    const categoryIds = categoryIdMap[category.id] || [category.id];
    return allArticles.filter(a => a.primary_category_id && categoryIds.includes(a.primary_category_id));
  }, [selectedCategory, parentCategories, allArticles, categoryIdMap]);

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* モバイル: カテゴリ横スクロール */}
        <div className="lg:hidden mb-6 -mx-4 px-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Link
              to="/"
              className={`flex-shrink-0 px-4 py-2 text-sm rounded-full transition whitespace-nowrap ${
                !selectedCategory
                  ? 'bg-emerald-500 text-white font-medium'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
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
                    ? 'bg-emerald-500 text-white font-medium'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        {/* PC: 2カラムレイアウト（左サイドバー + メインコンテンツ） */}
        <div className="lg:flex lg:gap-8">
          {/* 左サイドバー（PCのみ） */}
          <aside className="hidden lg:block lg:w-56 flex-shrink-0">
            <div className="sticky top-20">
              <nav>
                <Link
                  to="/"
                  className={`block px-2 py-3 text-lg transition ${
                    !selectedCategory
                      ? 'text-emerald-400 font-medium'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  すべて
                </Link>
                {parentCategories.map(cat => (
                  <Link
                    key={cat.id}
                    to={`/?category=${cat.slug}`}
                    className={`block px-2 py-3 text-lg transition ${
                      selectedCategory === cat.slug
                        ? 'text-emerald-400 font-medium'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          {/* メインコンテンツ */}
          <div className="flex-1 min-w-0">
        {isLoading ? (
          <div className="space-y-6 sm:space-y-10">
            <section>
              <div className="h-6 bg-gray-700 rounded w-32 mb-4 animate-pulse" />
              <SkeletonRow count={6} />
            </section>
            <section>
              <div className="h-6 bg-gray-700 rounded w-28 mb-4 animate-pulse" />
              <SkeletonRow count={6} />
            </section>
          </div>
        ) : selectedCategory && filteredArticles ? (
          /* カテゴリ選択時 */
          <div>
            <h2 className="text-xl font-bold text-white mb-4">
              {parentCategories.find(c => c.slug === selectedCategory)?.name}
            </h2>
            {filteredArticles.length === 0 ? (
              <p className="text-gray-400">まだ記事がありません</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} skipDbQuery />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* 通常表示 */
          <div className="space-y-6 sm:space-y-10">
            {/* 人気の記事 */}
            {popularArticles.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">人気の記事</h2>
                  <Link to="/articles?sort=popular" className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
                    もっと見る <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mr-4 sm:-mr-6 lg:-mr-8 pr-4 sm:pr-6 lg:pr-8">
                  {popularArticles.slice(0, 8).map((article, index) => (
                    <div key={article.id} className="flex-shrink-0 w-48 sm:w-56 lg:w-64">
                      <ArticleCard article={article} priority={index < 4} skipDbQuery />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 新着記事 */}
            {newArticles.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">新着記事</h2>
                  <Link to="/articles" className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
                    もっと見る <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mr-4 sm:-mr-6 lg:-mr-8 pr-4 sm:pr-6 lg:pr-8">
                  {newArticles.map((article) => (
                    <div key={article.id} className="flex-shrink-0 w-48 sm:w-56 lg:w-64">
                      <ArticleCard article={article} skipDbQuery />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 編集部おすすめ */}
            {editorPickArticles.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">編集部おすすめ</h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mr-4 sm:-mr-6 lg:-mr-8 pr-4 sm:pr-6 lg:pr-8">
                  {editorPickArticles.map((article) => (
                    <div key={article.id} className="flex-shrink-0 w-48 sm:w-56 lg:w-64">
                      <ArticleCard article={article} skipDbQuery />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* あなたへのおすすめ */}
            {user && recommendedArticles.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">あなたへのおすすめ</h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mr-4 sm:-mr-6 lg:-mr-8 pr-4 sm:pr-6 lg:pr-8">
                  {recommendedArticles.map((article) => (
                    <div key={article.id} className="flex-shrink-0 w-48 sm:w-56 lg:w-64">
                      <ArticleCard article={article} skipDbQuery />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* フォロー中のユーザーの記事 */}
            {user && followingArticles.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">フォロー中</h2>
                  <Link to="/me/following" className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
                    もっと見る <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mr-4 sm:-mr-6 lg:-mr-8 pr-4 sm:pr-6 lg:pr-8">
                  {followingArticles.map((article) => (
                    <div key={article.id} className="flex-shrink-0 w-48 sm:w-56 lg:w-64">
                      <ArticleCard article={article} skipDbQuery />
                    </div>
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
                    <h2 className="text-lg font-bold text-white">{cat.name}</h2>
                    <Link to={`/articles?category=${cat.slug}`} className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
                      もっと見る <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mr-4 sm:-mr-6 lg:-mr-8 pr-4 sm:pr-6 lg:pr-8">
                    {arts.map((article) => (
                      <div key={article.id} className="flex-shrink-0 w-48 sm:w-56 lg:w-64">
                        <ArticleCard article={article} skipDbQuery />
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
