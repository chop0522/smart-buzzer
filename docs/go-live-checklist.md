# Go-Live Checklist

`2026-04-19` 時点での live 切り替え前チェックリストです。\
このドキュメントは **手順の固定が目的** であり、この時点では live key への切り替えや実カード決済は行いません。

## Current Verified Baseline

| Field | Value |
| --- | --- |
| Workspace | `/Users/Yuya/smart-buzzer` |
| Production URL | `https://smart-buzzer.vercel.app` |
| Cleanup Baseline Commit | `139ec15` |
| Cleanup Baseline Tag | `v0.1.3-production-cleanup-pass` |
| Current Branch | `main` |
| Current Stripe Mode | `test` |
| Cleanup Status | subscription cleanup と smoke room cleanup 完了 |

補足:

- cleanup 結果は [`docs/production-smoke-check.md`](./production-smoke-check.md) と [`docs/cleanup-dry-run-plan.md`](./cleanup-dry-run-plan.md) に記録済み
- `sub_1TNbx4RYC6bzdq0l62huyK4A` は cancel 済み
- `subscriptions` row は `free / inactive / participant_limit=4 / extra_pack_quantity=0 / stripe_subscription_status=canceled` に復帰済み
- room `3BQBFG` と `UMWLX7` は削除済み
- Stripe customer / invoice / temporary host は未削除のまま保持

## Fixed Constraints

- まだ `STRIPE_SECRET_KEY=sk_live_...` へ切り替えない
- まだ `STRIPE_WEBHOOK_SECRET=whsec_live_...` を production に反映しない
- まだ live checkout を開始しない
- まだ実カード決済をしない
- cleanup の追加実行はしない
- Stripe test customer / invoice / temporary host の削除はこの手順には含めない

## References

- Stripe Go-live checklist: <https://docs.stripe.com/get-started/checklist/go-live>
- Stripe subscription webhooks: <https://docs.stripe.com/billing/subscriptions/webhooks>
- Stripe webhooks: <https://docs.stripe.com/webhooks>
- Stripe refunds: <https://docs.stripe.com/refunds?dashboard-or-api=api>
- Supabase backups: <https://supabase.com/docs/guides/platform/backups>
- Supabase CLI `db dump`: <https://supabase.com/docs/reference/cli/supabase-db-dump>

## 1. Stripe Live Catalog を作る

Stripe の test object は live mode で使えません。\
live mode 側で同じ商品構成を作り、**live Price ID を新しく控える** 必要があります。

作成する catalog:

| Product | Price label | Amount | Interval | Env var |
| --- | --- | --- | --- | --- |
| `Smart Buzzer Starter` | `Starter Monthly JPY` | `¥980` | monthly | `STRIPE_PRICE_STARTER_MONTHLY` |
| `Smart Buzzer Pro` | `Pro Monthly JPY` | `¥1,980` | monthly | `STRIPE_PRICE_PRO_MONTHLY` |
| `Smart Buzzer Extra Pack (+4)` | `Extra Pack Monthly JPY` | `¥580` | monthly | `STRIPE_PRICE_EXTRA_PACK_MONTHLY` |

任意で記録する Product ID:

- `STRIPE_PRODUCT_STARTER`
- `STRIPE_PRODUCT_PRO`
- `STRIPE_PRODUCT_EXTRA_PACK`

推奨メモ:

- Product 名は test mode と同じ命名にそろえる
- lookup key を使う場合も test/live で混線しないように棚卸しする
- live Price ID は docs には貼らず、Vercel production env のみに入れる

## 2. Stripe Live Webhook Endpoint を登録する

live mode 用 webhook endpoint は test mode 用と別です。\
production endpoint URL は次を使います。

```text
https://smart-buzzer.vercel.app/api/stripe/webhook
```

登録イベント:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

確認ポイント:

- endpoint は `https://...` で登録する
- live endpoint を Workbench / Dashboard に登録する
- live endpoint の signing secret を控える
- production endpoint は delayed webhook を許容する
- production endpoint は duplicate webhook を許容する
- production endpoint は event の順不同に依存しない

この repo では、既存実装として `processed_stripe_events` による idempotency を入れているため、duplicate webhook 対応は実装済みです。\
ただし live 切り替え時にも、実際の endpoint 設定と secret が test のまま残っていないかは別途確認が必要です。

## 3. Vercel Production Env に live 値を入れる準備をする

production 切り替え時に使う env は少なくとも次です。

```env
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_live_xxx
STRIPE_PRICE_STARTER_MONTHLY=price_live_xxx
STRIPE_PRICE_PRO_MONTHLY=price_live_xxx
STRIPE_PRICE_EXTRA_PACK_MONTHLY=price_live_xxx
NEXT_PUBLIC_APP_URL=https://smart-buzzer.vercel.app
```

任意で保持する env:

```env
STRIPE_PRODUCT_STARTER=prod_live_xxx
STRIPE_PRODUCT_PRO=prod_live_xxx
STRIPE_PRODUCT_EXTRA_PACK=prod_live_xxx
```

反映前チェック:

- test key と live key を混在させない
- `NEXT_PUBLIC_APP_URL` は production URL のまま維持する
- env の更新後に production redeploy が走る前提で時間帯を決める
- Vercel 上の旧 test 値を退避するなら、切り替え前に控えを残す

## 4. Supabase Backup / Recovery 方針を固める

live 切り替え前に、復旧手段を先に決めておきます。

Dashboard 側:

- `Database > Backups` で daily backup の利用可否を確認する
- PITR が必要なら recovery window とコストを確認する

CLI 側:

```bash
supabase db dump --linked -f supabase/schema.live-pre-switch.sql
supabase db dump --linked --data-only -f supabase/data.live-pre-switch.sql
```

注意:

- `supabase db dump` は linked project が必要
- Supabase の daily backup は Dashboard から restore できるが、logical dump を別で持つと rollback 計画が立てやすい
- Storage object は DB backup に含まれない点を把握しておく

## 5. Test 依存が残っていないか確認する

Stripe 公式 checklist どおり、test object に依存していないことを切り替え前に確認します。

実行コマンド:

```bash
rg -n "price_1TNS|cus_UMKcorfOuzbtJD|sub_1TNbx4RYC6bzdq0l62huyK4A|4242 4242|sk_test_|whsec_" . -g '!node_modules' -g '!.next'
```

2026-04-19 時点の既知の結果:

- test 固有 ID のヒットは docs のみ
- `docs/production-smoke-check.md`
- `docs/cleanup-dry-run-plan.md`

期待結果:

- アプリコード、`lib/`, `app/`, `.env.example`, migration には test customer / subscription / card number の直書きがない
- docs に残っている証跡は許容する

追加確認:

```bash
rg -n "STRIPE_PRICE_|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|STRIPE_PRODUCT_" README.md .env.example app lib
```

ここで見るポイント:

- env 名が docs と実装で一致していること
- live 切り替え時に必要な env が不足していないこと

## 6. Live 切り替え実行順

実際に切り替える日の順序は次を固定します。

1. Supabase backup / dump を取得する
2. Stripe live catalog を最終確認する
3. Stripe live webhook endpoint を作成する
4. live signing secret を控える
5. Vercel production env を live 値に更新する
6. production redeploy が `Ready` になるのを待つ
7. `/`、`/pricing`、未ログイン `/account` の read-only smoke を行う
8. Checkout を開いて live mode の金額表示だけ確認する
9. ここまでは決済を完了しない
10. Vercel logs と Stripe live webhook deliveries にエラーがないか確認する

停止条件:

- live webhook secret を控えずに env 更新しそうになった
- live Price ID が 3 つそろっていない
- production redeploy が `Ready` にならない
- `/` または `/pricing` が `200` で返らない
- `/api/stripe/webhook` で署名検証エラーが出る

## 7. Live 切り替え直後の Read-Only Smoke

最初の live 直後は、決済完了より前に表示と導線だけ確認します。

確認順:

1. `GET /`
2. `GET /pricing`
3. 未ログイン `GET /account`
4. ホストログイン
5. `/account` で plan card が表示されること
6. Starter checkout を開く
7. `¥980 / month` が live mode として表示されること
8. Pro checkout を開く
9. `¥1,980 / month` が live mode として表示されること
10. Extra Pack quantity を 1 にして `¥580 / month` line item が出ること
11. この段階ではまだ決済完了しない

最小確認コマンド:

```bash
curl -sSI https://smart-buzzer.vercel.app | sed -n '1,12p'
curl -sSI https://smart-buzzer.vercel.app/pricing | sed -n '1,12p'
```

期待結果:

- `HTTP/2 200`
- `server: Vercel`
- アプリが production alias で正常応答する

## 8. 最初の Live 決済を 1 回だけ実施する場合

live 決済を行うなら、最初は `Starter 980円` を 1 回だけに絞ります。

実施順:

1. Starter checkout を live mode で開始する
2. 実カード決済を 1 回だけ完了する
3. Stripe live webhook delivery が成功することを確認する
4. `/account?checkout=success` で `Starter / active / participant_limit=8` を確認する
5. Supabase `subscriptions` row でも live 契約状態を確認する
6. 動作確認が済んだら subscription を cancel するか継続するか判断する

注意:

- refund と subscription cancel は別操作
- refund しても subscription 自体は自動で消えないので、必要なら cancel を別で行う
- cancel 後の state 反映は webhook 成功確認まで待つ

## 9. 解約 / 返金の手順

最初の live 決済を取り消す場合は、解約と返金を分けて扱います。

解約:

- Customer Portal か Stripe Dashboard から subscription を cancel する
- `customer.subscription.deleted` または関連 update webhook の反映を確認する
- Supabase `subscriptions` row が期待状態に戻るか確認する

返金:

- Stripe Dashboard の Payments から対象 payment を開き `Refund payment` を実行する
- API で行うなら underlying `PaymentIntent` または `charge` に対して refund を作成する
- refund は Stripe の available balance を使う

確認ポイント:

- 解約 webhook が成功したこと
- refund が pending のまま詰まっていないこと
- customer 向け receipt / refund receipt の扱いを決めていること

## 10. Rollback 手順

切り替え失敗時は、次の順で戻します。

1. Vercel production env を test 値へ戻す
2. production redeploy が `Ready` になるのを待つ
3. `/`、`/pricing`、`/account` の read-only smoke を再実行する
4. Stripe live webhook endpoint を disable するか、誤配信がない状態を確認する
5. live で途中生成した customer / subscription / payment があれば棚卸しする
6. 必要に応じて Supabase backup / logical dump から復旧方針を再確認する

rollback を止める条件:

- すでに live 決済が成功しており、契約・返金・会計処理の整理が終わっていない
- DB rollback が billing truth と食い違う

## 11. Deferred Cleanup

live 切り替えより優先度は落ちますが、後続候補として次を別タスクにできます。

- temporary host / profile / Auth user の read-only preview
- Stripe test customer / invoice の後片付け
- live 切り替え後の smoke runbook 追記
- 実 live 決済 1 回目の検証結果を `docs/production-smoke-check.md` か別 runbook に記録
