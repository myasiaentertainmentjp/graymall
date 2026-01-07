// src/features/social/follows.ts
import { supabase } from "../../lib/supabase";

export async function isFollowing(targetUserId: string): Promise<boolean> {
  const { data, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;

  const me = data.user?.id ?? null;
  if (!me || !targetUserId || me === targetUserId) return false;

  const { data: row, error } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", me)
    .eq("following_id", targetUserId)
    .maybeSingle();

  if (error) throw error;
  return !!row;
}

export async function toggleFollow(targetUserId: string, shouldFollow: boolean): Promise<void> {
  const { data, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;

  const me = data.user?.id ?? null;
  if (!me) throw new Error("Not authenticated");
  if (!targetUserId || me === targetUserId) return;

  if (shouldFollow) {
    const { error } = await supabase
      .from("follows")
      .insert({ follower_id: me, following_id: targetUserId });

    // 既にフォロー済みの二重insertは無視（409/unique想定）
    if (error && error.code !== "23505") throw error;
  } else {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", me)
      .eq("following_id", targetUserId);

    if (error) throw error;
  }
}
