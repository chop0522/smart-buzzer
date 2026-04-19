# Production Smoke Check

`https://smart-buzzer.vercel.app` を対象にした production 向け確認手順です。\
前提は `40955b8` ベースの production deployment、Stripe は test mode、webhook idempotency は導入済みです。

## Run Metadata

| Field | Value |
| --- | --- |
| App URL | `https://smart-buzzer.vercel.app` |
| Deployment ID | `9VaZUQ7dh` |
| Commit | `40955b8` |
| Stripe Mode | `test` |
| Executed At | `2026-04-19 01:33-01:45 JST` |
| Follow-up Executed At | `2026-04-19 14:05-14:08 JST` |
| Tester | `Codex` |
| Result | `PASS` |

## Summary

| Check | Result | Notes / Evidence |
| --- | --- | --- |
| 1. `/`, `/pricing`, `/account` 表示 | `PASS` | `npm run test:e2e:production` で read-only smoke `1 passed` |
| 2. ホストログインとルーム作成 | `PASS` | 一時 test host で `/host` にログイン後、room `3BQBFG` を作成 |
| 3. 参加者 4 人参加と 5 人目制限 | `PASS` | `P1-Aki` から `P4-Dia` は参加成功、`P5-Eli` は `400` で 4 人上限メッセージ |
| 4. 早押しで 1 位・2 位表示、重複押下無効、リセット | `PASS` | `P1-Aki` が `first`、`P2-Boa` が `second`、重複押下とラウンド後押下は `400`、リセット後に再開可能 |
| 5. Starter / Pro / Extra Pack の Checkout 表示 | `PASS` | Starter `¥980 / month`、Pro `¥1,980 / month`、Extra Pack は `Smart Buzzer Extra Pack (+4)` `¥580 / month` を line item 表示 |
| 6. webhook 後の契約状態反映 | `PASS` | Starter + Extra Pack 1 を test checkout 完了後、`/account?checkout=success` で `Starter / extra 1 / limit 12 / active` へ更新 |
| 7. Customer Portal 表示 | `PASS` | Portal で購読、決済手段、請求履歴、解約導線を確認し、戻った後も `/account` 正常表示 |
| 8. 12人上限反映と host / participant リロード耐性 | `PASS` | 新規 room `UMWLX7` で `Reload-A` + `Auto-02..12` の 12 人参加成功、`Auto-13` は `400`、participant / host 再読み込み後も `12 / 12` を維持 |

## Preconditions

- ホスト用の test アカウントを用意しておく
- 参加者確認用に 5 セッション以上を用意する
  - 実機スマホ 2 台以上が理想
  - 足りなければ Chrome のシークレットウィンドウや別ブラウザを併用する
- Stripe Dashboard は test mode で開いておく
- webhook の送信先が `https://smart-buzzer.vercel.app/api/stripe/webhook` になっていることを確認する
- 本番相当 URL だが test mode なので、課金系は必ず Stripe の test payment method を使う

## Read-Only Smoke

最初に壊れていないことだけを素早く見る read-only 確認です。\
この範囲は自動テスト化済みで、production データを書き換えません。

```bash
npm run test:e2e:production
```

対象:

- `GET /`
- `GET /pricing`
- 未ログイン状態での `GET /account`

## Detailed Checks

### 1. `/`, `/pricing`, `/account` 表示

手順:

1. `/` を開く
2. `/pricing` を開く
3. 未ログイン状態で `/account` を開く

期待結果:

- 3 ページとも `500` や `Application error` にならない
- `/` で `スマホだけで始める 早押し Web アプリ` が見える
- `/pricing` で `料金プラン比較` と `Starter / Pro / Extra Pack` が見える
- `/account` で `契約状況ページ` と `ホストログインへ` が見える

記録:

- Result: PASS
- Notes / Evidence: `npm run test:e2e:production` が `1 passed`。`/`、`/pricing`、未ログイン `/account` の read-only smoke を通過。

### 2. ホストログインとルーム作成

手順:

1. `/host` を開く
2. test ホストアカウントでログインする
3. ルームを作成する

期待結果:

- ログイン後にホストダッシュボードへ遷移する
- ルームコードが表示される
- 参加者一覧、ラウンド開始、リセットの UI が表示される

記録:

- Result: PASS
- Notes / Evidence: 一時 test host を作成して `/host` にログイン。ホストダッシュボードで room `3BQBFG` を作成し、参加者一覧・ラウンド開始・リセット UI を確認。

### 3. 参加者 4 人参加と 5 人目制限

手順:

1. 作成済みルームへ 4 人を順に参加させる
2. ホスト画面で 4 人分の表示名が反映されることを確認する
3. 5 人目を同じルームへ参加させる

期待結果:

- 1 人目から 4 人目までは参加できる
- ホスト画面でも参加者名が同期される
- 5 人目で満員またはアップグレード導線が表示される

記録:

- Result: PASS
- Notes / Evidence: production API 経由で `P1-Aki`、`P2-Boa`、`P3-Cai`、`P4-Dia` を join。5 人目 `P5-Eli` は `400` と `このルームは 4 人までです。Starter / Pro / Extra Pack で上限を引き上げてください。` を返し、ホスト画面も `4 人参加中` へ同期。

### 4. 早押しで 1 位・2 位表示、重複押下無効、リセット

手順:

1. ホストでラウンドを開始する
2. 2 台以上で早押しする
3. 同一参加者で再度押す
4. 2 位まで確定後にロックを確認する
5. ホストでリセットする

期待結果:

- 1 位と 2 位が順に表示される
- 同一参加者の重複押下は無効
- 2 位確定後はラウンドがロックされる
- リセット後に次ラウンドを開始できる

記録:

- Result: PASS
- Notes / Evidence: ラウンド開始後、`P1-Aki` の buzz は `first`、同一参加者の再押下は `400`、`P2-Boa` は `second`、以後の buzz は `現在のラウンドは受付中ではありません。`。ホスト画面で 1 位/2 位表示と `LOCKED_OUT` を確認し、`リセット` 後に新ラウンド開始まで確認。

### 5. Starter / Pro / Extra Pack の Checkout 表示

手順:

1. `/account` で Starter を選んで Checkout を開く
2. Pro を選んで Checkout を開く
3. Extra Pack quantity を増やした状態で Checkout を開く

期待結果:

- Starter は `¥980 / month`
- Pro は `¥1,980 / month`
- Extra Pack は `¥580 / month` が quantity に応じて line item に出る
- Product 名が Dashboard 設定と一致する

記録:

- Result: PASS
- Notes / Evidence: Stripe Checkout で `Smart Buzzer Starter` は `¥980 / month`、`Smart Buzzer Pro` は `¥1,980 / month`。Starter + Extra Pack 1 では `Smart Buzzer Starter` `¥980` と `Smart Buzzer Extra Pack (+4)` `¥580` が別 line item で表示され、合計 `¥1,560 / month`。

### 6. webhook 後の契約状態反映

手順:

1. Stripe Checkout を完了するか、Stripe Dashboard から対象 event を再送する
2. `/account` を再表示する
3. 必要なら同一 event をもう一度再送する

期待結果:

- `/account` の `Current Plan`、`Participant Limit`、`Status` が更新される
- Starter / Pro / Extra Pack の反映結果が一致する
- 同一 event の再送でも重複更新で壊れない
  - 既に確認済みの idempotency を再チェックする場合は `duplicate=true` の 200 を証跡に残す

記録:

- Result: PASS
- Notes / Evidence: Stripe test card `4242 4242 4242 4242` で Starter + Extra Pack 1 を checkout 完了。`/account?checkout=success` で `Current Plan Starter`、`Extra Packs 1`、`Participant Limit 12`、`Status active` を確認。Supabase `subscriptions` row も `plan=starter`、`extra_pack_quantity=1`、`participant_limit=12`、`stripe_subscription_id=sub_1TNbx4RYC6bzdq0l62huyK4A` に更新。重複 event 耐性は別確認で既に実施済み。

### 7. Customer Portal 表示

手順:

1. `/account` から `Customer Portal を開く` を押す
2. Portal の表示内容を確認する
3. 戻った後に `/account` が正常表示のままか確認する

期待結果:

- Portal が開く
- 請求履歴、支払い方法更新、解約導線が見える
- 戻った後も `/account` が崩れない

記録:

- Result: PASS
- Notes / Evidence: Customer Portal で `Smart Buzzer Starter` + `Smart Buzzer Extra Pack (+4)` の現在契約、`Visa •••• 4242`、`決済手段を追加`、`サブスクリプションをキャンセル`、`2026/04/19 ¥1,560 支払い済み` を確認。ブラウザ戻るで `/account` に復帰後も契約表示は維持。

### 8. 12人上限反映と host / participant リロード耐性

手順:

1. Starter + Extra Pack 1 反映後の `/host` で新規ルームを作成する
2. participant 画面から 1 人参加し、残りは production API で join する
3. 13 人目を同じ room へ参加させる
4. participant 画面を再読み込みして参加状態が保持されるか確認する
5. host 画面を再読み込みして最新 room と参加者一覧が維持されるか確認する

期待結果:

- 新規 room が `12` 人上限で作成される
- 1 人目から 12 人目までは参加できる
- 13 人目は `400` と上限メッセージでブロックされる
- participant 画面の再読み込み後も表示名と参加状態が保持される
- host 画面の再読み込み後も `12 / 12` と参加者一覧が維持される

記録:

- Result: PASS
- Notes / Evidence: `/host` から fresh room `UMWLX7` を作成。Chrome participant `/room/UMWLX7` で `Reload-A` を join し、production API で `Auto-02` から `Auto-12` までの join が `200`。`Auto-13` は `400` と `このルームは 12 人までです。Starter / Pro / Extra Pack で上限を引き上げてください。` を返却。`GET /api/rooms/UMWLX7` でも `participantCount=12` と `participantLimit=12` を確認。participant 画面の再読み込み後も `Reload-A` と `12 / 12` を保持し、host 画面の再読み込み後も latest room `UMWLX7`、`12 人参加中`、参加者一覧 12 件を維持。

## Cleanup

- dry-run 計画は [`docs/cleanup-dry-run-plan.md`](./cleanup-dry-run-plan.md) を参照
- 不要な test ルームは削除またはリセットする
- Stripe test checkout を実施した場合は Dashboard の event / customer をメモしておく
- 実施結果はこのファイルの Summary を更新して残す
