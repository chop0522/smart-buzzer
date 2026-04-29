# Go-Live Final Gate

`2026-04-22` 時点の live 切り替え直前用 Yes / No ゲートです。\
このドキュメントは **live mode へ実際に切り替える前の最終停止線** として使います。

## Purpose

- Stripe live key へ切り替えてよいかを `GO` / `NO-GO` で判断する
- Git / Vercel / Stripe / Supabase / legal 表示の抜け漏れを 1 枚で見る
- 実行担当者が「何を確認したか」を残す

## 2026-04-26 Live Env / Read-Only Execution Log

`2026-04-26 13:31 JST` 時点で、Production env の live 値反映、Production redeploy、read-only smoke、live Checkout open-only 確認を実施した。

注意:

- 実カード決済は実施していない
- cleanup の追加実行はしていない
- Stripe customer / invoice / temporary host は削除していない
- live secret key / webhook secret の値はこのドキュメントに記録しない
- 既存の未コミット変更は多数残っているため、ローカル dirty tree はデプロイしていない

### Stripe Public / Business Info

| Check | Result | Notes |
| --- | --- | --- |
| Customer-facing business name | Pass | `SMART BUZZER` |
| Statement descriptor | Pass | `SMART BUZZER` |
| Support email / phone | Pass | Stripe Dashboard の public support info に設定済み |
| Old name `七宝占術` | Pass | Dashboard 上の確認範囲では表示なし |

### Git / Deployment Baseline

| Field | Value |
| --- | --- |
| Branch | `main` |
| HEAD | `05a94d4 Improve host onboarding UI` |
| Remote | `origin/main` と一致 |
| Recent legal commit | `785c9ee Update legal operator name` |
| Tag | `v0.1.5-legal-ready` exists |
| Worktree | Dirty. 既存の未コミット変更あり |

未コミット変更はこの gate の実行対象外。Vercel の redeploy は既存 Production deployment を再ビルドし、ローカル変更を含めない方式で実施した。

### Vercel Production Env

| Env | Result | Notes |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | Updated | Production のみ。値は記録しない |
| `STRIPE_WEBHOOK_SECRET` | Updated | Production のみ。値は記録しない |
| `STRIPE_PRICE_STARTER_MONTHLY` | Updated | `price_1TOx5BDPUI63E9EhPCxfwkEk` |
| `STRIPE_PRICE_PRO_MONTHLY` | Updated | `price_1TOx70DPUI63E9EhREVr5JW2` |
| `STRIPE_PRICE_EXTRA_PACK_MONTHLY` | Updated | `price_1TOx8WDPUI63E9EhpLmcMZo7` |
| `NEXT_PUBLIC_APP_URL` | Updated | `https://smart-buzzer.vercel.app` |
| Preview / Development | Pass | live key は入れていない |

### Production Redeploy

| Field | Value |
| --- | --- |
| Previous deployment | `https://smart-buzzer-lrt1x6rgf-chop0522s-projects.vercel.app` |
| New deployment | `https://smart-buzzer-7rnx202e9-chop0522s-projects.vercel.app` |
| Deployment ID | `dpl_9ChZz9UWwCsaNDzUEuf6Mmb9dPQi` |
| Target | `production` |
| Status | `Ready` |
| Alias | `https://smart-buzzer.vercel.app` assigned |

### Read-Only Smoke

| Route | Result | Notes |
| --- | --- | --- |
| `/` | `200` | Brand text present, old name absent |
| `/pricing` | `200` | Brand text present, old name absent |
| `/account` | `401` unauthenticated | Basic 認証が有効。`500` ではない |
| `/legal/tokushoho` | `200` | Brand text present, old name absent |
| `/legal/privacy` | `200` | Brand text present, old name absent |
| `/legal/terms` | `200` | Brand text present, old name absent |
| `/legal/cancellation` | `200` | Brand text present, old name absent |

`/account` は本番 Basic 認証で保護されているため、未認証 HTTP smoke では `401` になる。アプリ内部の authenticated `/account` smoke は、この実行では未実施。

### Stripe Live Catalog / Checkout Open-Only

| Check | Result | Notes |
| --- | --- | --- |
| Starter Price | Pass | live mode, `JPY 980 / month`, product `Smart Buzzer Starter` |
| Pro Price | Pass | live mode, `JPY 1980 / month`, product `Smart Buzzer Pro` |
| Extra Pack Price | Pass | live mode, `JPY 580 / month`, product `Smart Buzzer Extra Pack (+4)` |
| Starter Checkout | Pass | live session opened, amount `¥980`, brand present, old name absent, test mode text absent |
| Pro Checkout | Pass | live session opened, amount `¥1,980`, brand present, old name absent, test mode text absent |
| Starter + Extra Pack 1 Checkout | Pass | live session opened, amount `¥1,560`, brand present, old name absent, test mode text absent |
| Payment completion | Pass | 未実施。支払い直前まで進めていない |

Checkout は open-only 確認として Stripe live Prices から live Checkout Session を作成し、ページ表示のみ確認した。実カード情報の入力・送信は行っていない。

## Fixed Constraints

- この段階ではまだ live key を production に入れない
- この段階ではまだ live Product / Price の作成を強制しない
- この段階ではまだ live webhook endpoint の登録を実行しない
- この段階ではまだ実カード決済をしない
- cleanup の追加実行はしない
- Stripe test customer / invoice / temporary host は削除しない

## Current Baseline

| Field | Value |
| --- | --- |
| Workspace | `/Users/Yuya/smart-buzzer` |
| Current Branch | `main` |
| Current Commit | `f5252b9` |
| Planning Tag | `v0.1.4-go-live-checklist` |
| Production URL | `https://smart-buzzer.vercel.app` |
| Production `/` | `HTTP/2 200` |
| Production `/pricing` | `HTTP/2 200` |
| Production `/account` | `HTTP/2 200` |
| Cleanup Tag | `v0.1.3-production-cleanup-pass` |
| Cleanup / Smoke / Go-live checklist | docs 記録済み |
| Legal routes | `/legal/tokushoho`, `/legal/terms`, `/legal/privacy`, `/legal/cancellation` 実装済み |
| Legal business info | 実データ反映済み |

補足:

- `origin/main` は確認時点の最新 `main` を指していることを都度確認する
- `v0.1.3-production-cleanup-pass` は `139ec15` に付与済み
- `f5252b9 chore: fill legal business information` は `origin/main` へ push 済み
- production で `/legal/tokushoho` と `/legal/privacy` に実データ反映を確認済み
- production `/account` は `200` を確認済み

## Usage

各項目に対して、live 切り替え直前に `Yes` / `No` / `N/A` を記入します。\
`No` が 1 つでも残る場合は `NO-GO` とします。

記入欄:

- Checked at:
- Checked by:
- Target deployment / commit:
- Decision: `GO` / `NO-GO`
- Notes:

## 1. Git / Vercel Gate

| Check | Yes/No | Notes |
| --- | --- | --- |
| `git status` が clean |  |  |
| `HEAD` が live 切り替え対象 commit と一致 |  |  |
| `origin/main` が同じ commit を指す |  |  |
| Production deployment が `Ready / Current` |  |  |
| `https://smart-buzzer.vercel.app` が `200` |  |  |
| `/pricing` が `200` |  |  |
| `/account` が `200` で、未ログイン時の表示またはログイン誘導が想定どおり |  |  |

確認コマンド例:

```bash
git status --short --branch
git log --oneline --decorate -5
git rev-parse --short HEAD
git ls-remote --heads origin main | awk '{print substr($1,1,7)}'
curl -sSI https://smart-buzzer.vercel.app | sed -n '1,12p'
curl -sSI https://smart-buzzer.vercel.app/pricing | sed -n '1,12p'
curl -sSI https://smart-buzzer.vercel.app/account | sed -n '1,12p'
```

## 2. Stripe Live Catalog Gate

| Check | Yes/No | Notes |
| --- | --- | --- |
| live mode に `Smart Buzzer Starter` を作成済み |  |  |
| `Starter Monthly JPY = ¥980 / month` |  |  |
| live mode に `Smart Buzzer Pro` を作成済み |  |  |
| `Pro Monthly JPY = ¥1,980 / month` |  |  |
| live mode に `Smart Buzzer Extra Pack (+4)` を作成済み |  |  |
| `Extra Pack Monthly JPY = ¥580 / month` |  |  |
| live Price ID 3 件を控えた |  |  |
| 必要なら live Product ID も控えた |  |  |

控える env 名:

```env
STRIPE_PRICE_STARTER_MONTHLY=price_live_xxx
STRIPE_PRICE_PRO_MONTHLY=price_live_xxx
STRIPE_PRICE_EXTRA_PACK_MONTHLY=price_live_xxx
STRIPE_PRODUCT_STARTER=prod_live_xxx
STRIPE_PRODUCT_PRO=prod_live_xxx
STRIPE_PRODUCT_EXTRA_PACK=prod_live_xxx
```

## 3. Stripe Live Webhook Gate

| Check | Yes/No | Notes |
| --- | --- | --- |
| live webhook endpoint を作成済み |  |  |
| endpoint URL が `https://smart-buzzer.vercel.app/api/stripe/webhook` |  |  |
| event は `checkout.session.completed` を含む |  |  |
| event は `customer.subscription.created` を含む |  |  |
| event は `customer.subscription.updated` を含む |  |  |
| event は `customer.subscription.deleted` を含む |  |  |
| live signing secret を控えた |  |  |
| test endpoint と live endpoint を混同していない |  |  |
| duplicate webhook 対応を再確認した |  |  |
| event 順不同に依存していないことを再確認した |  |  |

控える env 名:

```env
STRIPE_WEBHOOK_SECRET=whsec_live_xxx
```

実装メモ:

- この repo では `processed_stripe_events` による idempotency を入れている
- 署名検証は `/api/stripe/webhook` 実装にある
- live endpoint と test endpoint は同じ URL を使えても secret は別

## 4. Vercel Production Env Gate

| Check | Yes/No | Notes |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` に `sk_live_...` を入れる準備ができている |  |  |
| `STRIPE_WEBHOOK_SECRET` に `whsec_live_...` を入れる準備ができている |  |  |
| live Price ID 3 件を production env に反映する手順を確認済み |  |  |
| `NEXT_PUBLIC_APP_URL=https://smart-buzzer.vercel.app` を維持する |  |  |
| Preview は test key のままにする運用で合意済み |  |  |
| env 更新後は new production deployment が必要だと理解している |  |  |

想定 env:

```env
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_live_xxx
STRIPE_PRICE_STARTER_MONTHLY=price_live_xxx
STRIPE_PRICE_PRO_MONTHLY=price_live_xxx
STRIPE_PRICE_EXTRA_PACK_MONTHLY=price_live_xxx
NEXT_PUBLIC_APP_URL=https://smart-buzzer.vercel.app
```

運用メモ:

- Local: test key
- Preview: test key
- Production: live key

## 5. Test Dependency Gate

| Check | Yes/No | Notes |
| --- | --- | --- |
| test Price ID が code / env 設定に残っていない |  |  |
| test customer ID が code / env 設定に残っていない |  |  |
| test subscription ID が code / env 設定に残っていない |  |  |
| test card number が code / env 設定に残っていない |  |  |
| docs に test 証跡が残っているだけである |  |  |

確認コマンド:

```bash
rg -n "price_1TNS|cus_UMKcorfOuzbtJD|sub_1TNbx4RYC6bzdq0l62huyK4A|4242 4242|sk_test_|whsec_" . -g '!node_modules' -g '!.next'
rg -n "STRIPE_PRICE_|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|STRIPE_PRODUCT_" README.md .env.example app lib
```

2026-04-19 時点の既知状況:

- test 固有 ID のヒットは docs のみ
- docs に残っている証跡は許容

## 6. Supabase Backup Gate

| Check | Yes/No | Notes |
| --- | --- | --- |
| production project の `Database > Backups` を確認した |  |  |
| daily backup または PITR の状態を確認した |  |  |
| backup からの restore 方針を理解した |  |  |
| 必要なら `supabase db dump` の実行手順を確認した |  |  |
| dump 保存先と保護方法を決めた |  |  |

手順確認コマンド例:

```bash
supabase db dump --linked -f supabase/schema.live-pre-switch.sql
supabase db dump --linked --data-only -f supabase/data.live-pre-switch.sql
```

注意:

- 実際の dump 実行は、この gate の確認とは別タスクでよい
- Storage object は DB backup に含まれない

## 7. Legal / Disclosure Gate

これは技術 gate ではなく、**live 課金開始の前提条件** です。\
法務・表示内容は専門家確認が望ましいですが、未整備のまま live 課金へ進まないことを gate にします。

| Check | Yes/No | Notes |
| --- | --- | --- |
| 利用規約ページが存在する |  |  |
| プライバシーポリシーページが存在する |  |  |
| 特商法表記ページが存在する |  |  |
| 料金・課金周期・解約方法を明示している |  |  |
| 返金方針を明示している |  |  |
| 問い合わせ先を明示している |  |  |
| 事業者情報を明示している |  |  |
| checkout 直前または最終確認画面で申込内容を確認しやすい |  |  |
| Customer Portal 側の解約導線を確認済み |  |  |

推奨 route 例:

```text
/legal/terms
/legal/privacy
/legal/tokushoho
```

または:

```text
/terms
/privacy
/commercial-transactions
```

2026-04-22 時点の repo 状況:

- legal routes は実装済み
- 事業者情報、問い合わせ先、管轄裁判所、返金方針の実データ差し替えは完了
- production でも `/legal/tokushoho` と `/legal/privacy` の反映を確認済み
- このため Legal / Disclosure gate は、placeholder の有無ではなく内容妥当性で判断する段階に入っている

最低限、特商法ページで確認したい項目:

- 事業者名
- 住所
- 電話番号
- 代表者名または責任者名
- 販売価格 / 月額料金
- 支払時期 / 支払方法
- 提供開始時期
- 解約方法
- 返金条件

## 8. Live Read-Only Smoke Gate

| Check | Yes/No | Notes |
| --- | --- | --- |
| `/` が正常表示 | Yes | 2026-04-29 production smoke passed |
| `/pricing` が正常表示 | Yes | 2026-04-29 production smoke passed |
| `/account` が正常表示 | Yes | Authenticated account smoke passed; Free / inactive / participant limit 4 |
| Starter checkout が live mode の画面で開く | Yes | Open-only check from authenticated `/account`; no payment submitted |
| Starter の金額が `¥980 / month` | Yes | Stripe Checkout showed `Smart Buzzer Starter`, `¥980 / month`, today's total `¥980` |
| Pro の金額が `¥1,980 / month` |  |  |
| Extra Pack の金額が `¥580 / month` |  |  |
| この段階ではまだ決済完了していない | Yes | Payment details were not entered; final `申し込む` button was not clicked |
| Vercel logs に重大エラーがない |  |  |
| Stripe webhook delivery に重大エラーがない |  |  |

2026-04-29 notes:

- Browser Basic Auth was removed from user-facing `/host`, `/account`, auth, billing, and room operation flows in commit `f38dbf5`.
- Production `/host` and `/account` returned `200` without browser Basic Auth.
- `npm run test:e2e:production` passed after the Basic Auth scope change.
- Starter Checkout displayed `SMART BUZZER`; old name `七宝占術` was not visible.
- Test mode indicator was not visible.
- No Checkout session URL, live secret key, webhook secret, or host email address is recorded here.

## 9. First Live Charge Gate

最初の live 決済をする場合だけ使います。

| Check | Yes/No | Notes |
| --- | --- | --- |
| 実カード決済は Starter 1 回だけに限定する |  |  |
| 決済後に `/account?checkout=success` を確認する |  |  |
| Supabase `subscriptions` row の反映を確認する |  |  |
| webhook success を確認する |  |  |
| 解約の実施要否を決めた |  |  |
| 返金の実施要否を決めた |  |  |

注意:

- refund と subscription cancel は別操作
- refund だけでは subscription は消えない

## 10. Go / No-Go Rule

次の条件をすべて満たしたときだけ `GO`:

- Git / Vercel gate がすべて `Yes`
- Stripe Live Catalog gate がすべて `Yes`
- Stripe Live Webhook gate がすべて `Yes`
- Vercel Production Env gate がすべて `Yes`
- Test Dependency gate に blocker がない
- Supabase Backup gate がすべて `Yes`
- Legal / Disclosure gate がすべて `Yes`

1 つでも `No` が残る場合は `NO-GO`。

## 11. Immediate Stop Conditions

次のどれかがあれば、その場で切り替えを止めます。

- legal page が未整備
- live Product / Price が未作成
- live signing secret を控えていない
- Preview と Production の key 分離が曖昧
- backup / rollback 方針が未確認
- production deployment が `Ready / Current` でない
- `/`、`/pricing`、`/account` のいずれかが異常
- test object に依存している code / env が見つかった

## 12. Sign-Off

- Decision:
- Approved by:
- Executed by:
- Approved at:
- Notes:

## References

- Stripe Go-live checklist: <https://docs.stripe.com/get-started/checklist/go-live>
- Stripe webhooks: <https://docs.stripe.com/webhooks>
- Stripe subscription webhooks: <https://docs.stripe.com/billing/subscriptions/webhooks>
- Stripe refunds: <https://docs.stripe.com/refunds?dashboard-or-api=api>
- Vercel environment variables: <https://vercel.com/docs/environment-variables>
- Supabase backups: <https://supabase.com/docs/guides/platform/backups>
- Supabase CLI db dump: <https://supabase.com/docs/reference/cli/supabase-db-dump>
- 消費者庁 特定商取引法ガイド: <https://www.no-trouble.caa.go.jp/what/mailorder/>
- 個人情報保護委員会 ガイドライン（通則編）: <https://www.ppc.go.jp/personalinfo/legal/guidelines_tsusoku/>
