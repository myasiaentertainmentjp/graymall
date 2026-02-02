import { supabase } from "../../lib/supabase";

export async function getFavoriteMap(articleIds: string[]) {
  const userRes = await supabase.auth.getUser();
  const user = userRes.data.user;
  if (!user) return new Map<string, boolean>();

  if (!articleIds.length) return new Map<string, boolean>();

  const { data, error } = await supabase
    .from("article_favorites")
    .select("article_id")
    .eq("user_id", user.id)
    .in("article_id", articleIds);

  if (error) throw error;

  const set = new Set((data ?? []).map((r: any) => r.article_id as string));
  const map = new Map<string, boolean>();
  for (const id of articleIds) map.set(id, set.has(id));
  return map;
}

export async function isFavorited(articleId: string) {
  const userRes = await supabase.auth.getUser();
  const user = userRes.data.user;
  if (!user) return false;

  const { data, error } = await supabase
    .from("article_favorites")
    .select("article_id")
    .eq("user_id", user.id)
    .eq("article_id", articleId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function addFavorite(articleId: string) {
  const userRes = await supabase.auth.getUser();
  const user = userRes.data.user;
  if (!user) throw new Error("NOT_AUTHENTICATED");

  const { error } = await supabase.from("article_favorites").insert({
    user_id: user.id,
    article_id: articleId,
  });

  if (error) throw error;
}

export async function removeFavorite(articleId: string) {
  const userRes = await supabase.auth.getUser();
  const user = userRes.data.user;
  if (!user) throw new Error("NOT_AUTHENTICATED");

  const { error } = await supabase
    .from("article_favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("article_id", articleId);

  if (error) throw error;
}

export async function toggleFavorite(articleId: string, next: boolean) {
  if (next) return addFavorite(articleId);
  return removeFavorite(articleId);
}