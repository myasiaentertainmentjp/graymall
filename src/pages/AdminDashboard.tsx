// src/pages/AdminDashboard.tsx
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, FileText, Home, CheckCircle, Tag, Users, BookOpen, DollarSign, TrendingUp, CheckSquare, Square } from 'lucide-react';
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

  type Statistics = {
    totalUsers: number;
    totalArticles: number;
    pendingReviews: number;
    totalRevenue: number;
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
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [savingCategory, setSavingCategory] = useState(false);
    const [statistics, setStatistics] = useState<Statistics>({ totalUsers: 0, totalArticles: 0, pendingReviews: 0, totalRevenue: 0 });
    const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
    const [bulkCategoryId, setBulkCategoryId] = useState<string>('');

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

        // Load statistics
        const [usersResult, articlesResult, purchasesResult] = await Promise.all([
          supabase.from('users').select('id', { count: 'exact', head: true }),
          supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
          supabase.from('purchases').select('amount'),
        ]);

        if (!alive) return;
        const totalRevenue = purchasesResult.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        setStatistics({
          totalUsers: usersResult.count || 0,
          totalArticles: articlesResult.count || 0,
          pendingReviews: (data || []).length,
          totalRevenue,
        });

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

    async function handleCategoryChange(articleId: string, primaryCategoryId: string | null) {
      setSavingCategory(true);
      try {
        const { error } = await supabase
          .from('articles')
          .update({
            primary_category_id: primaryCategoryId,
          })
          .eq('id', articleId);

        if (error) throw error;

        // Update local state
        setPublishedArticles(prev =>
          prev.map(a =>
            a.id === articleId
              ? { ...a, primary_category_id: primaryCategoryId }
              : a
          )
        );
        setEditingCategoryId(null);
      } catch (err) {
        console.error('Error updating category:', err);
        alert('カテゴリの更新に失敗しました');
      } finally {
        setSavingCategory(false);
      }
    }

    function getParentCategories() {
      return categories.filter(c => !c.parent_id);
    }


    // 一括選択
    function toggleSelectArticle(articleId: string) {
      setSelectedArticles(prev => {
        const next = new Set(prev);
        if (next.has(articleId)) {
          next.delete(articleId);
        } else {
          next.add(articleId);
        }
        return next;
      });
    }

    function toggleSelectAll() {
      if (selectedArticles.size === publishedArticles.length) {
        setSelectedArticles(new Set());
      } else {
        setSelectedArticles(new Set(publishedArticles.map(a => a.id)));
      }
    }

    async function handleBulkCategoryChange() {
      if (selectedArticles.size === 0) return;
      if (!bulkCategoryId) {
        alert('カテゴリを選択してください');
        return;
      }

      setSavingCategory(true);
      try {
        const { error } = await supabase
          .from('articles')
          .update({
            primary_category_id: bulkCategoryId,
          })
          .in('id', Array.from(selectedArticles));

        if (error) throw error;

        setPublishedArticles(prev =>
          prev.map(a =>
            selectedArticles.has(a.id)
              ? { ...a, primary_category_id: bulkCategoryId }
              : a
          )
        );
        setSelectedArticles(new Set());
        setBulkCategoryId('');
        alert(`${selectedArticles.size}件の記事のカテゴリを更新しました`);
      } catch (err) {
        console.error('Error bulk updating categories:', err);
        alert('カテゴリの一括更新に失敗しました');
      } finally {
        setSavingCategory(false);
      }
    }

    async function handleBulkArchive() {
      if (selectedArticles.size === 0) return;
      if (!confirm(`${selectedArticles.size}件の記事をアーカイブしますか？`)) return;

      setSavingCategory(true);
      try {
        const { error } = await supabase
          .from('articles')
          .update({ is_archived: true })
          .in('id', Array.from(selectedArticles));

        if (error) throw error;

        setPublishedArticles(prev => prev.filter(a => !selectedArticles.has(a.id)));
        setSelectedArticles(new Set());
        alert(`${selectedArticles.size}件の記事をアーカイブしました`);
      } catch (err) {
        console.error('Error archiving articles:', err);
        alert('アーカイブに失敗しました');
      } finally {
        setSavingCategory(false);
      }
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">管理画面</h1>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{statistics.totalUsers.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">登録ユーザー</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BookOpen className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{statistics.totalArticles.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">公開記事</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{statistics.pendingReviews}</div>
                  <div className="text-xs text-gray-500">審査待ち</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">¥{statistics.totalRevenue.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">総売上</div>
                </div>
              </div>
            </div>
          </div>

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
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-bold">公開済み記事一覧</div>
                {publishedArticles.length > 0 && (
                  <button
                    onClick={toggleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {selectedArticles.size === publishedArticles.length ? (
                      <><CheckSquare className="w-4 h-4" /> 選択解除</>
                    ) : (
                      <><Square className="w-4 h-4" /> 全て選択</>
                    )}
                  </button>
                )}
              </div>

              {/* Bulk Operations Toolbar */}
              {selectedArticles.size > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex flex-wrap items-center gap-3">
                  <span className="text-sm text-blue-800 font-medium">
                    {selectedArticles.size}件選択中
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={bulkCategoryId}
                      onChange={(e) => setBulkCategoryId(e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="">カテゴリを選択</option>
                      {getParentCategories().map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleBulkCategoryChange}
                      disabled={savingCategory || !bulkCategoryId}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      一括変更
                    </button>
                  </div>
                  <button
                    onClick={handleBulkArchive}
                    disabled={savingCategory}
                    className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    一括アーカイブ
                  </button>
                  <button
                    onClick={() => setSelectedArticles(new Set())}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    キャンセル
                  </button>
                </div>
              )}

              {loading ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : publishedArticles.length === 0 ? (
                <div className="text-sm text-gray-500">公開済みの記事はありません。</div>
              ) : (
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white">
                  {publishedArticles.map((a) => {
                    const parentCat = getCategoryName(a.primary_category_id);
                    const sections = getArticleSections(a.id);

                    return (
                      <div
                        key={a.id}
                        className={`p-4 hover:bg-gray-50 ${selectedArticles.has(a.id) ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => toggleSelectArticle(a.id)}
                            className="flex-shrink-0 mt-1"
                          >
                            {selectedArticles.has(a.id) ? (
                              <CheckSquare className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-gray-900 truncate">{a.title}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {a.author?.display_name || a.author?.email || '不明'} ·
                              公開日: {a.published_at ? new Date(a.published_at).toLocaleDateString() : '不明'}
                            </div>

                            {/* カテゴリ */}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Tag className="w-3 h-3 text-gray-400" />
                              {editingCategoryId === a.id ? (
                                <CategoryEditor
                                  article={a}
                                  parentCategories={getParentCategories()}
                                  onSave={handleCategoryChange}
                                  onCancel={() => setEditingCategoryId(null)}
                                  saving={savingCategory}
                                />
                              ) : (
                                <>
                                  {parentCat ? (
                                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                      {parentCat}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-400">未設定</span>
                                  )}
                                  <button
                                    onClick={() => setEditingCategoryId(a.id)}
                                    className="text-xs text-blue-600 hover:text-blue-800 ml-2"
                                  >
                                    編集
                                  </button>
                                </>
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

                          <div className="flex items-center gap-3">
                            <div className="text-sm text-gray-700 whitespace-nowrap">
                              {a.price ? `${a.price.toLocaleString()}円` : '無料'}
                            </div>
                            <Link
                              to={`/admin/article/${a.id}`}
                              className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-200 transition"
                            >
                              編集
                            </Link>
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

  // Category Editor Component
  function CategoryEditor({
    article,
    parentCategories,
    onSave,
    onCancel,
    saving,
  }: {
    article: PublishedArticle;
    parentCategories: Category[];
    onSave: (articleId: string, primaryCategoryId: string | null) => void;
    onCancel: () => void;
    saving: boolean;
  }) {
    const [primaryId, setPrimaryId] = useState(article.primary_category_id || '');

    return (
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={primaryId}
          onChange={(e) => setPrimaryId(e.target.value)}
          className="text-xs border border-gray-300 rounded px-2 py-1"
          disabled={saving}
        >
          <option value="">カテゴリを選択</option>
          {parentCategories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <button
          onClick={() => onSave(article.id, primaryId || null)}
          disabled={saving}
          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          キャンセル
        </button>
      </div>
    );
  }