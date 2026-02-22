/**
 * GA4 Analytics Utility
 * GTM/GA4イベント送信用ユーティリティ
 * + Core Web Vitals計測
 */

declare global {
  interface Window {
    dataLayer: any[];
  }
}

// =============================================
// Core Web Vitals 計測
// =============================================

type WebVitalMetric = {
  name: 'CLS' | 'FID' | 'LCP' | 'FCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
};

// Web Vitalsをレポート（GA4に送信）
function reportWebVital(metric: WebVitalMetric) {
  pushEvent('web_vitals', {
    metric_name: metric.name,
    metric_value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    metric_rating: metric.rating,
    metric_delta: Math.round(metric.name === 'CLS' ? metric.delta * 1000 : metric.delta),
    metric_id: metric.id,
  });

  // コンソールにも出力（デバッグ用）
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
  }
}

// Core Web Vitals計測を開始
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  // LCP (Largest Contentful Paint)
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1] as any;
    const value = lastEntry.startTime;
    reportWebVital({
      name: 'LCP',
      value,
      rating: value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor',
      delta: value,
      id: `lcp-${Date.now()}`,
    });
  });
  try {
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {}

  // FID (First Input Delay) / INP (Interaction to Next Paint)
  const fidObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const value = (entry as any).processingStart - entry.startTime;
      reportWebVital({
        name: 'FID',
        value,
        rating: value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor',
        delta: value,
        id: `fid-${Date.now()}`,
      });
    }
  });
  try {
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch (e) {}

  // CLS (Cumulative Layout Shift)
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
      }
    }
  });
  try {
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch (e) {}

  // ページ離脱時にCLSを報告
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      reportWebVital({
        name: 'CLS',
        value: clsValue,
        rating: clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor',
        delta: clsValue,
        id: `cls-${Date.now()}`,
      });
    }
  }, { once: true });

  // FCP (First Contentful Paint)
  const fcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const fcpEntry = entries.find((e) => e.name === 'first-contentful-paint');
    if (fcpEntry) {
      const value = fcpEntry.startTime;
      reportWebVital({
        name: 'FCP',
        value,
        rating: value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor',
        delta: value,
        id: `fcp-${Date.now()}`,
      });
    }
  });
  try {
    fcpObserver.observe({ type: 'paint', buffered: true });
  } catch (e) {}

  // TTFB (Time to First Byte)
  const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (navEntry) {
    const value = navEntry.responseStart - navEntry.requestStart;
    reportWebVital({
      name: 'TTFB',
      value,
      rating: value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor',
      delta: value,
      id: `ttfb-${Date.now()}`,
    });
  }
}

// イベント送信の共通関数
function pushEvent(eventName: string, params: Record<string, any> = {}) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...params,
    });
  }
}

// 記事閲覧イベント
export function trackArticleView(article: {
  id: string;
  title: string;
  slug: string;
  price?: number | null;
  categoryName?: string;
  authorName?: string;
}) {
  pushEvent('view_item', {
    ecommerce: {
      items: [{
        item_id: article.id,
        item_name: article.title,
        item_category: article.categoryName || 'uncategorized',
        price: article.price || 0,
        currency: 'JPY',
      }],
    },
    article_slug: article.slug,
    author_name: article.authorName,
  });
}

// お気に入り追加イベント
export function trackAddToFavorite(article: {
  id: string;
  title: string;
  price?: number | null;
}) {
  pushEvent('add_to_wishlist', {
    ecommerce: {
      items: [{
        item_id: article.id,
        item_name: article.title,
        price: article.price || 0,
        currency: 'JPY',
      }],
    },
  });
}

// シェアイベント
export function trackShare(method: 'twitter' | 'facebook' | 'line' | 'copy', content: {
  id: string;
  title: string;
}) {
  pushEvent('share', {
    method,
    content_type: 'article',
    item_id: content.id,
    content_id: content.title,
  });
}

// 検索イベント
export function trackSearch(searchTerm: string, resultsCount?: number) {
  pushEvent('search', {
    search_term: searchTerm,
    results_count: resultsCount,
  });
}

// カテゴリ閲覧イベント
export function trackCategoryView(category: {
  id: string;
  name: string;
  slug: string;
}) {
  pushEvent('view_item_list', {
    item_list_id: category.id,
    item_list_name: category.name,
  });
}

// フォローイベント
export function trackFollow(authorId: string, authorName: string) {
  pushEvent('follow', {
    author_id: authorId,
    author_name: authorName,
  });
}

// 記事作成開始イベント
export function trackStartWriting() {
  pushEvent('begin_checkout', {
    content_type: 'article_creation',
  });
}

// 記事公開イベント
export function trackPublishArticle(article: {
  id: string;
  title: string;
  price?: number | null;
}) {
  pushEvent('publish_article', {
    article_id: article.id,
    article_title: article.title,
    is_paid: (article.price || 0) > 0,
  });
}
