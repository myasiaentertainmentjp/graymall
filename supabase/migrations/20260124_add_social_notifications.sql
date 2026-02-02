-- 通知タイプを拡張（new_follower, article_liked, article_purchased を追加）
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'purchase_complete',
    'withdrawal_requested',
    'withdrawal_completed',
    'withdrawal_failed',
    'new_follower',
    'article_liked',
    'article_purchased'
  ));

-- フォロー時の通知を作成するトリガー関数
CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  follower_name TEXT;
BEGIN
  -- フォローしたユーザーの名前を取得
  SELECT COALESCE(display_name, email) INTO follower_name
  FROM users WHERE id = NEW.follower_id;

  -- 通知を作成
  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (
    NEW.following_id,
    'new_follower',
    '新しいフォロワー',
    follower_name || 'さんがあなたをフォローしました',
    jsonb_build_object('follower_id', NEW.follower_id)
  );

  RETURN NEW;
END;
$$;

-- フォロー時のトリガー
DROP TRIGGER IF EXISTS on_new_follower ON follows;
CREATE TRIGGER on_new_follower
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_follower();

-- いいね時の通知を作成するトリガー関数
CREATE OR REPLACE FUNCTION notify_article_liked()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  liker_name TEXT;
  article_author_id UUID;
  article_title TEXT;
BEGIN
  -- いいねしたユーザーの名前を取得
  SELECT COALESCE(display_name, email) INTO liker_name
  FROM users WHERE id = NEW.user_id;

  -- 記事の著者IDとタイトルを取得
  SELECT author_id, title INTO article_author_id, article_title
  FROM articles WHERE id = NEW.article_id;

  -- 自分へのいいねは通知しない
  IF article_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- 通知を作成
  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (
    article_author_id,
    'article_liked',
    '記事がいいねされました',
    liker_name || 'さんが「' || LEFT(article_title, 30) || '」にいいねしました',
    jsonb_build_object('article_id', NEW.article_id, 'liker_id', NEW.user_id)
  );

  RETURN NEW;
END;
$$;

-- いいね時のトリガー
DROP TRIGGER IF EXISTS on_article_liked ON article_favorites;
CREATE TRIGGER on_article_liked
  AFTER INSERT ON article_favorites
  FOR EACH ROW
  EXECUTE FUNCTION notify_article_liked();

-- 記事購入時の通知を作成するトリガー関数
CREATE OR REPLACE FUNCTION notify_article_purchased()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  buyer_name TEXT;
  article_author_id UUID;
  article_title TEXT;
BEGIN
  -- 購入者の名前を取得
  SELECT COALESCE(display_name, email) INTO buyer_name
  FROM users WHERE id = NEW.buyer_id;

  -- 記事の著者IDとタイトルを取得
  SELECT author_id, title INTO article_author_id, article_title
  FROM articles WHERE id = NEW.article_id;

  -- 通知を作成（著者宛）
  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (
    article_author_id,
    'article_purchased',
    '記事が購入されました',
    buyer_name || 'さんが「' || LEFT(article_title, 30) || '」を購入しました（¥' || NEW.price::TEXT || '）',
    jsonb_build_object('article_id', NEW.article_id, 'buyer_id', NEW.buyer_id, 'price', NEW.price)
  );

  RETURN NEW;
END;
$$;

-- 購入時のトリガー
DROP TRIGGER IF EXISTS on_article_purchased ON article_purchases;
CREATE TRIGGER on_article_purchased
  AFTER INSERT ON article_purchases
  FOR EACH ROW
  EXECUTE FUNCTION notify_article_purchased();
