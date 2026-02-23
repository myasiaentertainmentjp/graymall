// src/pages/UserProfile.tsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';
import ArticleCard from '../components/ArticleCard';
import { Settings, ExternalLink } from 'lucide-react';
import { FollowButton } from '../features/social/FollowButton';
import { useSEO } from '../hooks/useSEO';

// SNS Icons
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

type UserRow = Database['public']['Tables']['users']['Row'];
type Article = Database['public']['Tables']['articles']['Row'] & {
  users?: { display_name: string | null; email: string; avatar_url?: string | null };
  primary_category?: { id: string; name: string; slug: string } | null;
};

export default function UserProfile() {
  const { id } = useParams();
  const userId = id || '';
  const { user } = useAuth();

  const [profile, setProfile] = useState<UserRow | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    (async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data: u } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      setProfile(u ?? null);

      const { data: a } = await supabase
        .from('articles')
        .select(`
          *,
          users:author_id (display_name, email, avatar_url),
          author_profile:author_profile_id (id, display_name, avatar_url),
          primary_category:primary_category_id (id, name, slug)
        `)
        .eq('status', 'published')
        .eq('author_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      setArticles((a ?? []) as Article[]);
      setLoading(false);
    })();
  }, [userId]);

  // SNS links - only show if URL is set
  const snsLinks = profile ? [
    { url: profile.sns_x, icon: XIcon, label: 'X' },
    { url: profile.sns_instagram, icon: InstagramIcon, label: 'Instagram' },
    { url: profile.sns_tiktok, icon: TikTokIcon, label: 'TikTok' },
    { url: profile.sns_youtube, icon: YouTubeIcon, label: 'YouTube' },
  ].filter(link => link.url) : [];

  // Custom links - only for premium users
  const customLinks = profile?.is_premium ? [
    { url: profile.custom_link_1_url, label: profile.custom_link_1_label },
    { url: profile.custom_link_2_url, label: profile.custom_link_2_label },
  ].filter(link => link.url && link.label) : [];

  // SEO設定
  const displayName = profile?.display_name || 'ユーザー';
  useSEO({
    title: displayName,
    description: profile?.bio || `${displayName}のプロフィールページです。`,
    canonicalUrl: `/users/${userId}`,
    ogType: 'profile',
    ogImage: profile?.avatar_url || undefined,
    personData: profile ? {
      name: displayName,
      url: `/users/${userId}`,
      image: profile.avatar_url || undefined,
      description: profile.bio || undefined,
    } : undefined,
    breadcrumbs: [
      { name: 'ホーム', url: '/' },
      { name: displayName, url: `/users/${userId}` },
    ],
  });

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-gray-400">読み込み中...</div>
        ) : !profile ? (
          <div className="text-gray-400">ユーザーが見つかりませんでした</div>
        ) : (
          <>
            {/* Profile Header - note.com風 */}
            <div className="mb-6">
              {/* Avatar + Name row */}
              <div className="flex items-start gap-4 mb-4">
                {/* Avatar */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gray-600 overflow-hidden flex-shrink-0">
                  <img src={profile.avatar_url || '/noicon.png'} alt="" className="w-full h-full object-cover" />
                </div>
                {/* Name */}
                <div className="flex-1 min-w-0 pt-1">
                  <h1 className="text-base sm:text-xl md:text-2xl font-bold text-white leading-tight">
                    {profile.display_name || 'ユーザー'}
                  </h1>
                </div>
                {/* Follow Button (PC) / Settings (own profile only) - PC */}
                <div className="flex-shrink-0 hidden sm:block">
                  {isOwnProfile ? (
                    <Link
                      to="/settings"
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
                      title="設定"
                    >
                      <Settings className="w-5 h-5" />
                    </Link>
                  ) : (
                    <FollowButton targetUserId={userId} />
                  )}
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-gray-200 text-sm mb-4 whitespace-pre-wrap leading-relaxed">
                  {profile.bio}
                </p>
              )}

              {/* SNS Links */}
              {(snsLinks.length > 0 || customLinks.length > 0) && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {snsLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-gray-700 hover:text-white transition"
                      title={link.label}
                    >
                      <link.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </a>
                  ))}
                  {customLinks.map((link, idx) => (
                    <a
                      key={`custom-${idx}`}
                      href={link.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-800 text-gray-300 text-xs sm:text-sm rounded-full hover:bg-gray-700 transition"
                    >
                      <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      {link.label}
                    </a>
                  ))}
                </div>
              )}

              {/* Follow Button / Settings - Mobile only */}
              <div className="sm:hidden">
                {!isOwnProfile ? (
                  <FollowButton targetUserId={userId} fullWidth />
                ) : (
                  <Link
                    to="/settings"
                    className="flex items-center justify-center gap-2 w-full py-3 border border-gray-600 text-gray-300 rounded-full font-medium text-sm hover:bg-gray-800 transition"
                  >
                    <Settings className="w-4 h-4" />
                    設定
                  </Link>
                )}
              </div>
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
