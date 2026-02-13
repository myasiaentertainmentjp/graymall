-- ============================================
-- 通知に著者プロフィール情報を含める + コメント通知追加
-- ============================================

-- 通知タイプに new_comment を追加
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'purchase_complete',
    'withdrawal_requested',
    'withdrawal_completed',
    'withdrawal_failed',
    'new_follower',
    'article_liked',
    'article_purchased',
    'new_comment'
  ));

-- いいね時の通知を更新（著者プロフィール情報を含める）
CREATE OR REPLACE FUNCTION notify_article_liked()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  liker_name TEXT;
  article_author_id UUID;
  article_title TEXT;
  author_profile_name TEXT;
BEGIN
  -- いいねしたユーザーの名前を取得
  SELECT COALESCE(display_name, email) INTO liker_name
  FROM users WHERE id = NEW.user_id;

  -- 記事の著者IDとタイトルと著者プロフィール名を取得
  SELECT
    a.author_id,
    a.title,
    COALESCE(ap.display_name, u.display_name, u.email)
  INTO article_author_id, article_title, author_profile_name
  FROM articles a
  LEFT JOIN author_profiles ap ON a.author_profile_id = ap.id
  LEFT JOIN users u ON a.author_id = u.id
  WHERE a.id = NEW.article_id;

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
    '【' || author_profile_name || '】の記事「' || LEFT(article_title, 25) || '」に' || liker_name || 'さんがいいねしました',
    jsonb_build_object('article_id', NEW.article_id, 'liker_id', NEW.user_id)
  );

  RETURN NEW;
END;
$$;

-- 記事購入時の通知を更新（著者プロフィール情報を含める）
CREATE OR REPLACE FUNCTION notify_article_purchased()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  buyer_name TEXT;
  article_author_id UUID;
  article_title TEXT;
  author_profile_name TEXT;
BEGIN
  -- 購入者の名前を取得
  SELECT COALESCE(display_name, email) INTO buyer_name
  FROM users WHERE id = NEW.buyer_id;

  -- 記事の著者IDとタイトルと著者プロフィール名を取得
  SELECT
    a.author_id,
    a.title,
    COALESCE(ap.display_name, u.display_name, u.email)
  INTO article_author_id, article_title, author_profile_name
  FROM articles a
  LEFT JOIN author_profiles ap ON a.author_profile_id = ap.id
  LEFT JOIN users u ON a.author_id = u.id
  WHERE a.id = NEW.article_id;

  -- 通知を作成（著者宛）
  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (
    article_author_id,
    'article_purchased',
    '記事が購入されました',
    '【' || author_profile_name || '】の記事「' || LEFT(article_title, 25) || '」が' || buyer_name || 'さんに購入されました（¥' || NEW.price::TEXT || '）',
    jsonb_build_object('article_id', NEW.article_id, 'buyer_id', NEW.buyer_id, 'price', NEW.price)
  );

  RETURN NEW;
END;
$$;

-- コメント時の通知を作成するトリガー関数
CREATE OR REPLACE FUNCTION notify_new_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  commenter_name TEXT;
  article_author_id UUID;
  article_title TEXT;
  article_slug TEXT;
  author_profile_name TEXT;
  comment_preview TEXT;
BEGIN
  -- コメントしたユーザーの名前を取得
  SELECT COALESCE(display_name, email) INTO commenter_name
  FROM users WHERE id = NEW.user_id;

  -- 記事の著者IDとタイトルと著者プロフィール名を取得
  SELECT
    a.author_id,
    a.title,
    a.slug,
    COALESCE(ap.display_name, u.display_name, u.email)
  INTO article_author_id, article_title, article_slug, author_profile_name
  FROM articles a
  LEFT JOIN author_profiles ap ON a.author_profile_id = ap.id
  LEFT JOIN users u ON a.author_id = u.id
  WHERE a.id = NEW.article_id;

  -- 自分へのコメントは通知しない
  IF article_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- コメントのプレビュー（最大50文字）
  comment_preview := LEFT(NEW.content, 50);
  IF char_length(NEW.content) > 50 THEN
    comment_preview := comment_preview || '...';
  END IF;

  -- 通知を作成
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  VALUES (
    article_author_id,
    'new_comment',
    '新しいコメントがつきました',
    '【' || author_profile_name || '】の記事「' || LEFT(article_title, 25) || '」に' || commenter_name || 'さんがコメントしました: ' || comment_preview,
    '/articles/' || article_slug,
    jsonb_build_object('article_id', NEW.article_id, 'commenter_id', NEW.user_id, 'comment_id', NEW.id)
  );

  RETURN NEW;
END;
$$;

-- コメント時のトリガー
DROP TRIGGER IF EXISTS on_new_comment ON article_comments;
CREATE TRIGGER on_new_comment
  AFTER INSERT ON article_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_comment();
