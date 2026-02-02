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
1. Claude Codeでコード修正
2. `dist`フォルダをzip圧縮
3. シンレンタルサーバーのファイルマネージャーでアップロード・置き換え

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
| profiles | プロフィール |
| stripe_webhook_events | Stripe Webhookイベント |
| subscriptions | サブスクリプション |
| transfers | 振込 |
| user_balance_summary | ユーザー残高サマリー（View） |
| user_earnings_summary | ユーザー収益サマリー（View） |
| user_follows | ユーザーフォロー |
| users | ユーザー |
| withdraw_requests | 出金リクエスト |

---

## 注意事項
- サービスロールキー・Webhook署名シークレットは機密情報です
- Stripe連携があるため、決済関連の変更は慎重に
- デプロイ前に必ずローカルで動作確認すること

---

最終更新: 2026年1月27日
