# グレーモール改善計画

作成日: 2026-03-06

## 全体スコア（改善前）
- SEO: 25/100
- パフォーマンス: 66/100
- セキュリティ: 60/100
- 機能・コード品質: 70/100

---

## Phase 1: セキュリティ・基盤（最優先）

### 1.1 XSS対策 - DOMPurify導入
- [ ] DOMPurifyインストール
- [ ] ArticleDetailClient.tsx のdangerouslySetInnerHTMLをサニタイズ
- [ ] EditorClient.tsx のURL入力バリデーション

### 1.2 エラーページ作成
- [ ] src/app/not-found.tsx 作成
- [ ] src/app/error.tsx 作成
- [ ] src/app/global-error.tsx 作成

### 1.3 エラーハンドリング改善
- [ ] alert() をトーストUIに置き換え
- [ ] エラーレスポンスの統一

---

## Phase 2: SEO改善

### 2.1 OG:Image設定
- [ ] og-image.png 作成（1200x630px）
- [ ] layout.tsx に images 追加
- [ ] 各ページのOpenGraph設定

### 2.2 動的サイトマップ
- [ ] src/app/sitemap.ts 作成
- [ ] 記事ページを動的に含める
- [ ] 著者ページを含める
- [ ] public/sitemap.xml 削除

### 2.3 JSON-LD構造化データ
- [ ] Organizationスキーマ（layout.tsx）
- [ ] Articleスキーマ（記事ページ）
- [ ] BreadcrumbListスキーマ

### 2.4 Canonical URL
- [ ] 各ページにcanonical設定
- [ ] alternates.canonical メタデータ追加

---

## Phase 3: パフォーマンス

### 3.1 img → Image コンポーネント化
- [ ] BannerCarousel.tsx
- [ ] Header.tsx
- [ ] Footer.tsx
- [ ] EditorClient.tsx（カバー画像プレビュー）
- [ ] MypageClient.tsx
- [ ] SettingsClient.tsx
- [ ] SignInClient.tsx
- [ ] ArticleDetailClient.tsx

### 3.2 N+1クエリ解消
- [ ] API Route作成: /api/articles/favorites
- [ ] ArticleCardの個別クエリを削除
- [ ] サーバーサイドで事前取得

### 3.3 動的インポート導入
- [ ] EditorClient を動的インポート
- [ ] AdminClient を動的インポート

### 3.4 Suspense fallback改善
- [ ] SkeletonCardを活用
- [ ] 各Suspenseに適切なfallback設定

---

## Phase 4: コード品質

### 4.1 フォームバリデーション
- [ ] Zodインストール
- [ ] サインインフォームにバリデーション追加
- [ ] エディターフォームにバリデーション追加

### 4.2 TypeScript型安全性
- [ ] `as any` の削除
- [ ] 適切な型定義に置き換え

### 4.3 その他
- [ ] robots.txt に /signin, /affiliate 追加
- [ ] revalidate時間の最適化

---

## 進捗状況

最終更新: 2026-03-06

### 完了した項目

#### Phase 1: セキュリティ・基盤
- [x] DOMPurifyインストール・ArticleDetailClient.tsx サニタイズ実装
- [x] EditorClient.tsx URL入力バリデーション
- [x] src/app/not-found.tsx 作成
- [x] src/app/error.tsx 作成
- [x] src/app/global-error.tsx 作成
- [x] react-hot-toastインストール
- [x] 全ファイルのalert()をtoast()に置き換え

#### Phase 2: SEO改善
- [x] layout.tsx に OG:Image 設定（metadataBase, images追加）
- [x] 記事ページに canonical URL 追加
- [x] src/app/sitemap.ts 作成（動的サイトマップ）
- [x] src/app/robots.ts 作成
- [x] public/sitemap.xml, robots.txt 削除
- [x] src/components/StructuredData.tsx 作成
- [x] layout.tsx に OrganizationSchema, WebSiteSchema 追加
- [x] 記事ページに ArticleSchema, BreadcrumbSchema 追加

#### Phase 3: パフォーマンス
- [x] Header.tsx: ロゴ・アバター画像をImage化
- [x] Footer.tsx: ロゴをImage化
- [x] ArticleDetailClient.tsx: アバター・カバー画像をImage化
- [x] EditorClient.tsx: カバー画像プレビューをImage化
- [x] MypageClient.tsx: 画像最適化
- [x] SettingsClient.tsx: 画像最適化
- [x] AuthorClient.tsx: 画像最適化
- [x] SignInClient.tsx: 画像最適化
- [x] BannerCarousel.tsx: 画像最適化

- [x] N+1クエリ解消：サーバーサイドでお気に入り数を一括取得
- [x] ArticleCard, AuthorClient, SearchClientでskipDbQuery適用

#### Phase 4: コード品質
- [x] Zodインストール
- [x] SignInClient.tsx にZodバリデーション追加
- [x] SettingsClient.tsx にZodバリデーション追加
- [x] TypeScript `as any` はSupabaseクライアントの型問題のため保留（型の再生成が必要）

### 追加改善（Phase 5）

#### セキュリティ強化
- [x] next.config.mjs にセキュリティヘッダー追加（X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy）

#### ESLint警告修正
- [x] ArticleCard.tsx: useRef でSupabaseクライアントをメモ化
- [x] ArticleDetailClient.tsx: useRef でSupabaseクライアントをメモ化
- [x] NotificationDropdown.tsx: useRef でSupabaseクライアントをメモ化
- [x] AuthContext.tsx: useRef + useCallback で依存関係を修正
- [x] 全てのESLint警告を解消

#### パフォーマンス
- [x] EditorClient を動的インポート（SSR無効化、ローディングUI追加）
- [x] AdminClient を動的インポート（ローディングUI追加）
- [x] next.config.mjs にGoogle OAuth画像のremotePatterns追加

### 残り作業
- [ ] og-image.png 作成（1200x630px）- 手動で作成が必要

### 改善完了

---

## 注意事項

- 各Phase完了後にビルドテストを行う
- セキュリティ関連は最優先で対応
- パフォーマンス改善後にPageSpeed Insightsで測定
