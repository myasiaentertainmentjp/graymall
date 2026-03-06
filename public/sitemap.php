<?php
/**
 * GrayMall 動的サイトマップ生成
 *
 * 公開済み記事のURLを含むsitemap.xmlを動的に生成します。
 */

// Supabase 設定
define('SUPABASE_URL', 'https://wjvccdnyhfdcmsrcjysc.supabase.co');
define('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqdmNjZG55aGZkY21zcmNqeXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNDQ5OTYsImV4cCI6MjA4MTcyMDk5Nn0.sCdj1IL6b6b0mVYbWcBIUvHd4ljXHpbiFWLrF2b3s6A');
define('SITE_URL', 'https://graymall.jp');

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
        CURLOPT_TIMEOUT => 30,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        return [];
    }

    return json_decode($response, true) ?: [];
}

/**
 * XMLエスケープ
 */
function xmlEscape($str) {
    return htmlspecialchars($str ?? '', ENT_XML1, 'UTF-8');
}

/**
 * ISO 8601形式の日時を取得
 */
function formatDate($date) {
    if (!$date) {
        return date('c');
    }
    return date('c', strtotime($date));
}

// XMLヘッダーを出力
header('Content-Type: application/xml; charset=utf-8');
header('Cache-Control: public, max-age=3600'); // 1時間キャッシュ

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

// トップページ
echo '<url>' . "\n";
echo '  <loc>' . SITE_URL . '/</loc>' . "\n";
echo '  <changefreq>daily</changefreq>' . "\n";
echo '  <priority>1.0</priority>' . "\n";
echo '</url>' . "\n";

// 記事一覧ページ
echo '<url>' . "\n";
echo '  <loc>' . SITE_URL . '/articles</loc>' . "\n";
echo '  <changefreq>daily</changefreq>' . "\n";
echo '  <priority>0.9</priority>' . "\n";
echo '</url>' . "\n";

// 固定ページ
$staticPages = [
    ['path' => '/terms', 'priority' => '0.3', 'changefreq' => 'monthly'],
    ['path' => '/privacy', 'priority' => '0.3', 'changefreq' => 'monthly'],
    ['path' => '/law', 'priority' => '0.3', 'changefreq' => 'monthly'],
    ['path' => '/guidelines', 'priority' => '0.3', 'changefreq' => 'monthly'],
    ['path' => '/faq', 'priority' => '0.5', 'changefreq' => 'weekly'],
    ['path' => '/contact', 'priority' => '0.5', 'changefreq' => 'monthly'],
    ['path' => '/company', 'priority' => '0.3', 'changefreq' => 'monthly'],
    ['path' => '/signin', 'priority' => '0.6', 'changefreq' => 'monthly'],
    ['path' => '/signup', 'priority' => '0.6', 'changefreq' => 'monthly'],
];

foreach ($staticPages as $page) {
    echo '<url>' . "\n";
    echo '  <loc>' . SITE_URL . $page['path'] . '</loc>' . "\n";
    echo '  <changefreq>' . $page['changefreq'] . '</changefreq>' . "\n";
    echo '  <priority>' . $page['priority'] . '</priority>' . "\n";
    echo '</url>' . "\n";
}

// カテゴリページ
$categories = supabaseQuery('categories', [
    'select' => 'slug',
    'order' => 'sort_order.asc',
]);

foreach ($categories as $category) {
    if (!empty($category['slug'])) {
        echo '<url>' . "\n";
        echo '  <loc>' . SITE_URL . '/articles?category=' . xmlEscape($category['slug']) . '</loc>' . "\n";
        echo '  <changefreq>daily</changefreq>' . "\n";
        echo '  <priority>0.7</priority>' . "\n";
        echo '</url>' . "\n";
    }
}

// 公開済み記事
$articles = supabaseQuery('articles', [
    'select' => 'slug,published_at,updated_at',
    'status' => 'eq.published',
    'is_archived' => 'eq.false',
    'order' => 'published_at.desc',
    'limit' => 10000,
]);

foreach ($articles as $article) {
    if (!empty($article['slug'])) {
        $lastmod = $article['updated_at'] ?: $article['published_at'];
        echo '<url>' . "\n";
        echo '  <loc>' . SITE_URL . '/articles/' . xmlEscape($article['slug']) . '</loc>' . "\n";
        echo '  <lastmod>' . formatDate($lastmod) . '</lastmod>' . "\n";
        echo '  <changefreq>weekly</changefreq>' . "\n";
        echo '  <priority>0.8</priority>' . "\n";
        echo '</url>' . "\n";
    }
}

// ユーザーページ（記事を公開しているユーザーのみ）
$authors = supabaseQuery('articles', [
    'select' => 'author_id',
    'status' => 'eq.published',
    'is_archived' => 'eq.false',
]);

$authorIds = array_unique(array_column($authors, 'author_id'));
foreach ($authorIds as $authorId) {
    if (!empty($authorId)) {
        echo '<url>' . "\n";
        echo '  <loc>' . SITE_URL . '/users/' . xmlEscape($authorId) . '</loc>' . "\n";
        echo '  <changefreq>weekly</changefreq>' . "\n";
        echo '  <priority>0.6</priority>' . "\n";
        echo '</url>' . "\n";
    }
}

echo '</urlset>' . "\n";
