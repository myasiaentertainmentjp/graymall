// src/lib/affiliateTracking.ts
  import { supabase } from './supabase';

  const AFFILIATE_STORAGE_KEY = 'graymall_affiliate_ref';

  export interface AffiliateRef {
    code: string;
    articleId: string;
    timestamp: number;
  }

  /**
   * URLからrefパラメータを取得し、有効であればlocalStorageに保存
   * 同時にaffiliate_clicksに記録
   */
  export async function trackAffiliateFromUrl(articleId: string): Promise<void> {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');

    if (!refCode) return;

    // affiliate_codeからユーザーを検索
    const { data: refUser } = await supabase
      .from('users')
      .select('id')
      .eq('affiliate_code', refCode)
      .maybeSingle();

    if (!refUser) {
      console.log('[Affiliate] Invalid ref code:', refCode);
      return;
    }

    // localStorageに保存
    const refData: AffiliateRef = {
      code: refCode,
      articleId,
      timestamp: Date.now(),
    };
    localStorage.setItem(AFFILIATE_STORAGE_KEY, JSON.stringify(refData));

    // クリックを記録
    try {
      await supabase.from('affiliate_clicks').insert({
        article_id: articleId,
        ref_user_id: refUser.id,
      });
      console.log('[Affiliate] Click recorded for ref:', refCode);
    } catch (error) {
      console.error('[Affiliate] Failed to record click:', error);
    }
  }

  /**
   * localStorageから保存されたrefを取得
   */
  export function getStoredAffiliateRef(): AffiliateRef | null {
    try {
      const stored = localStorage.getItem(AFFILIATE_STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored) as AffiliateRef;
    } catch {
      return null;
    }
  }

  /**
   * localStorageのrefをクリア
   */
  export function clearStoredAffiliateRef(): void {
    localStorage.removeItem(AFFILIATE_STORAGE_KEY);
  }

  /**
   * 購入時にアフィリエイト成果を記録
   * 自己紹介（ref_user_id === buyer_user_id）は無視
   */
  export async function recordAffiliateConversion(
    articleId: string,
    buyerUserId: string,
    orderId: string,
    amount: number
  ): Promise<{ refUserId: string | null; recorded: boolean }> {
    const storedRef = getStoredAffiliateRef();

    if (!storedRef) {
      return { refUserId: null, recorded: false };
    }

    // 記事IDが一致するか確認（オプション：異なる記事でも成果にするなら削除）
    // if (storedRef.articleId !== articleId) {
    //   return { refUserId: null, recorded: false };
    // }

    // affiliate_codeからユーザーIDを取得
    const { data: refUser } = await supabase
      .from('users')
      .select('id')
      .eq('affiliate_code', storedRef.code)
      .maybeSingle();

    if (!refUser) {
      console.log('[Affiliate] Ref user not found for code:', storedRef.code);
      clearStoredAffiliateRef();
      return { refUserId: null, recorded: false };
    }

    // 自己紹介チェック
    if (refUser.id === buyerUserId) {
      console.log('[Affiliate] Self-referral detected, ignoring');
      clearStoredAffiliateRef();
      return { refUserId: null, recorded: false };
    }

    // コンバージョンを記録
    try {
      await supabase.from('affiliate_conversions').insert({
        article_id: articleId,
        ref_user_id: refUser.id,
        buyer_user_id: buyerUserId,
        order_id: orderId,
        amount,
      });
      console.log('[Affiliate] Conversion recorded:', {
        articleId,
        refUserId: refUser.id,
        buyerUserId,
        amount,
      });

      // 成果記録後はrefをクリア
      clearStoredAffiliateRef();

      return { refUserId: refUser.id, recorded: true };
    } catch (error) {
      console.error('[Affiliate] Failed to record conversion:', error);
      return { refUserId: refUser.id, recorded: false };
    }
  }

  /**
   * affiliate_codeからユーザーIDを取得（注文作成時に使用）
   */
  export async function getAffiliateUserIdFromCode(code: string): Promise<string | null> {
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('affiliate_code', code)
      .maybeSingle();

    return data?.id || null;
  }

  /**
   * 現在保存されているrefのユーザーIDを取得（購入者との比較用）
   */
  export async function getStoredRefUserId(): Promise<string | null> {
    const storedRef = getStoredAffiliateRef();
    if (!storedRef) return null;

    return getAffiliateUserIdFromCode(storedRef.code);
  }

  // 後方互換性のため、既存のCookie関数も残す
  const AFFILIATE_COOKIE_NAME = 'graymall_affiliate';
  const AFFILIATE_COOKIE_DAYS = 30;

  export function setAffiliateCookie(affiliateCode: string): void {
    const expires = new Date();
    expires.setDate(expires.getDate() + AFFILIATE_COOKIE_DAYS);
    document.cookie = `${AFFILIATE_COOKIE_NAME}=${affiliateCode}; expires=${expires.toUTCString()}; path=/`;
  }

  export function getAffiliateCookie(): string | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === AFFILIATE_COOKIE_NAME) {
        return value;
      }
    }
    return null;
  }

  export function clearAffiliateCookie(): void {
    document.cookie = `${AFFILIATE_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  }
