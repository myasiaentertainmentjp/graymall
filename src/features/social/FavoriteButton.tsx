import React, { useEffect, useState } from "react";
import { isFavorited, toggleFavorite } from "./favorites";

type Props = {
  articleId: string;
  className?: string;
  onChanged?: (next: boolean) => void;
};

export function FavoriteButton({ articleId, className, onChanged }: Props) {
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const v = await isFavorited(articleId);
        if (alive) setFavorited(v);
      } catch {
        if (alive) setFavorited(false);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [articleId]);

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const next = !favorited;
    try {
      setLoading(true);
      await toggleFavorite(articleId, next);
      setFavorited(next);
      onChanged?.(next);
    } catch (err: any) {
      if (err?.message === "NOT_AUTHENTICATED") {
        alert("ログインが必要です");
        return;
      }
      alert("お気に入りの更新に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" disabled={loading} onClick={onClick} className={className}>
      {favorited ? "お気に入り済み" : "お気に入り"}
    </button>
  );
}

export default FavoriteButton;
