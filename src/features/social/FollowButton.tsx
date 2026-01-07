// src/features/social/FollowButton.tsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { isFollowing, toggleFollow } from "./follows";

type Props = {
  targetUserId: string;
};

export function FollowButton({ targetUserId }: Props) {
  const [meId, setMeId] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);

      const userRes = await supabase.auth.getUser();
      const me = userRes.data.user?.id ?? null;
      if (cancelled) return;

      setMeId(me);

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

  if (!meId) return null;
  if (!targetUserId) return null;
  if (meId === targetUserId) return null;

  const onClick = async () => {
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
      disabled={loading}
      className={
        "px-4 py-2 rounded-md text-sm font-medium border " +
        (following
          ? "bg-gray-900 text-white border-gray-900"
          : "bg-white text-gray-900 border-gray-300 hover:bg-gray-50") +
        (loading ? " opacity-60" : "")
      }
    >
      {following ? "フォロー中" : "フォロー"}
    </button>
  );
}

export default FollowButton;
