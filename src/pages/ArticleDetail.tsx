// src/pages/ArticleDetail.tsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { checkArticleAccess } from '../lib/articleAccess';
import Layout from '../components/Layout';
import ArticleCard from '../components/ArticleCard';
import ArticleComments from '../components/ArticleComments';
import { SkeletonArticleDetail } from '../components/SkeletonCard';
import type { Database } from '../lib/database.types';
import { Lock, ShoppingCart, CheckCircle, Loader2, Share2, Copy, ChevronRight, ChevronDown, User, Heart, Home, List, Facebook, Link2 } from 'lucide-react';
import { FollowButton } from '../features/social/FollowButton';
import { useSEO } from '../hooks/useSEO';
import LinkCardRenderer from '../components/LinkCardRenderer';

type Article = Database['public']['Tables']['articles']['Row'] & {
  users?: { display_name: string | null; email: string; avatar_url?: string | null; bio?: string | null };
  author_profiles?: { display_name: string; avatar_url?: string | null; bio?: string | null } | null;
  primary_category?: { id: string; name: string; slug: string } | null;
};

type RelatedArticle = Database['public']['Tables']['articles']['Row'] & {
  users?: { display_name: string | null; email: string; avatar_url?: string | null };
  author_profiles?: { display_name: string; avatar_url?: string | null } | null;
  primary_category?: { id: string; name: string; slug: string } | null;
};

// 著者情報を取得するヘルパー（author_profilesがあればそちらを優先）
function getAuthorInfo(article: Article | RelatedArticle) {
  if (article.author_profiles) {
    return {
      display_name: article.author_profiles.display_name,
      avatar_url: article.author_profiles.avatar_url || null,
      bio: 'bio' in article.author_profiles ? article.author_profiles.bio : null,
    };
  }
  return {
    display_name: article.users?.display_name || article.users?.email?.split('@')[0] || '匿名',
    avatar_url: article.users?.avatar_url || null,
    bio: article.users && 'bio' in article.users ? article.users.bio : null,
  };
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * 記事HTMLから画像後の空行を除去
 */
function cleanArticleHtml(html: string): string {
  let result = html;

  // 空のpタグのパターン（様々なバリエーション）
  const emptyPPatterns = [
    /<p>\s*<\/p>/gi,
    /<p>\s*<br\s*\/?>\s*<\/p>/gi,
    /<p>\s*(&nbsp;)+\s*<\/p>/gi,
    /<p>\s*&nbsp;\s*<\/p>/gi,
    /<p><br><\/p>/gi,
    /<p>\s+<\/p>/gi,
  ];

  // figure/figcaptionの後の空pタグを全て除去
  emptyPPatterns.forEach(pattern => {
    result = result.replace(new RegExp(`<\\/figure>\\s*${pattern.source}`, 'gi'), '</figure>');
    result = result.replace(new RegExp(`<\\/figcaption>\\s*<\\/figure>\\s*${pattern.source}`, 'gi'), '</figcaption></figure>');
  });

  // 複数回実行して連続する空pタグを除去
  for (let i = 0; i < 3; i++) {
    emptyPPatterns.forEach(pattern => {
      result = result.replace(new RegExp(`<\\/figure>\\s*${pattern.source}`, 'gi'), '</figure>');
    });
  }

  // 全ての空pタグを除去（画像後に限らず）
  emptyPPatterns.forEach(pattern => {
    result = result.replace(pattern, '');
  });

  return result;
}

/**
 * HTMLから目次を生成
 */
type TocItem = { id: string; text: string; level: number };

function generateTableOfContents(html: string): TocItem[] {
  const doc = new DOMParser().parseFromString(html || '', 'text/html');
  const headings = doc.querySelectorAll('h2, h3');
  const toc: TocItem[] = [];

  headings.forEach((heading, index) => {
    const text = heading.textContent?.trim() || '';
    if (text) {
      const id = `heading-${index}`;
      toc.push({
        id,
        text,
        level: heading.tagName === 'H2' ? 2 : 3,
      });
    }
  });

  return toc;
}

/**
 * 記事HTMLに見出しIDを付与
 */
function addHeadingIds(html: string): string {
  const doc = new DOMParser().parseFromString(html || '', 'text/html');
  const headings = doc.querySelectorAll('h2, h3');

  headings.forEach((heading, index) => {
    heading.id = `heading-${index}`;
  });

  return doc.body.innerHTML;
}

/**
 * 目次コンポーネント（デフォルトで閉じている）
 */
function TableOfContents({ content }: { content: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const toc = generateTableOfContents(content);

  if (toc.length < 2) return null;

  return (
    <div className="border border-gray-200 rounded-lg mb-6 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <List className="w-4 h-4" />
          目次
          <span className="text-xs text-gray-400 font-normal">({toc.length})</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <nav className="px-4 py-3 space-y-1 border-t border-gray-200">
          {toc.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`block text-sm text-gray-600 hover:text-gray-900 transition py-1 ${
                item.level === 3 ? 'pl-4' : ''
              }`}
            >
              {item.text}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}

/**
 * 記事コンテンツ表示コンポーネント
 * CSSで余白を制御、URLはリンクカードに変換
 */
function ArticleContent({ html }: { html: string }) {
  return (
    <div className="prose md:prose-lg max-w-none article-content">
      <LinkCardRenderer html={html} />
    </div>
  );
}

export default function ArticleDetail() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { user, session, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [article, setArticle] = useState<Article | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [authorArticles, setAuthorArticles] = useState<RelatedArticle[]>([]);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [realFavoriteCount, setRealFavoriteCount] = useState(0);
  const [anonLikeCount, setAnonLikeCount] = useState(0);
  const [hasAnonLiked, setHasAnonLiked] = useState(false);
  const [heartAnimating, setHeartAnimating] = useState(false);

  // アフィリエイトリファラルID（URLの?ref=xxx）
  const affiliateUserId = searchParams.get('ref');

  // SEO設定（構造化データ含む）
  const authorInfo = article ? getAuthorInfo(article) : null;
  useSEO({
    title: article?.title,
    description: article?.excerpt || undefined,
    ogImage: article?.cover_image_url || undefined,
    ogType: 'article',
    canonicalUrl: article ? `/articles/${article.slug}` : undefined,
    articleData: article ? {
      title: article.title,
      description: article.excerpt || '',
      image: article.cover_image_url || undefined,
      authorName: authorInfo?.display_name || '匿名',
      publishedAt: article.published_at || article.created_at,
      modifiedAt: article.updated_at || undefined,
      slug: article.slug,
    } : undefined,
    breadcrumbs: article ? [
      { name: 'ホーム', url: '/' },
      ...(article.primary_category
        ? [{ name: article.primary_category.name, url: `/articles?category=${article.primary_category.slug}` }]
        : [{ name: '記事一覧', url: '/articles' }]),
      { name: article.title, url: `/articles/${article.slug}` },
    ] : undefined,
  });

  // 決済成功で戻ってきた場合
  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      setPaymentSuccess(true);
    }
  }, [searchParams]);

  // 購入完了後のリダイレクト（お礼メッセージがある場合は長めに表示）
  useEffect(() => {
    if (paymentSuccess && article) {
      const hasThankYouMsg = !!(article as any)?.thank_you_message;
      const delay = hasThankYouMsg ? 5000 : 1500;
      const timer = setTimeout(() => {
        window.location.href = window.location.pathname;
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [paymentSuccess, article]);

  // GTM: 購入完了イベント
  useEffect(() => {
    if (paymentSuccess && article && typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'purchase',
        ecommerce: {
          transaction_id: `${article.id}_${Date.now()}`,
          value: article.price || 0,
          currency: 'JPY',
          items: [{
            item_id: article.id,
            item_name: article.title,
            price: article.price || 0,
            quantity: 1,
          }],
        },
      });
      console.log('[GTM] purchase event pushed', article.id);
    }
  }, [paymentSuccess, article]);

  // いいね数を読み込み（会員 + 匿名）
  useEffect(() => {
    if (!article) return;

    const loadFavoriteCount = async () => {
      // 会員いいね数
      const { count } = await supabase
        .from('article_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', article.id);
      setRealFavoriteCount(count || 0);

      // 匿名いいね数（localStorage）
      const anonLikes = JSON.parse(localStorage.getItem('anon_likes') || '{}');
      const articleAnonCount = anonLikes[`count_${article.id}`] || 0;
      setAnonLikeCount(articleAnonCount);

      // 自分が匿名いいね済みか
      const likedArticles = JSON.parse(localStorage.getItem('liked_articles') || '[]');
      setHasAnonLiked(likedArticles.includes(article.id));
    };

    loadFavoriteCount();
  }, [article?.id]);

  // 閲覧履歴を記録（ログインユーザーのみ）
  useEffect(() => {
    if (!user || !article) return;

    const recordView = async () => {
      try {
        // UPSERTで閲覧履歴を記録（重複時はviewed_atを更新）
        await supabase
          .from('article_views')
          .upsert(
            {
              user_id: user.id,
              article_id: article.id,
              viewed_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id,article_id',
            }
          );
      } catch (err) {
        // 閲覧履歴の記録失敗は無視（UXに影響しない）
        console.error('Failed to record article view:', err);
      }
    };

    recordView();
  }, [user, article?.id]);

  // ユーザーがいいね済みかチェック（会員）
  useEffect(() => {
    if (!user || !article) return;

    const checkFavorite = async () => {
      const { data } = await supabase
        .from('article_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('article_id', article.id)
        .maybeSingle();
      setIsFavorite(!!data);
    };

    checkFavorite();
  }, [user, article?.id]);

  // いいねトグル（会員 & 非会員対応）
  const toggleFavorite = async () => {
    if (!article) return;
    if (favoriteLoading) return;

    // アニメーション開始
    setHeartAnimating(true);
    setTimeout(() => setHeartAnimating(false), 300);

    // ===== 会員の場合 =====
    if (user) {
      setFavoriteLoading(true);

      if (isFavorite) {
        await supabase
          .from('article_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('article_id', article.id);
        setIsFavorite(false);
        setRealFavoriteCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase
          .from('article_favorites')
          .insert({ user_id: user.id, article_id: article.id });
        setIsFavorite(true);
        setRealFavoriteCount(prev => prev + 1);
      }

      setFavoriteLoading(false);
      return;
    }

    // ===== 非会員の場合（localStorage） =====
    const likedArticles = JSON.parse(localStorage.getItem('liked_articles') || '[]');

    if (hasAnonLiked) {
      // 既にいいね済み → 解除
      const updated = likedArticles.filter((id: string) => id !== article.id);
      localStorage.setItem('liked_articles', JSON.stringify(updated));
      setHasAnonLiked(false);
      setAnonLikeCount(prev => Math.max(0, prev - 1));

      // グローバルカウントも更新
      const anonLikes = JSON.parse(localStorage.getItem('anon_likes') || '{}');
      anonLikes[`count_${article.id}`] = Math.max(0, (anonLikes[`count_${article.id}`] || 0) - 1);
      localStorage.setItem('anon_likes', JSON.stringify(anonLikes));
    } else {
      // いいね追加
      likedArticles.push(article.id);
      localStorage.setItem('liked_articles', JSON.stringify(likedArticles));
      setHasAnonLiked(true);
      setAnonLikeCount(prev => prev + 1);

      // グローバルカウントも更新
      const anonLikes = JSON.parse(localStorage.getItem('anon_likes') || '{}');
      anonLikes[`count_${article.id}`] = (anonLikes[`count_${article.id}`] || 0) + 1;
      localStorage.setItem('anon_likes', JSON.stringify(anonLikes));
    }
  };

  // いいね済み判定（会員 or 非会員）
  const isLiked = user ? isFavorite : hasAnonLiked;

  // 記事読み込み
  useEffect(() => {
    loadArticle();
  }, [slug, user, authLoading]);

  const loadArticle = async () => {
    // 認証情報のロードが完了するまで待機
    if (authLoading) {
      return;
    }

    if (!slug) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    setLoading(true);
    setNotFound(false);

    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          users:author_id (display_name, email, avatar_url, bio),
          author_profiles:author_profile_id (display_name, avatar_url, bio),
          primary_category:primary_category_id (id, name, slug)
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (error) {
        console.error('Article fetch error:', error);
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setArticle(data as Article);

      // 購入済み判定（認証済みの場合のみ）
      if (user) {
        const access = await checkArticleAccess(user.id, data);
        setHasAccess(access);
      } else {
        setHasAccess(false);
      }

      // 著者の他の記事を取得
      const { data: authorArts } = await supabase
        .from('articles')
        .select(`
          *,
          users:author_id (display_name, email, avatar_url),
          author_profiles:author_profile_id (display_name, avatar_url),
          primary_category:primary_category_id (id, name, slug)
        `)
        .eq('author_id', data.author_id)
        .eq('status', 'published')
        .neq('id', data.id)
        .order('created_at', { ascending: false })
        .limit(4);

      setAuthorArticles((authorArts || []) as RelatedArticle[]);

      // 関連記事を取得（タグマッチング優先、同カテゴリでフォールバック）
      const articleTags = data.tags || [];
      let relatedArts: RelatedArticle[] = [];

      // Step 1: タグが一致する記事を優先取得
      if (articleTags.length > 0) {
        const { data: tagMatched } = await supabase
          .from('articles')
          .select(`
            *,
            users:author_id (display_name, email, avatar_url),
            author_profile:author_profile_id (id, display_name, avatar_url),
            primary_category:primary_category_id (id, name, slug)
          `)
          .eq('status', 'published')
          .neq('id', data.id)
          .neq('author_id', data.author_id)
          .overlaps('tags', articleTags)
          .order('created_at', { ascending: false })
          .limit(4);

        relatedArts = (tagMatched || []) as RelatedArticle[];
      }

      // Step 2: タグマッチで足りない場合、同カテゴリから補完
      if (relatedArts.length < 4 && data.primary_category_id) {
        const existingIds = relatedArts.map(a => a.id);

        let query = supabase
          .from('articles')
          .select(`
            *,
            users:author_id (display_name, email, avatar_url),
            author_profile:author_profile_id (id, display_name, avatar_url),
            primary_category:primary_category_id (id, name, slug)
          `)
          .eq('primary_category_id', data.primary_category_id)
          .eq('status', 'published')
          .neq('id', data.id)
          .neq('author_id', data.author_id);

        // 既に取得済みの記事は除外
        if (existingIds.length > 0) {
          query = query.not('id', 'in', `(${existingIds.join(',')})`);
        }

        const { data: categoryMatched } = await query
          .order('created_at', { ascending: false })
          .limit(4 - relatedArts.length);

        relatedArts = [...relatedArts, ...((categoryMatched || []) as RelatedArticle[])];
      }

      setRelatedArticles(relatedArts);
    } catch (err) {
      console.error('Unexpected error:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!article) return;

    setPurchasing(true);

    try {
      // Build headers - use session token if logged in, anon key for guests
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      };

      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            type: 'article',
            articleId: article.id,
            // アフィリエイトリファラルIDを渡す（有効な場合のみ）
            affiliateUserId: affiliateUserId || undefined,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      window.location.href = data.url;

    } catch (err: any) {
      console.error('Purchase error:', err);
      alert(err.message || '購入処理中にエラーが発生しました');
      setPurchasing(false);
    }
  };

  // アフィリエイトリンクのコピー
  const copyAffiliateLink = async () => {
    if (!user || !article) return;

    const affiliateUrl = `${window.location.origin}/articles/${article.slug}?ref=${user.id}`;
    try {
      await navigator.clipboard.writeText(affiliateUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <SkeletonArticleDetail />
        </div>
      </Layout>
    );
  }

  if (notFound || !article) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">記事が見つかりません</h1>
          <p className="text-gray-600">この記事は存在しないか、まだ公開されていません。</p>
        </div>
      </Layout>
    );
  }

  if (paymentSuccess) {
    const thankYouMsg = (article as any)?.thank_you_message;
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
          <div className="text-xl font-bold text-gray-900">購入が完了しました</div>

          {thankYouMsg && (
            <div className="max-w-md w-full bg-green-50 border border-green-200 rounded-xl p-6 mt-2">
              <div className="text-sm text-green-700 font-medium mb-2">著者からのメッセージ</div>
              <div className="text-gray-800 whitespace-pre-wrap">{thankYouMsg}</div>
            </div>
          )}

          <div className="text-gray-600 mt-2">ページを更新しています...</div>
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </Layout>
    );
  }

  // 価格が0円または設定されていなければ無料記事
  const isFree = !article.price || article.price === 0;

  // アフィリエイトが有効か
  const canAffiliate = article.affiliate_enabled && article.affiliate_rate && article.affiliate_rate > 0;

  return (
    <Layout>
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* パンくずリスト */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 overflow-hidden">
          <Link to="/" className="flex items-center gap-1 hover:text-gray-700 transition flex-shrink-0">
            <Home className="w-4 h-4" />
            <span>ホーム</span>
          </Link>
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
          {article.primary_category ? (
            <>
              <Link
                to={`/articles?category=${article.primary_category.slug}`}
                className="hover:text-gray-700 transition flex-shrink-0"
              >
                {article.primary_category.name}
              </Link>
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            </>
          ) : (
            <>
              <Link to="/articles" className="hover:text-gray-700 transition flex-shrink-0">
                記事一覧
              </Link>
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            </>
          )}
          <span className="text-gray-900 truncate">{article.title}</span>
        </nav>

        {article.cover_image_url && (
          <img
            src={article.cover_image_url}
            alt={article.title}
            className="w-full h-auto max-h-96 object-contain rounded-lg mb-8"
          />
        )}

        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          {/* カテゴリ・読了時間 */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {article.primary_category && (
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                {article.primary_category.name}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{article.title}</h1>

          {/* いいねボタン（noteスタイル） */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={toggleFavorite}
              disabled={favoriteLoading}
              className="flex items-center gap-2 group"
            >
              <Heart
                className={`w-6 h-6 transition-all duration-200 ${
                  heartAnimating ? 'scale-125' : 'scale-100'
                } ${
                  isLiked
                    ? 'text-red-500 fill-red-500'
                    : 'text-gray-400 group-hover:text-red-400'
                }`}
              />
              <span className={`text-lg ${isLiked ? 'text-red-500' : 'text-gray-600'}`}>
                {((article as any).fake_favorite_count || 0) + realFavoriteCount + anonLikeCount}
              </span>
            </button>
          </div>

          <div className="mb-6 pb-6 border-b border-gray-200">
            {/* 著者情報 */}
            {(() => {
              const authorInfo = getAuthorInfo(article);
              return (
                <Link to={article.author_profile_id ? `/authors/${article.author_profile_id}` : `/users/${article.author_id}`} className="flex items-center gap-4 hover:opacity-80 transition">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-lg font-medium overflow-hidden">
                    {authorInfo.avatar_url ? (
                      <img src={authorInfo.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (authorInfo.display_name || 'U')[0].toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {authorInfo.display_name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(article.created_at).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                </Link>
              );
            })()}

            {/* アフィリエイト共有ボタン（アフィリエイト有効の場合） */}
            {canAffiliate && (article.affiliate_target === 'all' || hasAccess) && (
              <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Link2 className="w-4 h-4" />
                    <span>この記事を紹介する</span>
                  </div>
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                    報酬 {article.affiliate_rate}%
                  </span>
                </div>
                {user ? (
                  <>
                    <button
                      onClick={copyAffiliateLink}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition text-sm font-medium ${
                        copied
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          リンクをコピーしました
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          紹介リンクをコピー
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-400 text-center mt-2">
                      紹介経由で購入されると ¥{Math.floor((article.price || 0) * (article.affiliate_rate || 0) / 100).toLocaleString()} の報酬
                    </p>
                  </>
                ) : (
                  <>
                    <Link
                      to="/signup"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition text-sm font-medium"
                    >
                      無料登録して紹介リンクを取得
                    </Link>
                    <p className="text-xs text-gray-400 text-center mt-2">
                      紹介経由で購入されると ¥{Math.floor((article.price || 0) * (article.affiliate_rate || 0) / 100).toLocaleString()} の報酬が得られます
                    </p>
                  </>
                )}
                <p className="text-xs text-gray-400 text-center mt-2">
                  <a href="/affiliate-guide" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-500 transition">
                    ※アフィリエイトの仕組みについて
                  </a>
                </p>
              </div>
            )}
          </div>

          {/* 目次（見出しが2つ以上ある場合のみ表示） */}
          <TableOfContents content={article.content} />

          {isFree || hasAccess ? (
            <ArticleContent html={addHeadingIds(cleanArticleHtml(
              article.content
                .replace(/<!-- paid -->/g, '')
                .replace(/<!-- PAYWALL_BOUNDARY -->/g, '')
            ))} />
          ) : (
            <>
              <div className="prose md:prose-lg max-w-none mb-8">
                <div dangerouslySetInnerHTML={{ __html: cleanArticleHtml(article.excerpt) }} />
              </div>

              {(article.content.includes('<!-- paid -->') || article.content.includes('<!-- PAYWALL_BOUNDARY -->')) && (
                <div className="prose md:prose-lg max-w-none mb-8">
                  <div dangerouslySetInnerHTML={{
                    __html: cleanArticleHtml(
                      article.content
                        .split('<!-- paid -->')[0]
                        .split('<!-- PAYWALL_BOUNDARY -->')[0]
                    )
                  }} />
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-transparent via-white/80 to-white pointer-events-none" style={{ marginTop: '-8rem' }} />
                <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
                  <div className="w-12 h-12 mx-auto mb-5 bg-gray-900 rounded-full flex items-center justify-center">
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-sm text-gray-500 mb-2">この続きを読むには</p>
                  <div className="text-3xl font-bold text-gray-900 mb-6">
                    ¥{article.price.toLocaleString()}
                  </div>

                  {/* アフィリエイト経由の場合の表示 */}
                  {affiliateUserId && canAffiliate && (
                    <p className="text-xs text-green-600 mb-4 bg-green-50 py-1 px-3 rounded-full inline-block">
                      紹介リンク経由
                    </p>
                  )}

                  <button
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3.5 rounded-full transition disabled:opacity-50 font-medium"
                  >
                    {purchasing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShoppingCart className="w-4 h-4" />
                    )}
                    <span>{purchasing ? '処理中...' : '購入して続きを読む'}</span>
                  </button>
                  <p className="text-xs text-gray-500 mt-4">
                    {user ? (
                      'クレジットカードで安全にお支払い'
                    ) : (
                      '会員登録不要・クレジットカードで購入できます'
                    )}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 記事下：いいね + シェアアイコン（コンパクトインライン） */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={toggleFavorite}
            disabled={favoriteLoading}
            className="flex items-center gap-2 group"
          >
            <Heart
              className={`w-6 h-6 transition-all duration-200 ${
                heartAnimating ? 'scale-125' : 'scale-100'
              } ${
                isLiked
                  ? 'text-red-500 fill-red-500'
                  : 'text-gray-400 group-hover:text-red-400'
              }`}
            />
            <span className={`text-lg ${isLiked ? 'text-red-500' : 'text-gray-600'}`}>
              {((article as any).fake_favorite_count || 0) + realFavoriteCount + anonLikeCount}
            </span>
          </button>
          <div className="flex items-center gap-2">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-9 h-9 bg-black text-white rounded-full hover:bg-gray-800 transition"
              title="Xでシェア"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-9 h-9 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
              title="Facebookでシェア"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href={`https://line.me/R/msg/text/?${encodeURIComponent(article.title + '\n' + window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-9 h-9 bg-[#06C755] text-white rounded-full hover:brightness-95 transition"
              title="LINEでシェア"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.349 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
            </a>
            <a
              href={`https://b.hatena.ne.jp/entry/s/${window.location.href.replace(/^https?:\/\//, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-9 h-9 bg-[#00A4DE] text-white rounded-full hover:brightness-95 transition"
              title="はてなブックマークに追加"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.47 0C22.42 0 24 1.58 24 3.53v16.94c0 1.95-1.58 3.53-3.53 3.53H3.53C1.58 24 0 22.42 0 20.47V3.53C0 1.58 1.58 0 3.53 0h16.94zm-3.705 14.47c-.78 0-1.41.63-1.41 1.41s.63 1.414 1.41 1.414 1.41-.634 1.41-1.414-.63-1.41-1.41-1.41zm.255-9.884h-2.296v9.882h2.296V4.586zm-5.255 5.08c.66-.33 1.044-.99 1.044-1.79 0-1.27-1.065-2.16-2.595-2.16H6.78v9.75h3.615c1.665 0 2.835-.93 2.835-2.34 0-1.02-.54-1.8-1.41-2.085zm-1.86 3.195H9.03v-1.875h.96c.69 0 1.125.39 1.125.96 0 .555-.435.915-1.125.915zm-.21-4.275H9.03V6.99h.87c.615 0 .99.36.99.855 0 .48-.375.84-.99.84z"/>
              </svg>
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('URLをコピーしました');
              }}
              className="flex items-center justify-center w-9 h-9 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition"
              title="URLをコピー"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 記事下コンテンツ */}
        <div className="mt-12 space-y-12">
          {/* 著者プロフィール */}
          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100">
            {(() => {
              const authorInfo = getAuthorInfo(article);
              return (
                <div className="flex items-center gap-3 sm:gap-4">
                  <Link to={article.author_profile_id ? `/authors/${article.author_profile_id}` : `/users/${article.author_id}`} className="flex-shrink-0">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-200 overflow-hidden">
                      {authorInfo.avatar_url ? (
                        <img src={authorInfo.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl sm:text-2xl font-bold text-gray-400">
                          {(authorInfo.display_name?.[0] || 'U').toUpperCase()}
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={article.author_profile_id ? `/authors/${article.author_profile_id}` : `/users/${article.author_id}`}
                      className="font-bold text-base sm:text-lg text-gray-900 hover:text-gray-700 line-clamp-1 block"
                    >
                      {authorInfo.display_name}
                    </Link>
                    <Link
                      to={article.author_profile_id ? `/authors/${article.author_profile_id}` : `/users/${article.author_id}`}
                      className="inline-flex items-center gap-1 text-xs sm:text-sm text-gray-500 hover:text-gray-700"
                    >
                      プロフィールを見る
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="flex-shrink-0">
                    <FollowButton targetUserId={article.author_id} />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* アフィリエイト紹介セクション */}
          {canAffiliate && (article.affiliate_target === 'all' || hasAccess) && (
            <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-gray-900">この記事を紹介して報酬を得る</h3>
                <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                  報酬 {article.affiliate_rate}%
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                紹介リンクを通じてこの記事が購入されると、¥{Math.floor((article.price || 0) * (article.affiliate_rate || 0) / 100).toLocaleString()} の報酬が得られます。
              </p>
              {user ? (
                <button
                  onClick={copyAffiliateLink}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition text-sm font-medium ${
                    copied
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      リンクをコピーしました
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      紹介リンクをコピー
                    </>
                  )}
                </button>
              ) : (
                <Link
                  to="/signup"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition text-sm font-medium"
                >
                  無料登録して紹介リンクを取得
                </Link>
              )}
              <p className="text-xs text-gray-400 text-center mt-3">
                <a href="/affiliate-guide" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-500 transition">
                  ※アフィリエイトの仕組みについて
                </a>
              </p>
            </div>
          )}

          {/* 著者の他の記事 */}
          {authorArticles.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {getAuthorInfo(article).display_name}の他の記事
                </h3>
                <Link
                  to={article.author_profile_id ? `/authors/${article.author_profile_id}` : `/users/${article.author_id}`}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  すべて見る
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {authorArticles.map((art) => (
                  <ArticleCard key={art.id} article={art} hideTime />
                ))}
              </div>
            </div>
          )}

          {/* コメントセクション */}
          <ArticleComments
            articleId={article.id}
            articleAuthorId={article.author_id}
            articlePrice={article.price || 0}
            hasPurchased={hasAccess}
          />

          {/* 関連記事（同じカテゴリ） */}
          {relatedArticles.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  関連記事
                </h3>
                {article.primary_category && (
                  <Link
                    to={`/articles?category=${article.primary_category.slug}`}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    {article.primary_category.name}をもっと見る
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedArticles.map((art) => (
                  <ArticleCard key={art.id} article={art} hideTime />
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </Layout>
  );
}
