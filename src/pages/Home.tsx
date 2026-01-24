// src/pages/Home.tsx
import { useEffect, useState } from 'react';
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

export default function Home() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category');
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [followingArticles, setFollowingArticles] = useState<Article[]>([]);
  const [popularArticles, setPopularArticles] = useState<Article[]>([]);
  const [newArticles, setNewArticles] = useState<Article[]>([]);
  const [editorPickArticles, setEditorPickArticles] = useState<Article[]>([]);
  const [recommendedArticles, setRecommendedArticles] = useState<Article[]>([]);
  const [categoryArticles, setCategoryArticles] = useState<Record<string, Article[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  // フォロー中ユーザーの記事を取得
  useEffect(() => {
    if (user) {
      loadFollowingArticles();
    } else {
      setFollowingArticles([]);
    }
  }, [user]);

  const loadFollowingArticles = async () => {
    if (!user) return;

    try {
      // フォロー中のユーザーIDを取得
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (!follows || follows.length === 0) {
        setFollowingArticles([]);
        return;
      }

      const followingIds = follows.map(f => f.following_id);

      // フォロー中ユーザーの記事を取得
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

      setFollowingArticles((articles || []) as Article[]);
    } catch (err) {
      console.error('Error loading following articles:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);

    try {
      // Load categories (親カテゴリのみ)
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .is('parent_id', null)
        .order('sort_order');

      if (cats) {
        setParentCategories(cats);
      }

      // Load published articles with author info
      const { data: articles } = await supabase
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

      if (articles) {
        const allArticles = articles as Article[];

        // Load admin-configured sections
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

        // Popular - use admin-configured or fall back to recent
        if (sectionMap['popular']?.length) {
          const ids = sectionMap['popular'];
          setPopularArticles(
            ids.map(id => allArticles.find(a => a.id === id)).filter(Boolean) as Article[]
          );
        } else {
          setPopularArticles(allArticles.slice(0, 7));
        }

        // New articles - always use most recent
        setNewArticles(allArticles.slice(0, 8));

        // Editor picks - use admin-configured or fall back
        if (sectionMap['editor_picks']?.length) {
          const ids = sectionMap['editor_picks'];
          setEditorPickArticles(
            ids.map(id => allArticles.find(a => a.id === id)).filter(Boolean) as Article[]
          );
        } else {
          setEditorPickArticles(allArticles.slice(0, 4));
        }

        // Group by parent category
        const catArts: Record<string, Article[]> = {};
        (cats || []).filter(c => !c.parent_id).forEach(cat => {
          catArts[cat.id] = allArticles
            .filter(a => a.primary_category_id === cat.id)
            .slice(0, 4);
        });
        setCategoryArticles(catArts);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  // あなたへのおすすめ記事を取得
  useEffect(() => {
    if (user) {
      loadRecommendedArticles();
    } else {
      setRecommendedArticles([]);
    }
  }, [user]);

  const loadRecommendedArticles = async () => {
    if (!user) return;

    try {
      // 1. ユーザーのイイネ記事のカテゴリを取得
      const { data: likedArticles } = await supabase
        .from('article_likes')
        .select('article_id, articles!inner(primary_category_id)')
        .eq('user_id', user.id)
        .limit(50);

      // 2. ユーザーのお気に入り記事のカテゴリを取得
      const { data: favoritedArticles } = await supabase
        .from('article_favorites')
        .select('article_id, articles!inner(primary_category_id)')
        .eq('user_id', user.id)
        .limit(50);

      // 3. ユーザーの閲覧履歴のカテゴリを取得
      const { data: viewedArticles } = await supabase
        .from('article_views')
        .select('article_id, articles!inner(primary_category_id)')
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(30);

      // カテゴリ出現頻度を集計
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

      processArticles(likedArticles, 3);      // イイネは重み3
      processArticles(favoritedArticles, 3);  // お気に入りも重み3
      processArticles(viewedArticles, 1);     // 閲覧は重み1

      // 頻度でソートして上位カテゴリを取得
      const topCategories = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([catId]) => catId);

      if (topCategories.length === 0) {
        setRecommendedArticles([]);
        return;
      }

      // 4. 上位カテゴリの記事を取得（既にインタラクションした記事を除外）
      const { data: recommended } = await supabase
        .from('articles')
        .select(`
          *,
          users:author_id (display_name, email, avatar_url),
          primary_category:primary_category_id (id, name, slug),
          sub_category:sub_category_id (id, name, slug)
        `)
        .in('primary_category_id', topCategories)
        .eq('status', 'published')
        .eq('is_archived', false)
        .order('published_at', { ascending: false })
        .limit(20);

      if (recommended) {
        // インタラクション済みの記事を除外して最大8件
        const filtered = recommended
          .filter(a => !interactedArticleIds.has(a.id))
          .slice(0, 8);
        setRecommendedArticles(filtered as Article[]);
      }
    } catch (err) {
      console.error('Error loading recommended articles:', err);
    }
  };

  // カテゴリサイドバーコンポーネント（大カテゴリのみ）
  const CategorySidebar = ({ className = '' }: { className?: string }) => (
    <aside className={className}>
      <div className="sticky top-20">
        <nav>
          {parentCategories.map(parent => (
            <div key={parent.id} className="border-b border-gray-100 last:border-b-0">
              <Link
                to={`/articles?category=${parent.slug}`}
                className={`block py-3 text-base font-medium transition ${
                  selectedCategory === parent.slug
                    ? 'text-gray-900'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                {parent.name}
              </Link>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* モバイル: カテゴリ横スクロール */}
        <div className="lg:hidden mb-4 -mx-4 px-4">
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
                to={`/articles?category=${cat.slug}`}
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

        {/* デスクトップ: 2カラムレイアウト */}
        <div className="flex gap-8">
          {/* 左サイドバー（デスクトップのみ） */}
          <CategorySidebar className="hidden lg:block w-56 flex-shrink-0" />

          {/* メインコンテンツ */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600">読み込み中...</div>
              </div>
            ) : (
              <div className="space-y-8">
            {/* Popular Articles */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">人気の記事</h2>
                <Link
                  to="/articles?sort=popular"
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  もっと見る <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
                {popularArticles.slice(0, 6).map((article) => (
                  <div key={article.id} className="flex-shrink-0 w-[160px] sm:w-[200px]">
                    <ArticleCard article={article} />
                  </div>
                ))}
              </div>
            </section>

            {/* New Articles */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">新着記事</h2>
                <Link
                  to="/articles"
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  もっと見る <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
                {newArticles.slice(0, 6).map(article => (
                  <div key={article.id} className="flex-shrink-0 w-[160px] sm:w-[200px]">
                    <ArticleCard article={article} />
                  </div>
                ))}
              </div>
            </section>

            {/* Editor Picks */}
            {editorPickArticles.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">編集部おすすめ</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
                  {editorPickArticles.slice(0, 6).map(article => (
                    <div key={article.id} className="flex-shrink-0 w-[160px] sm:w-[200px]">
                      <ArticleCard article={article} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* あなたへのおすすめ - ログインユーザーのみ */}
            {recommendedArticles.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">あなたへのおすすめ</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
                  {recommendedArticles.slice(0, 6).map(article => (
                    <div key={article.id} className="flex-shrink-0 w-[160px] sm:w-[200px]">
                      <ArticleCard article={article} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* フォロー中 - フォローしているユーザーの記事がある場合のみ表示 */}
            {followingArticles.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">フォロー中</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
                  {followingArticles.map(article => (
                    <div key={article.id} className="flex-shrink-0 w-[160px] sm:w-[200px]">
                      <ArticleCard article={article} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Category Sections - 記事があるカテゴリのみ表示 */}
            {parentCategories.map(category => {
              const articles = categoryArticles[category.id] || [];
              if (articles.length === 0) return null;

              return (
                <section key={category.id}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
                    <Link
                      to={`/articles?category=${category.slug}`}
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      もっと見る <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
                    {articles.map(article => (
                      <div key={article.id} className="flex-shrink-0 w-[160px] sm:w-[200px]">
                        <ArticleCard article={article} />
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
