// src/pages/FollowingUsers.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { User, UserMinus, Loader2 } from 'lucide-react';

type FollowingUser = {
  id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  bio: string | null;
};

export default function FollowingUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<FollowingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadFollowingUsers();
    }
  }, [user]);

  const loadFollowingUsers = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // フォロー中のユーザーIDを取得
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .order('created_at', { ascending: false });

      if (follows && follows.length > 0) {
        const followingIds = follows.map(f => f.following_id);

        // ユーザー情報を取得
        const { data: usersData } = await supabase
          .from('users')
          .select('id, display_name, email, avatar_url, bio')
          .in('id', followingIds);

        // フォロー順に並び替え
        const sortedUsers = followingIds
          .map(id => usersData?.find(u => u.id === id))
          .filter(Boolean) as FollowingUser[];

        setUsers(sortedUsers);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Error loading following users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (targetUserId: string) => {
    if (!user) return;

    setUnfollowingId(targetUserId);
    try {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      setUsers(prev => prev.filter(u => u.id !== targetUserId));
    } catch (err) {
      console.error('Error unfollowing:', err);
    } finally {
      setUnfollowingId(null);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">フォロー中のユーザー</h1>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>フォロー中のユーザーはいません</p>
            <Link
              to="/articles"
              className="mt-4 inline-block text-blue-600 hover:underline"
            >
              記事を探す
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map(followedUser => (
              <div
                key={followedUser.id}
                className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between"
              >
                <Link
                  to={`/users/${followedUser.id}`}
                  className="flex items-center gap-4 flex-1 min-w-0"
                >
                  {followedUser.avatar_url ? (
                    <img
                      src={followedUser.avatar_url}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {followedUser.display_name || followedUser.email.split('@')[0]}
                    </p>
                    {followedUser.bio && (
                      <p className="text-sm text-gray-500 truncate">{followedUser.bio}</p>
                    )}
                  </div>
                </Link>

                <button
                  onClick={() => handleUnfollow(followedUser.id)}
                  disabled={unfollowingId === followedUser.id}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                >
                  {unfollowingId === followedUser.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserMinus className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">フォロー解除</span>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-500">
          {users.length > 0 && `${users.length}人をフォロー中`}
        </div>
      </div>
    </Layout>
  );
}
