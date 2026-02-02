// src/features/social/FollowButton.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { isFollowing, toggleFollow } from "./follows";

type Props = {
  targetUserId: string;
  fullWidth?: boolean;
};

export function FollowButton({ targetUserId, fullWidth = false }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [meId, setMeId] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);

      const userRes = await supabase.auth.getUser();
      const me = userRes.data.user?.id ?? null;
      if (cancelled) return;

      setMeId(me);
      setInitialized(true);

      if (!me || !targetUserId || me === targetUserId) {
        setFollowing(false);
        setLoading(false);
        return;
      }

      try {
        const f = await isFollowing(targetUserId);
        if (!cancelled) setFollowing(f);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [targetUserId]);

  // Don't render until initialized
  if (!initialized) return null;
  if (!targetUserId) return null;
  // Don't show on own profile
  if (meId && meId === targetUserId) return null;

  const onClick = async () => {
    // Not logged in - redirect to login
    if (!meId) {
      navigate(`/signin?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }

    if (loading) return;

    const next = !following;
    setFollowing(next);

    try {
      await toggleFollow(targetUserId, next);
    } catch (e) {
      setFollowing(!next);
      console.error(e);
      alert("フォローの更新に失敗しました");
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading && !!meId}
      className={
        (fullWidth ? "w-full py-3 rounded-full " : "px-4 py-2 rounded-md ") +
        "text-sm font-medium border " +
        (following
          ? "bg-gray-900 text-white border-gray-900"
          : fullWidth
            ? "bg-gray-900 text-white border-gray-900 hover:bg-gray-800"
            : "bg-white text-gray-900 border-gray-300 hover:bg-gray-50") +
        (loading && meId ? " opacity-60" : "")
      }
    >
      {following ? "フォロー中" : "フォロー"}
    </button>
  );
}

export default FollowButton;
