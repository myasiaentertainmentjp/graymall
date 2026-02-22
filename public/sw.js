// GrayMall Service Worker v2
// Enhanced with offline support, smart caching, and performance optimizations

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `graymall-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `graymall-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `graymall-images-${CACHE_VERSION}`;

// 事前キャッシュするアセット
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.png',
  '/manifest.json',
  '/logo.png',
  '/logo-white.png'
];

// キャッシュサイズ制限
const MAX_DYNAMIC_CACHE = 50;
const MAX_IMAGE_CACHE = 100;

// キャッシュサイズを制限
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    await limitCacheSize(cacheName, maxItems);
  }
}

// インストール
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// アクティベート（古いキャッシュ削除）
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith('graymall-') &&
                         key !== STATIC_CACHE &&
                         key !== DYNAMIC_CACHE &&
                         key !== IMAGE_CACHE)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// フェッチ戦略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 同一オリジンのリクエストのみ処理
  if (url.origin !== location.origin) {
    return;
  }

  // API/Supabaseリクエストはネットワークのみ
  if (url.pathname.startsWith('/rest/') ||
      url.pathname.startsWith('/functions/') ||
      url.pathname.includes('supabase')) {
    return;
  }

  // 画像: キャッシュファースト + 遅延更新
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) {
            cache.put(request, response.clone());
            limitCacheSize(IMAGE_CACHE, MAX_IMAGE_CACHE);
          }
          return response;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // JS/CSS/フォント: キャッシュファースト（ハッシュ付きなので安全）
  if (request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'font') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML/ナビゲーション: ネットワークファースト + オフラインフォールバック
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 成功したらキャッシュも更新
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, clone);
            limitCacheSize(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE);
          });
          return response;
        })
        .catch(async () => {
          // オフライン時はキャッシュから
          const cached = await caches.match(request);
          if (cached) return cached;
          // フォールバック: ホームページ
          return caches.match('/');
        })
    );
    return;
  }

  // その他: ネットワークファースト
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, clone);
            limitCacheSize(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE);
          });
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// プッシュ通知（将来用）
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/favicon.png',
    badge: '/favicon.png',
    data: data.url,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 通知クリック
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.notification.data) {
    event.waitUntil(
      clients.openWindow(event.notification.data)
    );
  }
});
