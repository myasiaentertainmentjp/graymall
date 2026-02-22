# Grey Mall（グレーモール）プロジェクト資料
## Claude Code作業用リファレンス

**※この資料に記載されている内容（テーブル構成、カテゴリ、Stripe情報、機能など）に変更があった場合は、作業完了時にこの資料も併せて更新してください。**

---

## サービス概要

**「合法だが表で語りにくい」ビジネスノウハウのコンテンツプラットフォーム**

| 項目 | 内容 |
|------|------|
| サービス名 | Grey Mall（グレーモール） |
| 運営 | MyAsia Entertainment LLC |
| コンセプト | 名前を出さず、実績も語らず、結果と手順だけを売る場所 |

### Brain/noteとの差別化
| 項目 | Brain/note | Grey Mall |
|------|-----------|-----------|
| 売り方 | 自己ブランディング込み | 完全匿名、手順と結果のみ |
| コンテンツ | 公開して問題ないノウハウ | 表で語ると炎上・BAN・信用毀損するもの |
| ターゲット | 賢くなりたい人 | ズルく勝ちたい人 |
| 審査 | 規約厳しい | 違法以外OK |

### 取り扱いカテゴリ
1. **アダルトビジネス**：運営ノウハウ、集客、マネタイズ
2. **アカウント・プラットフォーム運用**：BAN回避、複数垢運用、シャドウバン対策
3. **金・集客・アルゴリズム攻略**：SNSアルゴリズム、広告審査通過、アフィリエイト
4. **マネー・債務・サバイバル**：債務整理、税金対策
5. **夜職・グレー業界の経営**：風俗・キャバ運営、パパ活ビジネス化
6. **スピリチュアル**：占いビジネスの集客・運営ノウハウ

### 扱わないもの
- 違法行為（詐欺、薬物、児童関連）
- 特定個人への攻撃・晒し
- 「絶対儲かる」系の投資
- 初心者向け入門コンテンツ
- 思想・ポエム・自己啓発

### 収益モデル
- 運営手数料：10%
- アフィリエイト報酬：0〜50%（出品者が設定）
- 残り：出品者

---

## 技術スタック
- **フロントエンド**: bolt new
- **データベース**: Supabase
- **サーバー**: シンレンタルサーバー（Xserver）
- **決済**: Stripe（本番環境）

---

## デプロイ方法

### ビルド
```bash
npm run build
```
→ `dist` フォルダに出力される

### アップロード
1. `/Users/koji/graymall-work/dist` フォルダの中身を全て
2. シンレンタルサーバーのファイルマネージャーでアップロード・置き換え

### Git管理
```bash
git add -A
git commit -m "変更内容"
git push origin main
```
※ Boltが自動デプロイする場合もあるが、レンタルサーバーへは手動アップロード必要

---

## Supabase Storage

| バケット名 | 用途 |
|-----------|------|
| article-images | 記事画像・著者アバター |

### アップロードパス例
- 記事画像: `articles/{article_id}/{timestamp}-{random}.{ext}`
- 著者アバター: `author-avatars/{timestamp}-{random}.{ext}`

---

## Supabase情報

| 項目 | 値 |
|------|-----|
| プロジェクトURL | `https://wjvccdnyhfdcmsrcjysc.supabase.co` |
| Project ID | `wjvccdnyhfdcmsrcjysc` |
| サービスロールキー | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqdmNjZG55aGZkY21zcmNqeXNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE0NDk5NiwiZXhwIjoyMDgxNzIwOTk2fQ.85RYLm2bmkPLOE0molvx3dJAMwtDHmkAJnzNimTQ2Vo` |

---

## Stripe情報（本番環境）

| 項目 | 値 |
|------|-----|
| モード | 本番（Live） |
| Webhook URL | `https://wjvccdnyhfdcmsrcjysc.supabase.co/functions/v1/stripe-webhook` |
| Webhook署名シークレット | `whsec_iw0rmPGEjBYAlLF6wVS5IG2h5i8CG7uw` |
| APIバージョン | 2025-12-15.clover |

### リッスン対象イベント（5件）
- `charge.refunded`
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.deleted`
- `customer.subscription.updated`

---

## テーブル構成

| テーブル名 | 備考 |
|-----------|------|
| ad_banners | 広告バナー |
| admin_users | 管理者ユーザー |
| affiliate_clicks | アフィリエイトクリック |
| affiliate_conversions | アフィリエイトコンバージョン |
| affiliate_dashboard | アフィリエイトダッシュボード（View） |
| affiliate_rate_changes | アフィリエイト料率変更 |
| article_comments | 記事コメント |
| article_favorites | 記事お気に入り |
| article_likes | 記事いいね |
| article_views | 記事閲覧数 |
| articles | 記事コンテンツ |
| **author_profiles** | **著者プロフィール（表示用）** |
| author_dashboard | 著者ダッシュボード（View） |
| auto_likes_processed | 自動いいね処理【UNRESTRICTED】 |
| categories | カテゴリ |
| favorites | お気に入り |
| follows | フォロー |
| homepage_section_articles | トップページセクション記事 |
| homepage_sections | トップページセクション【UNRESTRICTED】 |
| ledger_entries | 台帳エントリー |
| notifications | 通知 |
| orders | 注文 |
| payouts | 支払い |
| profiles | プロフィール（ユーザーアカウント） |
| stripe_webhook_events | Stripe Webhookイベント |
| subscriptions | サブスクリプション |
| transfers | 振込 |
| user_balance_summary | ユーザー残高サマリー（View） |
| user_earnings_summary | ユーザー収益サマリー（View） |
| user_follows | ユーザーフォロー |
| users | ユーザー |
| withdraw_requests | 出金リクエスト |

---

## 著者システム（重要）

Grey Mallでは**2つの著者システム**が存在する。

### 1. profiles（実ユーザー）
- `author_id` カラムで紐付け
- 実際にログインして記事を作成したユーザー
- 管理者が一括で記事を作成した場合、全記事の `author_id` は管理者になる

### 2. author_profiles（表示用プロフィール）
- `author_profile_id` カラムで紐付け
- フロントエンドで表示する著者情報
- 管理画面（`/admin/authors`）から管理可能
- **実際の投稿者とは別の著者として表示できる**

### フロントエンドでの使い分け
```typescript
// クエリ例
.select(`
  *,
  users:author_id (display_name, email, avatar_url),
  author_profile:author_profile_id (id, display_name, avatar_url),
  primary_category:primary_category_id (id, name, slug)
`)

// 表示優先度: author_profile > users
const authorName = article.author_profile?.display_name || article.users?.display_name;
```

### リンク先
- `author_profile_id` がある場合: `/authors/{author_profile_id}`
- ない場合: `/users/{author_id}`

### author_profilesテーブル構造
| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid | 主キー |
| display_name | text | 表示名 |
| avatar_url | text | アバター画像URL |
| bio | text | 自己紹介文 |
| created_at | timestamp | 作成日時 |

### 登録済み著者プロフィール（10名）
| 表示名 | 自己紹介 |
|--------|----------|
| りょう🔥古着と銭 | 古着転売→実店舗出して爆死→今は出張買取で復活。川口在住。フランチャイズだけは絶対やめとけ。 |
| なつみ｜副業OL | 横浜の事務職OL。中国輸入×メルカリで副業してます。最初に仕入れたスマホケース300個がまだ家にあります。 |
| はるか📎元・税務署の人 | 国税専門官を5年やって辞めました。今はフリーランスの経理代行をしています。副業の確定申告と税務調査の話が専門です。「20万以下は申告不要」は半分ウソです。 |
| しんじ | （プロフィールなし） |
| だいき🍛キッチンカーの人 | カレーのキッチンカーやってます。八王子あたりで見かけたら買ってください。 |
| ゆか🫧元エステ店長 | 自宅サロン3ヶ月で潰しました。大手エステの店長時代に見た高額商材の押し売りが忘れられません。今は業務委託で3店舗掛け持ち中。 |
| こうた｜FC被害者の会 | 買取フランチャイズに200万払って1年で辞めた。 |
| まさと💀500万溶かした人 | 仮想通貨に貯金全部突っ込んで全部溶かしました。あの時の自分をぶん殴りたい。福岡でWeb制作しながら借金返済中。 |
| けんた🎸→🤖 | バンド6年やって月収8万だった。今はAI作曲。 |
| さや🖌️ | 手描きイラストレーターです。AIを使い始めたらTwitterで炎上してフォロワー半分になりました。でも後悔はしてないです。 |

### よく使うSQL

```sql
-- 著者プロフィール一覧取得
SELECT id, display_name, bio FROM author_profiles;

-- 記事に著者プロフィールを紐付け
UPDATE articles
SET author_profile_id = '{author_profile_id}'
WHERE id = '{article_id}';

-- 著者プロフィールのbio更新
UPDATE author_profiles
SET bio = '自己紹介文'
WHERE id = '{id}';

-- 特定著者の記事数確認
SELECT ap.display_name, COUNT(a.id) as article_count
FROM author_profiles ap
LEFT JOIN articles a ON a.author_profile_id = ap.id
GROUP BY ap.id, ap.display_name;
```

---

## ルーティング構成

### 公開ページ
| パス | コンポーネント | 説明 |
|------|---------------|------|
| `/` | Home | トップページ |
| `/articles` | ArticleList | 記事一覧 |
| `/articles/:slug` | ArticleDetail | 記事詳細 |
| `/users/:id` | UserProfile | ユーザープロフィール（実ユーザー） |
| `/authors/:id` | AuthorProfile | 著者プロフィール（表示用） |
| `/signin` | SignIn | ログイン |
| `/signup` | SignUp | 新規登録 |

### 認証必須ページ
| パス | コンポーネント | 説明 |
|------|---------------|------|
| `/me/articles` | MyArticles | 自分の記事一覧 |
| `/me/liked` | LikedArticles | いいねした記事 |
| `/me/purchased` | PurchasedArticles | 購入した記事 |
| `/me/favorites` | FavoriteArticles | お気に入り記事 |
| `/me/recent` | RecentArticles | 最近見た記事 |
| `/me/following` | FollowingUsers | フォロー中のユーザー |
| `/editor/new` | Editor | 新規記事作成 |
| `/editor/:id` | Editor | 記事編集 |
| `/preview/:id` | PreviewArticle | 記事プレビュー |
| `/publish/:id` | PublishConfirm | 公開確認 |
| `/dashboard` | SalesManagement | 売上管理 |
| `/settings` | Settings | 設定 |
| `/profile` | Profile | プロフィール編集 |

### 管理者専用ページ
| パス | コンポーネント | 説明 |
|------|---------------|------|
| `/admin` | AdminDashboard | 管理ダッシュボード |
| `/admin/review/:id` | AdminReviewArticle | 記事審査 |
| `/admin/homepage` | AdminHomepageManager | トップページ管理 |
| `/admin/article/:id` | AdminArticleEdit | 記事編集（管理者） |
| `/admin/authors` | AdminAuthorProfiles | 著者プロフィール管理 |

---

## 主要コンポーネント

### ArticleCard.tsx
記事カード表示。著者情報は `author_profile` を優先表示。

```typescript
// 著者名の取得優先度
1. article.author_profile?.display_name
2. article.users?.display_name
3. article.users?.email.split('@')[0]
4. '著者不明'

// リンク先
article.author_profile?.id
  ? `/authors/${article.author_profile.id}`
  : `/users/${article.author_id}`
```

### ArticleDetail.tsx
記事詳細ページ。有料部分は `<!-- paid -->` デリミタで区切る。

### Editor.tsx
TipTapベースのリッチテキストエディタ。
- 有料エリア設定と販売設定は連動
- `showPaidBoundary` と `isPaid` は同期する

---

## 注意事項
- サービスロールキー・Webhook署名シークレットは機密情報です
- Stripe連携があるため、決済関連の変更は慎重に
- デプロイ前に必ずローカルで動作確認すること
- **author_profile_id と author_id を混同しないこと**

---

## 更新履歴

### 2026年2月3日
**ダークモード削除・テーブル機能改善・UI調整**

#### ダークモード完全削除
- `ThemeContext.tsx` を削除
- 全コンポーネントから `dark:` クラスを削除
- ヘッダーのダークモード切替ボタンを削除
- `tailwind.config.js` から `darkMode: 'class'` を削除
- `index.css` からダークモードスタイルを削除
- note.com/Brainと同様にライトモードのみに統一

#### テーブル（表）機能の実装・改善
- TipTap Table拡張を追加（`@tiptap/extension-table`, `table-row`, `table-header`, `table-cell`）
- エディタの＋メニューから「表（テーブル）」を挿入可能に
- テーブル編集ツールバーを実装:
  - `← (Undo)`: 元に戻す
  - `+ 行`: 行を追加
  - `+ 列`: 列を追加
- テーブル内クリックだけでツールバー表示（テキスト選択不要）
- モバイル対応: テーブル内で専用ツールバーに切り替わる
- プレビュー画面にも `article-content` クラスを追加（編集画面と同じテーブルスタイルを適用）

#### フォントサイズのレスポンシブ対応
- 記事詳細ページ: モバイル16px（prose）、PC18px（prose-lg）に変更
- プレビューページも同様に対応

#### エディタUI改善
- サイドバー展開ボタンを固定表示に変更
  - 左サイドバー（目次）閉じ時: 画面左端に `>` ボタン（黒背景・白アイコン）
  - 右サイドバー（設定）閉じ時: 画面右端に `<` ボタン（黒背景・白アイコン）
  - スクロールしても常に表示される

#### その他
- ArticleCardの価格表示エリアを固定高さに（カード高さの統一）
- Homeページのカテゴリ別記事表示を4件→8件に変更

### 2026年2月3日（追加）
**赤文字機能・テーブルスタイル調整・パフォーマンス改善・その他**

#### エディタ: 赤文字機能
- `@tiptap/extension-color` を追加
- フローティングツールバーに赤色ボタン（A）を追加
- モバイルツールバーにも同様のボタンを追加
- テキスト選択 → ボタンクリックで赤文字に、再度クリックで解除

#### テーブルスタイル調整
- セルのpadding: `1rem 1.25rem` → `0.5rem 0.75rem`（約半分に縮小）
- フォントサイズ: `0.9rem` → `0.875rem`
- 行間: `1.7` → `1.5`
- エディタ内テーブルも同様に調整

#### パフォーマンス改善
- **画像の優先読み込み**: 最初の4枚は `loading="eager"` + `fetchPriority="high"`
- **DBクエリ削減**: ArticleCardに `skipDbQuery` propを追加、一覧ページでN+1クエリを回避
- **Home.tsxのN+1クエリ修正**: `fetchHomepageSections`を2クエリに最適化

#### スケルトンローディング
- 記事詳細ページのローディング状態をスピナーからスケルトンに変更
- `SkeletonArticleDetail` コンポーネントを追加

#### 404ページ改善
- `NotFound.tsx` を新規作成
- ユーザーフレンドリーなデザインに改善（トップへ、記事を探す、戻るボタン）

#### アクセシビリティ改善
- Layout.tsx: 「本文へスキップ」リンクを追加
- `<main>` に `id="main-content"` と `role="main"` を追加
- ArticleCardのいいねボタンに `aria-label` と `aria-pressed` を追加
- アバター画像に適切な `alt` テキストを追加

#### PWA対応
- `manifest.json` を追加（ホーム画面への追加対応）
- `sw.js`（Service Worker）を追加（静的アセットのキャッシュ）
- `index.php` にPWA関連のmetaタグを追加

### 2026年2月14日
**著者プロフィールシステム実装・バグ修正**

#### 著者プロフィール機能
- `AuthorProfile.tsx` 新規作成（`/authors/:id` ルート）
- `author_profiles` テーブルを使った表示用著者システム
- ArticleCard、ArticleDetailの著者リンクを `author_profile_id` 対応
  - `author_profile_id` がある場合 → `/authors/{id}`
  - ない場合 → `/users/{author_id}`（従来通り）
- 管理画面から著者プロフィール管理可能（`/admin/authors`）

#### クエリ修正
以下のファイルで `author_profile:author_profile_id` を追加：
- Home.tsx
- ArticleCard.tsx
- ArticleList.tsx
- ArticleDetail.tsx
- RecentArticles.tsx
- PurchasedArticles.tsx
- LikedArticles.tsx
- FavoriteArticles.tsx
- UserProfile.tsx

#### バグ修正
- 管理画面の著者アバターアップロードエラー修正
  - 原因: テンプレートリテラルのエスケープ（`\${}`）
  - 修正: `AdminAuthorProfiles.tsx` line 88

#### エディタ改善
- 有料エリア設定（左の＋ボタン）と販売設定（右サイドバー）を連動
  - 有料エリア表示 → 自動で「有料」に設定
  - 無料に変更 → 有料エリア非表示

#### 公開確認画面
- タグ表示を追加
- アフィリエイト設定の表示を追加

### 2026年2月21日
**URLリンクプレビュー機能・トップページ改善・フッター修正**

#### URLリンクプレビュー（OGPカード）機能
- Edge Function `fetch-ogp` を新規作成（OGPメタタグを解析してデータ取得）
- TipTap拡張 `LinkPreview` を新規作成（`src/components/editor/extensions/LinkPreview.tsx`）
- エディタでURL（YouTube以外）をペースト時に自動でOGPカードを生成
- リンクカードにはタイトル、説明、サムネイル画像、サイト名、faviconを表示
- `index.css` にリンクプレビューカードのスタイルを追加
- **既存記事のURL自動変換**: `LinkCardRenderer.tsx` を追加
  - 記事表示時に既存のURLリンクを検出してOGPカードに自動変換
  - 単独行のリンク（リンクテキストがURL）のみをカードに変換
  - OGPデータはクライアント側でキャッシュ

#### トップページ改善
- 記事取得のlimitを100件→500件に増加
- 子カテゴリに紐付けられた記事も親カテゴリのセクションに表示されるように修正
- `fetchAllCategories` 関数を追加、親子カテゴリの関係を考慮した記事フィルタリング

#### フッター修正
- カタカナ「グレーモール」をロゴ画像（`/logo.png`）に置き換え

### 2026年2月22日
**OGPカードコンパクト化・エディタモバイル改善・リスト間隔調整**

#### OGPリンクプレビューカードのコンパクト化
- カード全体のマージン縮小（`my-4` → `my-3`）
- 画像サイズ縮小: 140x100px → 100x70px
- タイトル・説明文を1行表示に変更（`line-clamp-1`）
- フォントサイズ縮小（タイトル: `text-xs`、説明: `text-[10px]`）
- パディング縮小（`p-3` → `px-3 py-2`）
- favicon サイズ縮小（`w-4 h-4` → `w-3 h-3`）

#### エディタのモバイル対応改善
- 左余白をモバイルで縮小（`pl-12` → `pl-4 sm:pl-12`）
- ドロップダウンメニュー（見出し/リスト/配置）をスクロール領域外に移動
  - `absolute bottom-full left-1/2 -translate-x-1/2` で常に表示
- 見出しボタンに現在の状態を表示（「本文」「見出し大」「見出し小」）
- h1タグを無効化し、h2/h3のみ使用可能に（`heading: { levels: [2, 3] }`）

#### リスト項目の間隔調整
- ProseMirror内のリスト項目の余白を削除（`margin: 0; line-height: 1.5`）
- リスト全体の余白を調整（`margin: 0.5rem 0`）

#### 画像処理
- 画像貼り付け時の自動処理を確認済み:
  - WebP変換: 品質85%
  - リサイズ: 最大幅1200px
  - GIFは非サポート（アラート表示）
  - 外部画像はEdge Function経由で取得・変換

#### SPA対応
- `public/_redirects` 追加（Netlify用）
- `vercel.json` 追加（Vercel用）

#### コンソールログ削除
- `AuthContext.tsx`、`EnhancedRichTextEditor.tsx`、`main.tsx` からデバッグログを削除

---

最終更新: 2026年2月22日
