// src/pages/AuthorProfile.tsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import ArticleCard from '../components/ArticleCard';

type AuthorProfileRow = Database['public']['Tables']['author_profiles']['Row'];
type Article = Database['public']['Tables']['articles']['Row'] & {
  users?: { display_name: string | null; email: string; avatar_url?: string | null };
  author_profile?: { id: string; display_name: string; avatar_url: string | null } | null;
  primary_category?: { id: string; name: string; slug: string } | null;
};

export default function AuthorProfile() {
  const { id } = useParams();
  const authorId = id || '';

  const [profile, setProfile] = useState<AuthorProfileRow | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!authorId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      // Fetch author profile
      const { data: authorProfile } = await supabase
        .from('author_profiles')
        .select('*')
        .eq('id', authorId)
        .maybeSingle();
      setProfile(authorProfile ?? null);

      // Fetch articles by this author profile
      const { data: articlesData } = await supabase
        .from('articles')
        .select(`
          *,
          users:author_id (display_name, email, avatar_url),
          author_profile:author_profile_id (id, display_name, avatar_url),
          primary_category:primary_category_id (id, name, slug)
        `)
        .eq('status', 'published')
        .eq('author_profile_id', authorId)
        .order('created_at', { ascending: false })
        .limit(50);

      setArticles((articlesData ?? []) as Article[]);
      setLoading(false);
    })();
  }, [authorId]);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-gray-400">読み込み中...</div>
        ) : !profile ? (
          <div className="text-gray-400">著者が見つかりませんでした</div>
        ) : (
          <>
            {/* Profile Header */}
            <div className="mb-6">
              {/* Avatar + Name row */}
              <div className="flex items-start gap-4 mb-4">
                {/* Avatar */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl sm:text-2xl font-bold text-gray-400">
                      {(profile.display_name?.[0] || 'A').toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Name */}
                <div className="flex-1 min-w-0 pt-1">
                  <h1 className="text-base sm:text-xl md:text-2xl font-bold text-white leading-tight">
                    {profile.display_name || '著者'}
                  </h1>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-gray-300 text-sm mb-4 whitespace-pre-wrap leading-relaxed">
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Articles Section */}
            <div className="border-t border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">
                  投稿した記事
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    {articles.length}件
                  </span>
                </h2>
              </div>

              {articles.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  公開記事がありません
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {articles.map((article) => (
                    <ArticleCard key={article.id} article={article} skipDbQuery />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
