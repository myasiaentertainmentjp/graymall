<?php
/**
 * GrayMall SEO プリレンダリング
 *
 * このファイルはすべてのリクエストを処理し、
 * 動的にメタタグを設定したHTMLを返します。
 */

// Supabase 設定
define('SUPABASE_URL', 'https://wjvccdnyhfdcmsrcjysc.supabase.co');
define('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqdmNjZG55aGZkY21zcmNqeXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNDQ5OTYsImV4cCI6MjA4MTcyMDk5Nn0.sCdj1IL6b6b0mVYbWcBIUvHd4ljXHpbiFWLrF2b3s6A');
define('SITE_URL', 'https://graymall.jp');
define('SITE_NAME', 'グレーモール');
define('DEFAULT_DESCRIPTION', 'グレーモールは、個人の体験談やノウハウを販売・購入できるデジタルコンテンツマーケットプレイスです。');
define('DEFAULT_OGP_IMAGE', SITE_URL . '/ogp-default.png');

/**
 * Supabase REST API を呼び出す
 */
function supabaseQuery($table, $params = []) {
    $url = SUPABASE_URL . '/rest/v1/' . $table;

    if (!empty($params)) {
        $url .= '?' . http_build_query($params);
    }

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'apikey: ' . SUPABASE_ANON_KEY,
            'Authorization: Bearer ' . SUPABASE_ANON_KEY,
            'Content-Type: application/json',
        ],
        CURLOPT_TIMEOUT => 10,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        return null;
    }

    return json_decode($response, true);
}

/**
 * 記事データを取得
 */
function getArticleBySlug($slug) {
    $result = supabaseQuery('articles', [
        'slug' => 'eq.' . $slug,
        'status' => 'eq.published',
        'select' => 'id,title,excerpt,cover_image_url,slug,author_id,published_at,primary_category_id',
        'limit' => 1,
    ]);

    if (!empty($result) && isset($result[0])) {
        $article = $result[0];

        // 著者情報を取得
        $author = supabaseQuery('users', [
            'id' => 'eq.' . $article['author_id'],
            'select' => 'display_name,email',
            'limit' => 1,
        ]);

        if (!empty($author) && isset($author[0])) {
            $article['author'] = $author[0];
        }

        return $article;
    }

    return null;
}

/**
 * ユーザーデータを取得
 */
function getUserById($id) {
    $result = supabaseQuery('users', [
        'id' => 'eq.' . $id,
        'select' => 'id,display_name,email,bio,avatar_url',
        'limit' => 1,
    ]);

    return !empty($result) && isset($result[0]) ? $result[0] : null;
}

/**
 * HTMLエスケープ
 */
function e($str) {
    return htmlspecialchars($str ?? '', ENT_QUOTES, 'UTF-8');
}

/**
 * カテゴリ情報を取得
 */
function getCategoryById($id) {
    $result = supabaseQuery('categories', [
        'id' => 'eq.' . $id,
        'select' => 'id,name,slug',
        'limit' => 1,
    ]);
    return !empty($result) && isset($result[0]) ? $result[0] : null;
}

/**
 * メタタグ情報を取得
 */
function getMetaTags($uri) {
    $meta = [
        'title' => SITE_NAME . ' - デジタルコンテンツマーケットプレイス',
        'description' => DEFAULT_DESCRIPTION,
        'ogType' => 'website',
        'ogImage' => DEFAULT_OGP_IMAGE,
        'canonicalUrl' => SITE_URL . $uri,
        'jsonLd' => null,
        'breadcrumbs' => null,
    ];

    // 記事ページ: /articles/{slug}
    if (preg_match('#^/articles/([^/]+)$#', $uri, $matches)) {
        $slug = $matches[1];
        $article = getArticleBySlug($slug);

        if ($article) {
            $authorName = $article['author']['display_name'] ?? $article['author']['email'] ?? '不明';
            $meta['title'] = $article['title'] . ' | ' . SITE_NAME;
            $meta['description'] = mb_substr(strip_tags($article['excerpt']), 0, 150);
            $meta['ogType'] = 'article';
            $meta['ogImage'] = $article['cover_image_url'] ?: DEFAULT_OGP_IMAGE;
            $meta['authorName'] = $authorName;
            $meta['publishedAt'] = $article['published_at'];

            // カテゴリ情報を取得
            $category = null;
            if (!empty($article['primary_category_id'])) {
                $category = getCategoryById($article['primary_category_id']);
            }

            // JSON-LD 構造化データ（Article）
            $meta['jsonLd'] = [
                '@context' => 'https://schema.org',
                '@type' => 'Article',
                'headline' => $article['title'],
                'description' => $meta['description'],
                'image' => $meta['ogImage'],
                'datePublished' => $article['published_at'],
                'author' => [
                    '@type' => 'Person',
                    'name' => $authorName,
                    'url' => SITE_URL . '/users/' . $article['author_id'],
                ],
                'publisher' => [
                    '@type' => 'Organization',
                    'name' => SITE_NAME,
                    'url' => SITE_URL,
                ],
                'mainEntityOfPage' => [
                    '@type' => 'WebPage',
                    '@id' => $meta['canonicalUrl'],
                ],
            ];

            // パンくずリスト構造化データ
            $breadcrumbItems = [
                ['name' => 'ホーム', 'url' => SITE_URL . '/'],
            ];
            if ($category) {
                $breadcrumbItems[] = ['name' => $category['name'], 'url' => SITE_URL . '/articles?category=' . $category['slug']];
            } else {
                $breadcrumbItems[] = ['name' => '記事一覧', 'url' => SITE_URL . '/articles'];
            }
            $breadcrumbItems[] = ['name' => $article['title'], 'url' => $meta['canonicalUrl']];

            $meta['breadcrumbs'] = [
                '@context' => 'https://schema.org',
                '@type' => 'BreadcrumbList',
                'itemListElement' => array_map(function($item, $index) {
                    return [
                        '@type' => 'ListItem',
                        'position' => $index + 1,
                        'name' => $item['name'],
                        'item' => $item['url'],
                    ];
                }, $breadcrumbItems, array_keys($breadcrumbItems)),
            ];
        }
    }

    // ユーザーページ: /users/{id}
    elseif (preg_match('#^/users/([^/]+)$#', $uri, $matches)) {
        $userId = $matches[1];
        $user = getUserById($userId);

        if ($user) {
            $displayName = $user['display_name'] ?: $user['email'];
            $meta['title'] = $displayName . 'のプロフィール | ' . SITE_NAME;
            $meta['description'] = $user['bio'] ?: ($displayName . 'さんのプロフィールページです。');
            $meta['ogType'] = 'profile';
            $meta['ogImage'] = $user['avatar_url'] ?: DEFAULT_OGP_IMAGE;
        }
    }

    // 記事一覧ページ: /articles
    elseif ($uri === '/articles' || strpos($uri, '/articles?') === 0) {
        $meta['title'] = '記事一覧 | ' . SITE_NAME;
        $meta['description'] = SITE_NAME . 'の記事一覧ページです。様々なジャンルのデジタルコンテンツを探すことができます。';
    }

    // 固定ページ
    $staticPages = [
        '/terms' => ['title' => '利用規約', 'description' => SITE_NAME . 'の利用規約です。'],
        '/privacy' => ['title' => 'プライバシーポリシー', 'description' => SITE_NAME . 'のプライバシーポリシーです。'],
        '/law' => ['title' => '特定商取引法に基づく表記', 'description' => SITE_NAME . 'の特定商取引法に基づく表記です。'],
        '/guidelines' => ['title' => 'ガイドライン', 'description' => SITE_NAME . 'のコンテンツガイドラインです。'],
        '/faq' => ['title' => 'よくある質問', 'description' => SITE_NAME . 'のよくある質問と回答です。'],
        '/contact' => ['title' => 'お問い合わせ', 'description' => SITE_NAME . 'へのお問い合わせページです。'],
        '/company' => ['title' => '運営会社', 'description' => SITE_NAME . 'の運営会社情報です。'],
        '/signin' => ['title' => 'ログイン', 'description' => SITE_NAME . 'にログインしてデジタルコンテンツを購入・販売しましょう。'],
        '/signup' => ['title' => '新規登録', 'description' => SITE_NAME . 'に新規登録してデジタルコンテンツを購入・販売しましょう。'],
    ];

    if (isset($staticPages[$uri])) {
        $meta['title'] = $staticPages[$uri]['title'] . ' | ' . SITE_NAME;
        $meta['description'] = $staticPages[$uri]['description'];
    }

    return $meta;
}

/**
 * HTMLを生成
 */
function generateHtml($meta) {
    $title = e($meta['title']);
    $description = e($meta['description']);
    $ogType = e($meta['ogType']);
    $ogImage = e($meta['ogImage']);
    $canonicalUrl = e($meta['canonicalUrl']);
    $siteName = e(SITE_NAME);

    // アセットタグを取得
    $assets = getAssetTags();
    $cssTag = $assets['css'];
    $jsTag = $assets['js'];

    // 記事ページ用の追加メタタグ
    $articleMeta = '';
    if ($ogType === 'article' && isset($meta['publishedAt'])) {
        $articleMeta = '
    <meta property="article:published_time" content="' . e($meta['publishedAt']) . '" />
    <meta property="article:author" content="' . e($meta['authorName'] ?? '') . '" />';
    }

    // JSON-LD 構造化データ
    $jsonLdScript = '';
    if (!empty($meta['jsonLd'])) {
        $jsonLdScript .= '
    <script type="application/ld+json">' . json_encode($meta['jsonLd'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . '</script>';
    }
    if (!empty($meta['breadcrumbs'])) {
        $jsonLdScript .= '
    <script type="application/ld+json">' . json_encode($meta['breadcrumbs'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . '</script>';
    }

    return <<<HTML
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-NR4W6W6V');</script>
    <!-- End Google Tag Manager -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{$title}</title>
    <meta name="description" content="{$description}" />

    <!-- OGP -->
    <meta property="og:type" content="{$ogType}" />
    <meta property="og:site_name" content="{$siteName}" />
    <meta property="og:title" content="{$title}" />
    <meta property="og:description" content="{$description}" />
    <meta property="og:image" content="{$ogImage}" />
    <meta property="og:url" content="{$canonicalUrl}" />
    <meta property="og:locale" content="ja_JP" />{$articleMeta}

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{$title}" />
    <meta name="twitter:description" content="{$description}" />
    <meta name="twitter:image" content="{$ogImage}" />

    <!-- Canonical -->
    <link rel="canonical" href="{$canonicalUrl}" />{$jsonLdScript}

    <!-- Preload -->
    <link rel="preconnect" href="https://wjvccdnyhfdcmsrcjysc.supabase.co" />

    <!-- Google Fonts: Noto Sans JP -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap" rel="stylesheet">

    <!-- Assets -->
    {$cssTag}
  </head>
  <body>
    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NR4W6W6V"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->
    <div id="root"></div>
    {$jsTag}
  </body>
</html>
HTML;
}

/**
 * ビルドされたアセットファイルを検出
 */
function getAssetTags() {
    $assetsDir = __DIR__ . '/assets';
    $cssTag = '';
    $jsTag = '';

    if (is_dir($assetsDir)) {
        $files = scandir($assetsDir);
        foreach ($files as $file) {
            if (preg_match('/^index-.*\.css$/', $file)) {
                $cssTag = '<link rel="stylesheet" href="/assets/' . $file . '" />';
            }
            if (preg_match('/^index-.*\.js$/', $file)) {
                $jsTag = '<script type="module" src="/assets/' . $file . '"></script>';
            }
        }
    }

    // フォールバック
    if (empty($cssTag)) {
        $cssTag = '<link rel="stylesheet" href="/assets/index.css" />';
    }
    if (empty($jsTag)) {
        $jsTag = '<script type="module" src="/assets/index.js"></script>';
    }

    return ['css' => $cssTag, 'js' => $jsTag];
}

// メイン処理
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 静的ファイルの場合はそのまま返す（.htaccessで除外されるが念のため）
$staticExtensions = ['js', 'css', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp', 'woff', 'woff2', 'ttf', 'eot', 'map'];
$ext = pathinfo($uri, PATHINFO_EXTENSION);
if (in_array(strtolower($ext), $staticExtensions)) {
    return false;
}

// メタタグを取得してHTMLを生成
$meta = getMetaTags($uri);
echo generateHtml($meta);
