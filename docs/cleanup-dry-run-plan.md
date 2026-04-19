# Cleanup Dry-Run Plan

2026-04-19 時点で完了している production smoke の後処理に向けた dry-run 計画です。\
このドキュメントでは **実削除・実解約・実更新は行いません**。対象 test data を整理し、後でユーザー承認を得た後に安全に cleanup するための確認順と実行順だけを固定します。

## Fixed Constraints

- このステップでは cloud data を変更しない
- Stripe / Supabase / Vercel / GitHub の destructive action は実行しない
- smoke 証跡は保持したまま cleanup 対象を特定する
- 実 cleanup の前に、対象が test data だけであることを再確認する

## Current Baseline

| Field | Value |
| --- | --- |
| Workspace | `/Users/Yuya/smart-buzzer` |
| Current HEAD | `59734a2` |
| Production URL | `https://smart-buzzer.vercel.app` |
| Production Alias State | `Ready` |
| Current Production Commit | `59734a2a35c76802534c18c99e008697a62f6aae` |
| Smoke Evidence | `docs/production-smoke-check.md` |

補足:

- smoke 実行時の証跡は `40955b8` ベースで記録されている
- その後、production smoke 用 Playwright 整備を `409d262` として `main` に push 済み
- dry-run plan と preview 証跡の docs 更新は `59734a2` として `main` に反映済み
- cleanup 対象は deploy 差分ではなく、smoke で作成した test data

## Cleanup Targets

### 1. Supabase test rooms

- room `3BQBFG`
  - Starter 反映前の 4 人上限確認に使用
- room `UMWLX7`
  - Starter + Extra Pack 1 反映後の 12 人上限確認に使用

想定される関連データ:

- `public.rooms`
- `public.participants`
- `public.rounds`
- `public.buzz_events`

実装上、`public.rooms` を削除すると `participants` / `rounds` / `buzz_events` は `on delete cascade` で追従削除される。

### 2. Stripe test billing objects

- customer `cus_UMKcorfOuzbtJD`
- subscription `sub_1TNbx4RYC6bzdq0l62huyK4A`
- subscription items
  - Starter `price_1TNSMKRYC6bzdq0lpIe3F0ZL`
  - Extra Pack `price_1TNSQuRYC6bzdq0lXJ8l61M0`

想定される関連確認対象:

- active subscription の有無
- invoices / payment history の保持要否
- Customer Portal から見える契約状態

### 3. Supabase subscription row

smoke 結果として、対象 host の `subscriptions` row は少なくとも以下に更新されている前提:

- `plan = starter`
- `extra_pack_quantity = 1`
- `participant_limit = 12`
- `status = active`
- `stripe_customer_id = cus_UMKcorfOuzbtJD`
- `stripe_subscription_id = sub_1TNbx4RYC6bzdq0l62huyK4A`

アプリ実装では、`customer.subscription.deleted` webhook を受けると対象 host の subscription row を `free / inactive / extra_pack_quantity=0` に戻す。

## Dry-Run Checklist

### Step 1. 証跡固定

cleanup に入る前に、残すべき証跡を固定する。

- `docs/production-smoke-check.md` を残す
- cleanup 対象 ID をこのドキュメントに残す
- production alias が `Ready` であることを確認する
- 作業ツリーに不要な未コミット差分がないことを確認する

### Step 2. Stripe を preview-only で確認

実 cleanup 前に、対象 subscription/customer が本当に test data だけか確認する。

Dashboard で見る項目:

- customer `cus_UMKcorfOuzbtJD` が test mode であること
- subscription `sub_1TNbx4RYC6bzdq0l62huyK4A` が対象 customer に紐づくこと
- Starter + Extra Pack 1 の構成であること
- 他の active subscription がぶら下がっていないこと
- cleanup 後も残したい invoice / event 証跡があるか

CLI preview 例:

```bash
stripe customers retrieve cus_UMKcorfOuzbtJD
stripe subscriptions retrieve sub_1TNbx4RYC6bzdq0l62huyK4A
stripe invoices list --customer cus_UMKcorfOuzbtJD --limit 10
```

実行メモ:

- この Mac の `stripe` CLI は存在する
- ただし 2026-04-19 時点では API key が期限切れで read-only retrieve に失敗した
- したがって、次回 preview / cleanup 実行時は Dashboard を第一候補にし、CLI を使うなら先に `stripe login` か API key 更新が必要

### Step 3. Supabase を preview-only で確認

削除対象 room と subscription row を SQL で確認する。\
この段階では `select` だけを使い、`delete` / `update` は実行しない。

room 確認:

```sql
select id, code, host_user_id, created_at, updated_at
from public.rooms
where code in ('3BQBFG', 'UMWLX7')
order by created_at asc;
```

participant 数確認:

```sql
select
  r.code,
  count(p.id) as participant_count
from public.rooms r
left join public.participants p on p.room_id = r.id
where r.code in ('3BQBFG', 'UMWLX7')
group by r.code
order by r.code;
```

round / buzz 件数確認:

```sql
select
  r.code,
  (select count(*) from public.rounds rd where rd.room_id = r.id) as round_count,
  (select count(*) from public.buzz_events be where be.room_id = r.id) as buzz_count
from public.rooms r
where r.code in ('3BQBFG', 'UMWLX7')
order by r.code;
```

subscription row 確認:

```sql
select
  host_user_id,
  plan,
  status,
  participant_limit,
  extra_pack_quantity,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_subscription_status,
  updated_at
from public.subscriptions
where stripe_customer_id = 'cus_UMKcorfOuzbtJD'
   or stripe_subscription_id = 'sub_1TNbx4RYC6bzdq0l62huyK4A';
```

実行場所:

- Supabase Dashboard の SQL Editor
- または接続情報がある場合のみ `psql`

## Read-Only Preview Result

Checked at: `2026-04-19 16:59:26 JST`

### Stripe test mode

- customer: `cus_UMKcorfOuzbtJD`
- livemode: `false`
- email: `codex-smoke-1776529927960@example.com`
- name: `CODEX SMOKE`
- subscription: `sub_1TNbx4RYC6bzdq0l62huyK4A`
- status: `active`
- cancel_at_period_end: `false`
- canceled_at: `null`
- items:
  - Starter: `price_1TNSMKRYC6bzdq0lpIe3F0ZL` quantity=`1`
  - Extra Pack: `price_1TNSQuRYC6bzdq0lXJ8l61M0` quantity=`1`
- invoice: `in_1TNbx1RYC6bzdq0l138EudzP` `¥1,560` `paid`

### Supabase production DB

| room_code | participants | rounds | buzz_events |
| --- | --- | --- | --- |
| `3BQBFG` | `4` | `2` | `2` |
| `UMWLX7` | `12` | `1` | `0` |

Subscription row preview:

- host_user_id: `3759dab0-13a7-4a30-90c1-99ef9a9b7c85`
- plan: `starter`
- status: `active`
- participant_limit: `12`
- extra_pack_quantity: `1`
- stripe_customer_id: `cus_UMKcorfOuzbtJD`
- stripe_subscription_id: `sub_1TNbx4RYC6bzdq0l62huyK4A`
- stripe_subscription_status: `active`

Preview conclusion:

- cleanup 対象は test mode / test data に限定されている
- Stripe subscription 解約後に Supabase subscription row が free/inactive/limit 4 に戻るかを先に確認すべき
- room 削除対象は `3BQBFG` と `UMWLX7` の 2 件で確定している

## Cleanup Execution Result

Executed at: `2026-04-19 17:35:51 JST`

### Stripe execution

- subscription `sub_1TNbx4RYC6bzdq0l62huyK4A` を即時 cancel 済み
- Stripe subscription status: `canceled`
- `cancel_at_period_end`: `false`
- `canceled_at`: `1776587715`
- customer `cus_UMKcorfOuzbtJD` は保持
- customer livemode: `false`

### Webhook / Supabase reflection

Webhook 反映後の `subscriptions` row:

- host_user_id: `3759dab0-13a7-4a30-90c1-99ef9a9b7c85`
- plan: `free`
- status: `inactive`
- participant_limit: `4`
- extra_pack_quantity: `0`
- stripe_customer_id: `cus_UMKcorfOuzbtJD`
- stripe_subscription_id: `sub_1TNbx4RYC6bzdq0l62huyK4A`
- stripe_subscription_status: `canceled`
- updated_at: `2026-04-19T08:35:17.319979+00:00`

確認結果:

- webhook は正常反映
- participant limit は `12` から `4` に復帰
- subscription row は cleanup 後の期待状態に一致

### Room cleanup

削除済み room:

- `3BQBFG`
- `UMWLX7`

削除後確認:

- `public.rooms` に対象 room の残存なし
- cascade 結果:
  - room `3BQBFG`: participants=`0`, rounds=`0`, buzz_events=`0`
  - room `UMWLX7`: participants=`0`, rounds=`0`, buzz_events=`0`

### Remaining items

今回は次を未実施のまま保持:

- temporary host / profile / Supabase Auth user
- Stripe customer `cus_UMKcorfOuzbtJD`
- paid invoice `in_1TNbx1RYC6bzdq0l138EudzP`

Execution conclusion:

- cleanup の主目的だった subscription と smoke room 2件の片付けは完了
- 課金状態は free 側へ復帰済み
- 追加の account/customer 削除は別判断に分離できる状態

## Planned Cleanup Order After Approval

実 cleanup はユーザー承認後に、次の順で進める。

1. Stripe test subscription を停止する
2. webhook により Supabase `subscriptions` row が `free / inactive / extra_pack_quantity=0` に戻ることを確認する
3. `/account` か SQL で participant limit が `4` に戻ったことを確認する
4. smoke 用 room `3BQBFG` と `UMWLX7` を削除する
5. 必要なら Stripe test customer の扱いを決める
   - 残す: 決済履歴の証跡保持を優先
   - 削除: test customer を完全に片付けたい場合のみ
6. cleanup 結果を別メモか `docs/production-smoke-check.md` に追記する

## Future Write Actions

以下は **後で承認が出た場合にだけ使う候補** であり、この dry-run では実行しない。

Stripe:

- Dashboard から subscription `sub_1TNbx4RYC6bzdq0l62huyK4A` を cancel
- 必要に応じて customer `cus_UMKcorfOuzbtJD` を削除

Supabase:

```sql
-- approval 後のみ実行候補
delete from public.rooms
where code in ('3BQBFG', 'UMWLX7');
```

補足:

- room 削除は `participants` / `rounds` / `buzz_events` を cascade cleanup する前提
- `subscriptions` row は Stripe webhook で free 側に戻す設計なので、先に room を消すより subscription cleanup を先に行う

## Stop Conditions

以下のどれかに当てはまったら cleanup を止める。

- Stripe object が test mode ではない
- 対象 customer に想定外の subscription がある
- `customer.subscription.deleted` 後も `subscriptions` row が free/inactive に戻らない
- room code が smoke 用ではなく、継続利用中の data と判明した
- webhook 失敗や idempotency error が出て、DB 状態が不確定になった

## Go / No-Go For Next Step

dry-run 計画としては次の条件が揃えば Go:

- Stripe 側で対象が test data のみと確認できる
- Supabase 側で対象 room / subscription row を preview-only で特定できる
- cleanup 後に残したい証跡が docs に保存済みである

この条件を満たしたら、次回はユーザー確認を取った上で実 cleanup に進む。
