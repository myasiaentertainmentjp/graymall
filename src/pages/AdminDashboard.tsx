// src/pages/AdminDashboard.tsx
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, LayoutDashboard, FileText, Home, CheckCircle, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';

  type Article = {
    id: string;
    title: string;
    created_at: string;
    status: string;
    price: number | null;
    author: {
      display_name: string | null;
      email: string;
    } | null;
  };

  type PublishedArticle = {
    id: string;
    title: string;
    created_at: string;
    published_at: string | null;
    status: string;
    price: number | null;
    primary_category_id: string | null;
    sub_category_id: string | null;
    author: {
      display_name: string | null;
      email: string;
    } | null;
  };

  type Category = {
    id: string;
    name: string;
    parent_id: string | null;
  };

  type HomepageSection = {
    id: string;
    section_key: string;
    title: string;
  };

  type SectionArticle = {
    section_id: string;
    article_id: string;
  };

  export default function AdminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'pending' | 'published'>('pending');
    const [articles, setArticles] = useState<Article[]>([]);
    const [publishedArticles, setPublishedArticles] = useState<PublishedArticle[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [homepageSections, setHomepageSections] = useState<HomepageSection[]>([]);
    const [sectionArticles, setSectionArticles] = useState<SectionArticle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      let alive = true;

      async function load() {
        setLoading(true);

        // Load pending articles
        const { data, error } = await supabase
          .from('articles')
          .select(`
            id,
            title,
            created_at,
            status,
            price,
            author:users!articles_author_id_fkey(display_name, email)
          `)
          .eq('status', 'pending_review')
          .eq('is_archived', false)
          .order('created_at', { ascending: false });

        if (!alive) return;

        if (error) {
          console.error(error);
          setArticles([]);
        } else {
          setArticles((data || []) as Article[]);
        }

        // Load published articles
        const { data: publishedData } = await supabase
          .from('articles')
          .select(`
            id,
            title,
            created_at,
            published_at,
            status,
            price,
            primary_category_id,
            sub_category_id,
            author:users!articles_author_id_fkey(display_name, email)
          `)
          .eq('status', 'published')
          .eq('is_archived', false)
          .order('published_at', { ascending: false });

        if (!alive) return;
        setPublishedArticles((publishedData || []) as PublishedArticle[]);

        // Load categories
        const { data: catData } = await supabase
          .from('categories')
          .select('id, name, parent_id');

        if (!alive) return;
        setCategories((catData || []) as Category[]);

        // Load homepage sections
        const { data: sectionsData } = await supabase
          .from('homepage_sections')
          .select('id, section_key, title')
          .order('display_order');

        if (!alive) return;
        setHomepageSections((sectionsData || []) as HomepageSection[]);

        // Load section articles
        const { data: sectionArticlesData } = await supabase
          .from('homepage_section_articles')
          .select('section_id, article_id');

        if (!alive) return;
        setSectionArticles((sectionArticlesData || []) as SectionArticle[]);

        setLoading(false);
      }

      load();
      return () => {
        alive = false;
      };
    }, []);

    function getCategoryName(categoryId: string | null) {
      if (!categoryId) return null;
      const cat = categories.find(c => c.id === categoryId);
      return cat?.name || null;
    }

    function getArticleSections(articleId: string) {
      const sectionIds = sectionArticles
        .filter(sa => sa.article_id === articleId)
        .map(sa => sa.section_id);

      return homepageSections
        .filter(s => sectionIds.includes(s.id))
        .map(s => s.title);
    }

    function handleReview(articleId: string) {
      navigate(`/admin/review/${articleId}`);
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">管理画面</h1>

          {/* Admin Navigation */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveTab('pending')}
              className={`rounded-lg border p-4 flex items-center gap-3 font-medium transition ${
                activeTab === 'pending'
                  ? 'bg-white border-gray-200 text-gray-900'
                  : 'bg-gray-100 border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-5 h-5" />
              審査待ち一覧
              {articles.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {articles.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('published')}
              className={`rounded-lg border p-4 flex items-center gap-3 font-medium transition ${
                activeTab === 'published'
                  ? 'bg-white border-gray-200 text-gray-900'
                  : 'bg-gray-100 border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              公開済み記事一覧
            </button>
            <Link
              to="/admin/homepage"
              className="bg-gray-100 rounded-lg border border-transparent p-4 flex items-center gap-3 text-gray-600 hover:text-gray-900 transition"
            >
              <Home className="w-5 h-5" />
              トップページ管理
            </Link>
          </div>

          {activeTab === 'pending' && (
            <>
              <div className="text-lg font-bold mb-4">審査待ち一覧</div>

              {loading ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : articles.length === 0 ? (
                <div className="text-sm text-gray-500">審査待ちの記事はありません。</div>
              ) : (
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white">
                  {articles.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => handleReview(a.id)}
                      className="w-full p-4 flex items-center justify-between gap-3 hover:bg-gray-50 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 truncate">{a.title}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {a.author?.display_name || a.author?.email || '不明'} · {new Date(a.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-700 whitespace-nowrap">
                          {a.price ? `${a.price.toLocaleString()}円` : '無料'}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'published' && (
            <>
              <div className="text-lg font-bold mb-4">公開済み記事一覧</div>

              {loading ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : publishedArticles.length === 0 ? (
                <div className="text-sm text-gray-500">公開済みの記事はありません。</div>
              ) : (
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white">
                  {publishedArticles.map((a) => {
                    const parentCat = getCategoryName(a.primary_category_id);
                    const subCat = getCategoryName(a.sub_category_id);
                    const sections = getArticleSections(a.id);

                    return (
                      <div
                        key={a.id}
                        className="p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-gray-900 truncate">{a.title}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {a.author?.display_name || a.author?.email || '不明'} ·
                              公開日: {a.published_at ? new Date(a.published_at).toLocaleDateString() : '不明'}
                            </div>

                            {/* カテゴリ */}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Tag className="w-3 h-3 text-gray-400" />
                              {parentCat ? (
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                  {parentCat}
                                </span>
                              ) : null}
                              {subCat ? (
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                  {subCat}
                                </span>
                              ) : null}
                              {!parentCat && !subCat && (
                                <span className="text-xs text-gray-400">未設定</span>
                              )}
                            </div>

                            {/* 表示セクション */}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className="text-xs text-gray-500">表示先:</span>
                              {sections.length > 0 ? (
                                sections.map((s, i) => (
                                  <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                    {s}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-400">なし</span>
                              )}
                            </div>
                          </div>

                          <div className="text-sm text-gray-700 whitespace-nowrap">
                            {a.price ? `${a.price.toLocaleString()}円` : '無料'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }