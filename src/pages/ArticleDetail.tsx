// src/pages/ArticleDetail.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { checkArticleAccess } from '../lib/articleAccess';
import Layout from '../components/Layout';
import ArticleCard from '../components/ArticleCard';
import type { Database } from '../lib/database.types';
import { Lock, ShoppingCart, CheckCircle, Loader2, Share2, Copy, ChevronRight, User, Heart } from 'lucide-react';
import { FollowButton } from '../features/social/FollowButton';
import { useSEO } from '../hooks/useSEO';

type Article = Database['public']['Tables']['articles']['Row'] & {
  users?: { display_name: string | null; email: string; avatar_url?: string | null; bio?: string | null };
  primary_category?: { id: string; name: string; slug: string } | null;
};

type RelatedArticle = Database['public']['Tables']['articles']['Row'] & {
  users?: { display_name: string | null; email: string; avatar_url?: string | null };
  primary_category?: { id: string; name: string; slug: string } | null;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

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

  // アフィリエイトリファラルID（URLの?ref=xxx）
  const affiliateUserId = searchParams.get('ref');

  // SEO設定
  useSEO({
    title: article?.title,
    description: article?.excerpt || undefined,
    ogImage: article?.cover_image_url || undefined,
    ogType: 'article',
    canonicalUrl: article ? `/articles/${article.slug}` : undefined,
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

  // いいね数を読み込み
  useEffect(() => {
    if (!article) return;

    const loadFavoriteCount = async () => {
      const { count } = await supabase
        .from('article_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', article.id);
      setRealFavoriteCount(count || 0);
    };

    loadFavoriteCount();
  }, [article?.id]);

  // ユーザーがいいね済みかチェック
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

  // いいねトグル
  const toggleFavorite = async () => {
    if (!article) return;

    if (!user) {
      navigate('/signin');
      return;
    }

    if (favoriteLoading) return;
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
  };

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
      // Build headers - include auth token if logged in
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

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
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
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
        {article.cover_image_url && (
          <img
            src={article.cover_image_url}
            alt={article.title}
            className="w-full h-auto max-h-96 object-contain rounded-lg mb-8"
          />
        )}

        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          {article.primary_category && (
            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full mb-4">
              {article.primary_category.name}
            </span>
          )}

          <h1 className="text-4xl font-bold text-gray-900 mb-4">{article.title}</h1>

          {/* いいねボタン */}
          <button
            onClick={toggleFavorite}
            disabled={favoriteLoading}
            className="flex items-center gap-2 mb-6 group"
          >
            <Heart
              className={`w-6 h-6 transition ${
                isFavorite
                  ? 'text-red-500 fill-red-500'
                  : 'text-gray-400 group-hover:text-red-400'
              }`}
            />
            <span className={`text-lg ${isFavorite ? 'text-red-500' : 'text-gray-600'}`}>
              {((article as any).fake_favorite_count || 0) + realFavoriteCount}
            </span>
          </button>

          <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
            <Link to={`/users/${article.author_id}`} className="flex items-center gap-4 hover:opacity-80 transition">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-lg font-medium overflow-hidden">
                {article.users?.avatar_url ? (
                  <img src={article.users.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  (article.users?.display_name || article.users?.email || 'U')[0].toUpperCase()
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {article.users?.display_name || article.users?.email?.split('@')[0]}
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(article.created_at).toLocaleDateString('ja-JP')}
                </div>
              </div>
            </Link>

            {/* アフィリエイト共有ボタン（購入済みかつアフィリエイト有効の場合） */}
            {user && hasAccess && canAffiliate && (
              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition"
                >
                  <Share2 className="w-4 h-4" />
                  <span>紹介して{article.affiliate_rate}%報酬</span>
                </button>
                {showShareMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
                    <p className="text-sm text-gray-600 mb-3">
                      このリンクで購入されると{article.affiliate_rate}%の報酬が得られます
                    </p>
                    <button
                      onClick={copyAffiliateLink}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>コピーしました</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>リンクをコピー</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {isFree || hasAccess ? (
            <div className="prose prose-lg max-w-none">
              <div dangerouslySetInnerHTML={{
                __html: article.content
                  .replace(/<!-- paid -->/g, '')
                  .replace(/<!-- PAYWALL_BOUNDARY -->/g, '')
              }} />
            </div>
          ) : (
            <>
              <div className="prose prose-lg max-w-none mb-8">
                <div dangerouslySetInnerHTML={{ __html: article.excerpt }} />
              </div>

              {(article.content.includes('<!-- paid -->') || article.content.includes('<!-- PAYWALL_BOUNDARY -->')) && (
                <div className="prose prose-lg max-w-none mb-8">
                  <div dangerouslySetInnerHTML={{
                    __html: article.content
                      .split('<!-- paid -->')[0]
                      .split('<!-- PAYWALL_BOUNDARY -->')[0]
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

        {/* 記事下コンテンツ */}
        <div className="mt-12 space-y-12">
          {/* アフィリエイト紹介バナー（購入者向け） */}
          {hasAccess && canAffiliate && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200">
              <div className="text-center mb-4">
                <span className="inline-block bg-orange-500 text-white text-sm font-bold px-4 py-1 rounded-full">
                  この記事を紹介して応援しよう!
                </span>
              </div>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-800">
                    <span className="text-orange-500 font-bold">¥</span>
                    <span className="font-bold">金額の{article.affiliate_rate}%還元</span>
                    <span className="text-gray-500 text-sm">
                      (¥{Math.floor((article.price || 0) * 0.85 * (article.affiliate_rate || 0) / 100).toLocaleString()})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-800">
                    <User className="w-4 h-4 text-orange-500" />
                    <span>{article.affiliate_target === 'buyers' ? '購入者のみ紹介できる' : '誰でも紹介できる'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">紹介リンクをコピー</span>
                  <button
                    onClick={copyAffiliateLink}
                    className="flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition font-medium"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>コピー済み</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        <span>コピー</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 著者プロフィール */}
          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center gap-3 sm:gap-4">
              <Link to={`/users/${article.author_id}`} className="flex-shrink-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-200 overflow-hidden">
                  {article.users?.avatar_url ? (
                    <img src={article.users.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl sm:text-2xl font-bold text-gray-400">
                      {(article.users?.display_name?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/users/${article.author_id}`}
                  className="font-bold text-base sm:text-lg text-gray-900 hover:text-gray-700 line-clamp-1 block"
                >
                  {article.users?.display_name || article.users?.email?.split('@')[0]}
                </Link>
                <Link
                  to={`/users/${article.author_id}`}
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
          </div>

          {/* 著者の他の記事 */}
          {authorArticles.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {article.users?.display_name || '著者'}の他の記事
                </h3>
                <Link
                  to={`/users/${article.author_id}`}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  すべて見る
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {authorArticles.map((art) => (
                  <ArticleCard key={art.id} article={art} />
                ))}
              </div>
            </div>
          )}

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
                  <ArticleCard key={art.id} article={art} />
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </Layout>
  );
}
