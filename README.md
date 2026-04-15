# Smart Buzzer MVP

スマホブラウザ専用の早押し Web アプリ MVP です。固定仕様に合わせて `Next.js App Router + TypeScript + Tailwind + Route Handlers` で構成しています。

## 技術スタック

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Realtime Broadcast
- Stripe Checkout / Webhook 署名検証
- Playwright

## 画面一覧

- `/` トップページ
- `/host` ホスト画面
- `/join/[code]` 参加導線
- `/room/[code]` 参加者画面
- `/pricing` 料金ページ
- `/account` 契約状況ページ

## 仕様メモ

- ホストだけログイン、参加者はゲスト参加
- 順位判定はサーバー側のみで実行
- クライアント時刻は順位判定に不使用
- 同一ラウンドで 1 位と 2 位だけ確定
- 無料プランは 4 人まで
- 有料プランで人数上限を拡張
- 課金状態はサーバー側の参加処理でも検証
- Stripe webhook では署名検証を実施

## ローカル起動

1. 依存関係を入れます。

```bash
npm install
```

2. 環境変数ファイルを作ります。

```bash
cp .env.example .env.local
```

3. `.env.local` を編集します。

- 最低限のローカル確認だけなら未設定のままでも動きます
- Supabase を使う場合は `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SERVICE_ROLE_KEY` を設定してください
- Stripe を使う場合は `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_PRO_MONTHLY` を設定してください
- ホストのパスワードログインを使う場合は `HOST_DEMO_PASSWORD` を設定してください

4. 開発サーバーを起動します。

```bash
npm run dev
```

5. ブラウザで確認します。

- [http://127.0.0.1:3000](http://127.0.0.1:3000)
- `/join/DEMO42` はダミールームとしてすぐ確認できます

## テスト

Playwright のブラウザが未導入なら先に入れます。

```bash
npx playwright install chromium
```

最小 E2E テストを実行します。

```bash
npm run test:e2e
```

## 課金まわり

- `POST /api/billing/checkout` で Stripe Checkout Session を作成
- `POST /api/stripe/webhook` で署名検証後に契約状態を反映
- ローカルでは `/account` から Pro / Free の模擬切替が可能

## Supabase Realtime Broadcast

- サーバー側の Route Handler から Supabase Realtime Broadcast に `room.sync` を送信
- クライアントは同じ topic を購読して画面を同期
- Supabase 未設定時はローカル確認のためにポーリングへフォールバック

## TODO

- 永続化: 現在はインメモリ実装なので、ルーム・参加者・契約状態を DB に保存する
- 認証: 本番用のホスト認証基盤を導入し、単一デモホスト前提を解消する
- Realtime: Supabase の Realtime Authorization / RLS を本番構成に合わせて設定する
- Billing: Stripe Customer Portal とサブスクリプション更新・解約イベントの反映を拡張する
- E2E: 複数タブでの同期と 1 位 / 2 位確定シナリオを追加する
