<?php
/**
 * GrayMall RSSフィード生成
 */

// Supabase 設定
define('SUPABASE_URL', 'https://wjvccdnyhfdcmsrcjysc.supabase.co');
define('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqdmNjZG55aGZkY21zcmNqeXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNDQ5OTYsImV4cCI6MjA4MTcyMDk5Nn0.sCdj1IL6b6b0mVYbWcBIUvHd4ljXHpbiFWLrF2b3s6A');
define('SITE_URL', 'https://graymall.jp');
define('SITE_TITLE', 'グレーモール');
define('SITE_DESCRIPTION', 'グレーモールは、個人の体験談やノウハウを販売・購入できるデジタルコンテンツマーケットプレイスです。');

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
 * HTMLタグを除去
 */
function stripHtmlTags($html) {
    return trim(strip_tags($html ?? ''));
}

// 最新20件の公開済み記事を取得
$articles = supabaseQuery('articles', [
    'select' => 'id,title,slug,excerpt,cover_image_url,published_at,author_id',
    'status' => 'eq.published',
    'is_archived' => 'eq.false',
    'order' => 'published_at.desc',
    'limit' => 20,
]);

// XMLヘッダーを出力
header('Content-Type: application/rss+xml; charset=utf-8');
header('Cache-Control: public, max-age=1800'); // 30分キャッシュ

$now = gmdate('D, d M Y H:i:s') . ' GMT';

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">' . "\n";
echo '  <channel>' . "\n";
echo '    <title>' . xmlEscape(SITE_TITLE) . '</title>' . "\n";
echo '    <link>' . SITE_URL . '</link>' . "\n";
echo '    <description>' . xmlEscape(SITE_DESCRIPTION) . '</description>' . "\n";
echo '    <language>ja</language>' . "\n";
echo '    <lastBuildDate>' . $now . '</lastBuildDate>' . "\n";
echo '    <atom:link href="' . SITE_URL . '/rss" rel="self" type="application/rss+xml"/>' . "\n";
echo '    <image>' . "\n";
echo '      <url>' . SITE_URL . '/logo.png</url>' . "\n";
echo '      <title>' . xmlEscape(SITE_TITLE) . '</title>' . "\n";
echo '      <link>' . SITE_URL . '</link>' . "\n";
echo '    </image>' . "\n";

foreach ($articles as $article) {
    $articleUrl = SITE_URL . '/articles/' . $article['slug'];
    $pubDate = isset($article['published_at'])
        ? gmdate('D, d M Y H:i:s', strtotime($article['published_at'])) . ' GMT'
        : $now;

    echo '    <item>' . "\n";
    echo '      <title>' . xmlEscape($article['title']) . '</title>' . "\n";
    echo '      <link>' . $articleUrl . '</link>' . "\n";
    echo '      <guid isPermaLink="true">' . $articleUrl . '</guid>' . "\n";
    echo '      <pubDate>' . $pubDate . '</pubDate>' . "\n";

    if (!empty($article['excerpt'])) {
        $description = mb_substr(stripHtmlTags($article['excerpt']), 0, 300);
        echo '      <description>' . xmlEscape($description) . '</description>' . "\n";
    }

    if (!empty($article['cover_image_url'])) {
        echo '      <media:content url="' . xmlEscape($article['cover_image_url']) . '" medium="image"/>' . "\n";
        echo '      <enclosure url="' . xmlEscape($article['cover_image_url']) . '" type="image/jpeg" length="0"/>' . "\n";
    }

    echo '    </item>' . "\n";
}

echo '  </channel>' . "\n";
echo '</rss>' . "\n";
