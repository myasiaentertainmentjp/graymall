// src/pages/Home.tsx
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { ChevronRight, ChevronDown, FolderOpen } from 'lucide-react';
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
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category');
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Record<string, Category[]>>({});
  const [popularArticles, setPopularArticles] = useState<Article[]>([]);
  const [newArticles, setNewArticles] = useState<Article[]>([]);
  const [editorPickArticles, setEditorPickArticles] = useState<Article[]>([]);
  const [categoryArticles, setCategoryArticles] = useState<Record<string, Article[]>>({});
  const [loading, setLoading] = useState(true);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

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

  // 全カテゴリをフラットに表示（親・子を同じ階層で）
  const allCategories: Category[] = [];
  parentCategories.forEach(parent => {
    allCategories.push(parent);
    if (subCategories[parent.id]) {
      allCategories.push(...subCategories[parent.id]);
    }
  });

  // カテゴリサイドバーコンポーネント
  const CategorySidebar = ({ className = '' }: { className?: string }) => (
    <aside className={className}>
      <div className="sticky top-20">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
          カテゴリ
        </h3>
        <nav className="space-y-1">
          <Link
            to="/"
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition ${
              !selectedCategory
                ? 'bg-gray-900 text-white font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            すべて
          </Link>
          {parentCategories.map(parent => (
            <div key={parent.id}>
              <Link
                to={`/articles?category=${parent.slug}`}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition ${
                  selectedCategory === parent.slug
                    ? 'bg-gray-900 text-white font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {parent.name}
              </Link>
              {subCategories[parent.id]?.length > 0 && (
                <div className="ml-4 mt-1 space-y-1">
                  {subCategories[parent.id].map(sub => (
                    <Link
                      key={sub.id}
                      to={`/articles?category=${sub.slug}`}
                      className={`block px-3 py-1.5 text-sm rounded-lg transition ${
                        selectedCategory === sub.slug
                          ? 'bg-gray-200 text-gray-900 font-medium'
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                      }`}
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* モバイル: カテゴリ折りたたみ */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setMobileCategoryOpen(!mobileCategoryOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
          >
            <span className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              カテゴリを選択
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${mobileCategoryOpen ? 'rotate-180' : ''}`} />
          </button>
          {mobileCategoryOpen && (
            <div className="mt-2 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/"
                  onClick={() => setMobileCategoryOpen(false)}
                  className={`px-3 py-2 text-sm rounded-lg text-center transition ${
                    !selectedCategory
                      ? 'bg-gray-900 text-white font-medium'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  すべて
                </Link>
                {allCategories.map(cat => (
                  <Link
                    key={cat.id}
                    to={`/articles?category=${cat.slug}`}
                    onClick={() => setMobileCategoryOpen(false)}
                    className={`px-3 py-2 text-sm rounded-lg text-center transition ${
                      selectedCategory === cat.slug
                        ? 'bg-gray-900 text-white font-medium'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {popularArticles.slice(0, 8).map((article, idx) => (
                  <ArticleCard key={article.id} article={article} rank={idx + 1} />
                ))}
              </div>
            </section>

            {/* New Articles */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">新着記事</h2>
                <Link
                  to="/articles?sort=new"
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  もっと見る <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {newArticles.map(article => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </section>

            {/* Editor Picks */}
            {editorPickArticles.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">編集部おすすめ</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {editorPickArticles.map(article => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            )}

            {/* Category Pickups */}
            {parentCategories.map(cat => {
              const articles = categoryArticles[cat.id] || [];
              if (articles.length === 0) return null;
              return (
                <section key={cat.id}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">{cat.name}</h2>
                    <Link
                      to={`/articles?category=${cat.slug}`}
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      もっと見る <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {articles.map(article => (
                      <ArticleCard key={article.id} article={article} />
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
