// src/pages/AdminHomepageManager.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, GripVertical, ArrowLeft, Search, X } from 'lucide-react';

type HomepageSection = {
  id: string;
  section_key: string;
  title: string;
  display_order: number;
  is_active: boolean;
};

type SectionArticle = {
  id: string;
  section_id: string;
  article_id: string;
  display_order: number;
  article?: {
    id: string;
    title: string;
    slug: string;
    thumbnail_url: string | null;
    author: {
      display_name: string | null;
      email: string;
    } | null;
  };
};

type ArticleSearchResult = {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  author: {
    display_name: string | null;
    email: string;
  } | null;
};

export default function AdminHomepageManager() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [sectionArticles, setSectionArticles] = useState<Record<string, SectionArticle[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Search modal state
  const [searchModalSection, setSearchModalSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ArticleSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load sections
      const { data: sectionsData } = await supabase
        .from('homepage_sections')
        .select('*')
        .order('display_order');

      if (sectionsData) {
        setSections(sectionsData);

        // Load articles for each section
        const articlesMap: Record<string, SectionArticle[]> = {};
        for (const section of sectionsData) {
          const { data: articlesData } = await supabase
            .from('homepage_section_articles')
            .select(`
              *,
              article:articles!homepage_section_articles_article_id_fkey(
                id, title, slug, thumbnail_url,
                author:users!articles_author_id_fkey(display_name, email)
              )
            `)
            .eq('section_id', section.id)
            .order('display_order');

          articlesMap[section.id] = (articlesData || []) as SectionArticle[];
        }
        setSectionArticles(articlesMap);
      }
    } catch (err) {
      console.error('Error loading homepage data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const { data } = await supabase
        .from('articles')
        .select(`
          id, title, slug, thumbnail_url,
          author:users!articles_author_id_fkey(display_name, email)
        `)
        .eq('status', 'published')
        .ilike('title', `%${searchQuery}%`)
        .limit(20);

      setSearchResults((data || []) as ArticleSearchResult[]);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleAddArticle = async (sectionId: string, articleId: string) => {
    setSaving(true);
    try {
      // Check if already exists
      const existing = sectionArticles[sectionId]?.find(a => a.article_id === articleId);
      if (existing) {
        alert('この記事は既に追加されています');
        return;
      }

      // Get max order
      const maxOrder = Math.max(
        0,
        ...(sectionArticles[sectionId]?.map(a => a.display_order) || [0])
      );

      const { error } = await supabase
        .from('homepage_section_articles')
        .insert({
          section_id: sectionId,
          article_id: articleId,
          display_order: maxOrder + 1,
        });

      if (error) throw error;

      // Reload data
      await loadData();
      setSearchModalSection(null);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      console.error('Error adding article:', err);
      alert('記事の追加に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveArticle = async (sectionArticleId: string) => {
    if (!confirm('この記事を削除しますか？')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('homepage_section_articles')
        .delete()
        .eq('id', sectionArticleId);

      if (error) throw error;
      await loadData();
    } catch (err) {
      console.error('Error removing article:', err);
      alert('記事の削除に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleMoveArticle = async (
    sectionId: string,
    sectionArticleId: string,
    direction: 'up' | 'down'
  ) => {
    const articles = sectionArticles[sectionId] || [];
    const idx = articles.findIndex(a => a.id === sectionArticleId);
    if (idx === -1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= articles.length) return;

    setSaving(true);
    try {
      // Swap display_order
      const currentOrder = articles[idx].display_order;
      const swapOrder = articles[swapIdx].display_order;

      await Promise.all([
        supabase
          .from('homepage_section_articles')
          .update({ display_order: swapOrder })
          .eq('id', articles[idx].id),
        supabase
          .from('homepage_section_articles')
          .update({ display_order: currentOrder })
          .eq('id', articles[swapIdx].id),
      ]);

      await loadData();
    } catch (err) {
      console.error('Error moving article:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSection = async (sectionId: string, isActive: boolean) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('homepage_sections')
        .update({ is_active: isActive })
        .eq('id', sectionId);

      if (error) throw error;
      await loadData();
    } catch (err) {
      console.error('Error toggling section:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/admin"
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            戻る
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">トップページ管理</h1>
        </div>

        {loading ? (
          <div className="text-gray-500">読み込み中...</div>
        ) : (
          <div className="space-y-6">
            {sections.map(section => (
              <div
                key={section.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="font-bold text-gray-900">{section.title}</h2>
                    <span className="text-xs text-gray-500">
                      ({section.section_key})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={section.is_active}
                        onChange={(e) =>
                          handleToggleSection(section.id, e.target.checked)
                        }
                        className="rounded border-gray-300"
                        disabled={saving}
                      />
                      表示
                    </label>
                    <button
                      onClick={() => setSearchModalSection(section.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                      disabled={saving}
                    >
                      <Plus className="w-4 h-4" />
                      記事を追加
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {(sectionArticles[section.id] || []).length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500 text-sm">
                      記事がありません
                    </div>
                  ) : (
                    (sectionArticles[section.id] || []).map((sa, idx) => (
                      <div
                        key={sa.id}
                        className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50"
                      >
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() =>
                              handleMoveArticle(section.id, sa.id, 'up')
                            }
                            disabled={idx === 0 || saving}
                            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() =>
                              handleMoveArticle(section.id, sa.id, 'down')
                            }
                            disabled={
                              idx === sectionArticles[section.id].length - 1 ||
                              saving
                            }
                            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            ▼
                          </button>
                        </div>

                        <GripVertical className="w-4 h-4 text-gray-300" />

                        {sa.article?.thumbnail_url ? (
                          <img
                            src={sa.article.thumbnail_url}
                            alt=""
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No img</span>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {sa.article?.title || '削除された記事'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {sa.article?.author?.display_name ||
                              sa.article?.author?.email ||
                              '不明'}
                          </div>
                        </div>

                        <div className="text-sm text-gray-400">
                          #{idx + 1}
                        </div>

                        <button
                          onClick={() => handleRemoveArticle(sa.id)}
                          disabled={saving}
                          className="p-2 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}

            {sections.length === 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                セクションがありません。
                <br />
                データベースのマイグレーションを実行してください。
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search Modal */}
      {searchModalSection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">記事を検索</h3>
              <button
                onClick={() => {
                  setSearchModalSection(null);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="記事タイトルで検索..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {searching ? (
                <div className="p-4 text-center text-gray-500">検索中...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchQuery ? '結果がありません' : '記事タイトルで検索してください'}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {searchResults.map(article => (
                    <button
                      key={article.id}
                      onClick={() =>
                        handleAddArticle(searchModalSection, article.id)
                      }
                      disabled={saving}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 text-left"
                    >
                      {article.thumbnail_url ? (
                        <img
                          src={article.thumbnail_url}
                          alt=""
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No img</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {article.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {article.author?.display_name ||
                            article.author?.email ||
                            '不明'}
                        </div>
                      </div>
                      <Plus className="w-5 h-5 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
