# Smart Buzzer MVP

スマホブラウザ専用の早押し Web アプリ MVP です。固定仕様に合わせて `Next.js App Router + TypeScript + Tailwind + Route Handlers` で構成しています。

## 技術スタック

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Realtime Broadcast
- Supabase Auth + RLS
- Stripe Checkout / Webhook 署名検証
- Playwright

## 画面一覧

- `/` トップページ
- `/host` ホスト画面
- `/join/[code]` 参加導線
- `/room/[code]` 参加者画面
- `/pricing` 料金ページ
- `/account` 契約状況ページ

## Supabase で追加した構成

- `profiles`, `rooms`, `participants`, `rounds`, `buzz_events`, `subscriptions` を migration で管理
- Supabase client を `browser / server / admin(service role)` で分離
- ホスト認証は Supabase Auth、参加者はゲスト参加のまま
- RLS を有効にし、ホストは自分の room だけ管理可能
- 参加者参加と buzz 判定は Postgres 関数で実行し、順位判定は常にサーバー側
- Realtime は `room:<code>` topic への Broadcast を利用
- subscriptions テーブルに `plan / status / participant_limit / extra_pack_quantity / stripe_*` を保存

## 仕様メモ

- ホストだけログイン、参加者はゲスト参加
- 順位判定はサーバー側のみで実行
- クライアント時刻は順位判定に不使用
- 同一ラウンドで 1 位と 2 位だけ確定
- 無料プランは 4 人まで
- Starter は月額 980 円で 8 人まで
- Pro は月額 1,980 円で 16 人まで
- Extra Pack は月額 580 円で quantity ごとに +4 人
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

- 最低限のローカル確認だけなら Supabase 未設定でも demo fallback で動きます
- Supabase を使う場合は `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` を設定してください
- Stripe webhook や管理系の更新まで有効化するなら `SUPABASE_SERVICE_ROLE_KEY` も設定してください
- Stripe を使う場合は `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_STARTER_MONTHLY` / `STRIPE_PRICE_PRO_MONTHLY` / `STRIPE_PRICE_EXTRA_PACK_MONTHLY` を設定してください
- Product catalog を Dashboard で管理しやすくするなら `STRIPE_PRODUCT_STARTER` / `STRIPE_PRODUCT_PRO` / `STRIPE_PRODUCT_EXTRA_PACK` も任意で保持できます
- ホストのパスワードログインを使う場合は `HOST_DEMO_PASSWORD` を設定してください
- demo fallback のセッション固定化が必要なら `HOST_SESSION_SECRET` / `SESSION_COOKIE_NAME` を設定してください

4. 開発サーバーを起動します。

```bash
npm run dev
```

5. ブラウザで確認します。

- [http://127.0.0.1:3000](http://127.0.0.1:3000)
- `/join/DEMO42` はダミールームとしてすぐ確認できます

## Supabase 設定手順

1. Supabase Dashboard で project を作成します。

2. API Keys から次を控えます。

- Project URL
- Publishable key
- Service role key

3. `.env.local` に反映します。

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

- `NEXT_PUBLIC_*` は client bundle 用です
- `SUPABASE_SERVICE_ROLE_KEY` は server only です。client bundle に含めないでください

4. Authentication の設定を確認します。

- Email / Password provider を有効化
- Site URL: `http://127.0.0.1:3000`
- Redirect URL: `http://127.0.0.1:3000/auth/callback`

5. migration を適用します。

方法A: Supabase CLI を使う

```bash
npx supabase login
npx supabase init
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

方法B: Dashboard の SQL Editor に `supabase/migrations/20260415193000_init_smart_buzzer.sql` を貼って実行する

6. `/host` で初回ホスト登録を行います。

- Email / Password でホスト登録
- 確認メールが有効なら承認後にログイン

## テスト

Playwright のブラウザが未導入なら先に入れます。

```bash
npx playwright install chromium
```

最小 E2E テストを実行します。

```bash
npm run test:e2e
```

production に対する read-only smoke test は次で実行できます。

```bash
npm run test:e2e:production
```

- 対象は `https://smart-buzzer.vercel.app` の `GET /`, `GET /pricing`, 未ログイン `GET /account` です
- production 全体の確認項目は [`docs/production-smoke-check.md`](docs/production-smoke-check.md) を使って記録してください

## 課金まわり

- `POST /api/billing/checkout` で Starter / Pro + Extra Pack quantity の Checkout Session を作成
- `POST /api/billing/portal` で Stripe Customer Portal に遷移
- `POST /api/stripe/webhook` で署名検証後に契約状態を `subscriptions` テーブルへ反映
- room 作成時と participant 参加時に server-side で人数上限を再計算して検証
- 上限超過時は `/pricing` と `/account` へのアップグレード導線を表示
- ローカルでは `/account` から Free / Starter / Pro + Extra Pack の模擬切替が可能

## Stripe 設定手順

1. Stripe Dashboard で Product を 3 つ作り、それぞれ recurring Price を 1 つずつ用意します。

- `Smart Buzzer Starter` -> `Starter Monthly JPY` -> `¥980 / month`
- `Smart Buzzer Pro` -> `Pro Monthly JPY` -> `¥1,980 / month`
- `Smart Buzzer Extra Pack (+4)` -> `Extra Pack Monthly JPY` -> `¥580 / month`
- `lookup_key` はそれぞれ `starter_monthly_jpy` / `pro_monthly_jpy` / `extra_pack_monthly_jpy` を推奨

2. `.env.local` に Price ID と秘密鍵を設定します。

```bash
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_EXTRA_PACK_MONTHLY=price_...
STRIPE_PRODUCT_STARTER=prod_...
STRIPE_PRODUCT_PRO=prod_...
STRIPE_PRODUCT_EXTRA_PACK=prod_...
```

3. Stripe Dashboard で Customer Portal を有効化します。

- Invoice history
- 支払い方法更新
- 解約
- `Subscription updates` は最初は OFF 推奨
- `Promotion codes` は最初は OFF 推奨

4. Portal を高度化する場合のみ、後から `Subscription updates` を ON にします。

- Allowed updates: `price`, `quantity`
- Products catalog: Starter / Pro / Extra Pack
- Proration: `create_prorations` 推奨
- Starter と Pro を別 Product にしているため、downgrade を Portal に寄せるのは初期段階では避けるのが無難
5. webhook endpoint を作成します。

- URL: `http://127.0.0.1:3000/api/stripe/webhook`
- Events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

6. ローカル検証なら Stripe CLI でも転送できます。

```bash
stripe listen --forward-to http://127.0.0.1:3000/api/stripe/webhook
```

7. `/account` で Checkout と Customer Portal を確認します。

## Supabase Realtime Broadcast

- DB 関数の末尾から `room.sync` Broadcast を送信
- クライアントは同じ topic を購読して画面を同期
- Supabase 未設定時はローカル確認のためにポーリングへフォールバック

## TODO

- 永続化: 本番では migration 適用後に Supabase を使う。未設定時はローカル demo fallback が動く
- Realtime: 必要に応じて private channel と Realtime Authorization へ拡張する
- Billing: Portal configuration の quantity 編集ルールや proration 方針は Stripe Dashboard 側で最終調整する
- E2E: 複数タブでの同期と 1 位 / 2 位確定シナリオを追加する
