// src/pages/Home.tsx
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';
import { ChevronRight, ChevronDown } from 'lucide-react';
import ArticleCard from '../components/ArticleCard';
import { Link, useSearchParams } from 'react-router-dom';

type Category = Database['public']['Tables']['categories']['Row'];

type Article = Database['public']['Tables']['articles']['Row'] & {
  users?: { display_name: string | null; email: string; avatar_url?: string | null };
  primary_category?: { id: string; name: string; slug: string } | null;
  sub_category?: { id: string; name: string; slug: string } | null;
};

/**
 * 横長バナー推奨サイズ:
 * - 表示サイズ: 幅100%（最大1200px）× 高さ120px
 * - 入稿推奨サイズ: 2400×240px（Retina対応で2倍）
 * - フォーマット: JPG, PNG, WebP
 */
const MAIN_BANNER = {
  id: 'main-banner',
  image_url: null, // 後で画像URLを設定
  link_url: null,
  alt_text: 'プロモーションバナー',
};

export default function Home() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category');
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Record<string, Category[]>>({});
  const [followingArticles, setFollowingArticles] = useState<Article[]>([]);
  const [popularArticles, setPopularArticles] = useState<Article[]>([]);
  const [newArticles, setNewArticles] = useState<Article[]>([]);
  const [editorPickArticles, setEditorPickArticles] = useState<Article[]>([]);
  const [categoryArticles, setCategoryArticles] = useState<Record<string, Article[]>>({});
  const [loading, setLoading] = useState(true);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

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
      // Load categories
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');

      if (cats) {
        const parents = cats.filter(c => !c.parent_id);
        const subs: Record<string, Category[]> = {};
        parents.forEach(p => {
          subs[p.id] = cats.filter(c => c.parent_id === p.id);
        });
        setParentCategories(parents);
        setSubCategories(subs);
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

  // カテゴリ開閉トグル
  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // note風カテゴリサイドバーコンポーネント
  const CategorySidebar = ({ className = '' }: { className?: string }) => (
    <aside className={className}>
      <div className="sticky top-20">
        <nav>
          {parentCategories.map(parent => {
            const isCollapsed = collapsedCategories.has(parent.id);
            const children = subCategories[parent.id] || [];
            const hasChildren = children.length > 0;

            return (
              <div key={parent.id} className="border-b border-gray-100 last:border-b-0">
                {/* 親カテゴリ */}
                <div className="flex items-center">
                  <Link
                    to={`/articles?category=${parent.slug}`}
                    className={`flex-1 py-3 text-base font-medium transition ${
                      selectedCategory === parent.slug
                        ? 'text-gray-900'
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    {parent.name}
                  </Link>
                  {hasChildren && (
                    <button
                      onClick={() => toggleCategory(parent.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                      />
                    </button>
                  )}
                </div>

                {/* 子カテゴリ */}
                {hasChildren && !isCollapsed && (
                  <div className="pb-3 space-y-1">
                    {children.map(sub => (
                      <Link
                        key={sub.id}
                        to={`/articles?category=${sub.slug}`}
                        className={`block py-1.5 text-sm transition ${
                          selectedCategory === sub.slug
                            ? 'text-gray-900 bg-gray-100 -mx-2 px-2 rounded'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
              <div className="space-y-10">
            {/* 横長バナー（人気記事の上） - 推奨サイズ: 2400×240px (Retina対応) */}
            <div className="w-full">
              {MAIN_BANNER.link_url ? (
                <a
                  href={MAIN_BANNER.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {MAIN_BANNER.image_url ? (
                    <img
                      src={MAIN_BANNER.image_url}
                      alt={MAIN_BANNER.alt_text}
                      className="w-full h-auto rounded-xl object-cover"
                      style={{ maxHeight: '120px' }}
                    />
                  ) : (
                    <div className="w-full h-[120px] bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                      <span className="text-gray-400 text-sm">バナー広告枠（2400×240px推奨）</span>
                    </div>
                  )}
                </a>
              ) : (
                <div className="w-full h-[120px] bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                  <span className="text-gray-400 text-sm">バナー広告枠（2400×240px推奨）</span>
                </div>
              )}
            </div>

            {/* Following Articles - フォロー中のユーザーがいる場合のみ表示 */}
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

              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
