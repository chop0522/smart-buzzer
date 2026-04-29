# Current Handoff

Last updated: 2026-04-29 19:16 JST

This file is the short status handoff for ChatGPT Pro or the next operator.
Do not paste secret values into this file.

## Current State

- Project: Smart Buzzer
- Workspace: `/Users/Yuya/smart-buzzer`
- Branch: `main`
- Current pushed app commit: `f38dbf5 fix: remove basic auth from user flows`
- Latest local docs commit before this update: `09a0ee7 docs: record checkout open-only verification`
- Current live-ready tag: `v0.1.6-live-env-ready`
- Tag target: `e4de3d5 docs: add current handoff`
- Production URL: `https://smart-buzzer.vercel.app`
- Current Production deployment: `dpl_EA8rjjLgTSqubaU22ErsW13WiP7H`
- Current Production deployment URL: `https://smart-buzzer-7ayh3v4g3-chop0522s-projects.vercel.app`
- Current Production status: `Ready`

## Completed

- Stripe business name / public business name / statement descriptor were confirmed as `SMART BUZZER`.
- Vercel Production env was switched to live Stripe values.
- Preview / Development env were left without live keys.
- Production redeploy completed and `https://smart-buzzer.vercel.app` is aliased to a Ready deployment.
- Read-only smoke passed for `/`, `/pricing`, `/legal/tokushoho`, `/legal/privacy`, `/legal/terms`, and `/legal/cancellation`.
- `/account` returned `401` when unauthenticated because Basic Auth is active; it did not return `500`.
- Live Checkout open-only checks passed:
  - Starter: `¥980 / month`
  - Pro: `¥1,980 / month`
  - Starter + Extra Pack 1: `¥1,560 / month`
- Checkout display showed Smart Buzzer branding, no visible `七宝占術`, and no test mode text.
- First live Starter real-card payment was completed and verified on 2026-04-29.
- Results were recorded in `docs/go-live-final-gate.md`.
- `docs/current-handoff.md` was created as the short ChatGPT Pro handoff file.
- `v0.1.6-live-env-ready` annotated tag was created and confirmed on GitHub.

## Latest Verification

- Checked at: 2026-04-26 16:48 JST
- Vercel Production: `Ready`
- Production deployment: `dpl_3ZdyUyaDbQyLip45LCrnzQ1KyqfQ`
- Public smoke:
  - `/`: `200`
  - `/pricing`: `200`
  - `/legal/tokushoho`: `200`
  - `/legal/privacy`: `200`
  - `/legal/terms`: `200`
  - `/legal/cancellation`: `200`
  - `/account`: `401` unauthenticated due to Basic Auth; not `500`

## 2026-04-26 17:09 JST Progress

- Git status/log/diff were checked before doing further work.
- `docs/current-handoff.md` and `docs/go-live-final-gate.md` had no uncommitted diff at the start of this step.
- Local `main` had one docs-only commit ahead of `origin/main`: `def832a docs: refresh current handoff`.
- `git push origin main` and HTTPS push both failed from this process due to GitHub authentication not being available to the agent process.
- Vercel Production was inspected again and remained `Ready`.
- Public smoke was repeated:
  - `/`: `200`
  - `/pricing`: `200`
  - `/legal/tokushoho`: `200`
  - `/legal/privacy`: `200`
  - `/legal/terms`: `200`
  - `/legal/cancellation`: `200`
  - `/account`: `401` unauthenticated due to Basic Auth; not `500`
- Vercel env target check:
  - Production has Stripe env names present
  - Preview env count: `0`
  - Development env count: `0`
- Authenticated `/account` smoke was not completed because Vercel sensitive env pull returned empty values for `ADMIN_BASIC_AUTH_USER` / `ADMIN_BASIC_AUTH_PASSWORD`.
- Host login credentials were not available to the agent process.
- Live Checkout from authenticated `/account` was not opened in this step.
- No real-card payment was attempted.
- No cleanup, deletion, refund, cancellation, or Preview/Development live key operation was performed.

## 2026-04-26 17:22 JST Post-Push Verification

- User completed `git push origin main` from an authenticated terminal.
- Local `origin/main` and `HEAD` both point to `050a3c8 docs: refresh current handoff`.
- GitHub `main` contains `docs/current-handoff.md`.
- Vercel Production post-push deployment:
  - Deployment: `dpl_2GPgzxt1S6kkz5RdVTvAgJnd4cEG`
  - URL: `https://smart-buzzer-qkcky17z6-chop0522s-projects.vercel.app`
  - Status: `Ready`
- Public smoke after push:
  - `/`: `200`, old name absent
  - `/pricing`: `200`, old name absent
  - `/legal/tokushoho`: `200`, old name absent
  - `/legal/privacy`: `200`, old name absent
  - `/legal/terms`: `200`, old name absent
  - `/legal/cancellation`: `200`, old name absent
  - `/account`: `401` unauthenticated due to Basic Auth; not `500`
- Authenticated `/account` smoke was not completed because `ADMIN_BASIC_AUTH_USER` and `ADMIN_BASIC_AUTH_PASSWORD` are sensitive Vercel env values and are not readable through env pull.
- `HOST_DEMO_PASSWORD` was not available to the agent process.
- Starter Checkout from authenticated `/account` was not opened in this step.
- No real-card payment was attempted.
- No cleanup, deletion, refund, cancellation, or Preview/Development live key operation was performed.

Manual authenticated `/account` checklist:

1. Open `https://smart-buzzer.vercel.app/account`.
2. Complete Basic Auth in the browser.
3. If redirected or prompted, complete host login.
4. Confirm `/account` does not show `500`.
5. Confirm the current plan/status/participant limit are displayed.
6. Confirm the Stripe Checkout button appears when the account is eligible to upgrade.
7. Confirm Customer Portal is disabled or unavailable when there is no existing Stripe customer, and becomes available only for an account with a Stripe customer.
8. Do not complete payment without an explicit final approval.

## 2026-04-26 18:17 JST Basic Auth Reset

- Production `ADMIN_BASIC_AUTH_USER` and `ADMIN_BASIC_AUTH_PASSWORD` were reset because the previous sensitive values were not readable from Vercel.
- New Basic Auth username: `smartbuzzer-admin`
- New Basic Auth password was generated randomly and was not written to docs, logs, or chat.
- At the time of reset, the password was copied to the Mac clipboard for direct browser entry.
- Preview / Development env were not changed:
  - Preview env count: `0`
  - Development env count: `0`
- Production was redeployed after the env update:
  - Deployment: `dpl_EA8rjjLgTSqubaU22ErsW13WiP7H`
  - URL: `https://smart-buzzer-7ayh3v4g3-chop0522s-projects.vercel.app`
  - Status: `Ready`
- Public smoke after redeploy:
  - `/`: `200`, old name absent
  - `/pricing`: `200`, old name absent
  - `/legal/tokushoho`: `200`, old name absent
  - `/legal/privacy`: `200`, old name absent
  - `/legal/terms`: `200`, old name absent
  - `/legal/cancellation`: `200`, old name absent
  - `/account`: `401` unauthenticated due to Basic Auth; not `500`
- Basic Auth smoke using the new credentials:
  - `/host`: `200`, not `500`, old name absent
  - `/account`: `200`, not `500`, old name absent
- Host login after Basic Auth was not completed in this step.
- Starter Checkout from authenticated `/account` was not opened in this step.
- No real-card payment was attempted.
- No cleanup, deletion, refund, cancellation, or Preview/Development live key operation was performed.

## 2026-04-29 18:42 JST User Flow Basic Auth Removal / Checkout Open-Only

- Commit `f38dbf5 fix: remove basic auth from user flows` was created and pushed to `origin/main` by the user from an authenticated terminal.
- Browser Basic Auth was removed from user-facing host/account/auth/billing/room flows.
- Basic Auth is now reserved for future non-user-facing `/admin` and `/api/admin/*` surfaces.
- Verification before push:
  - `npm run typecheck`: passed
  - `npm run lint`: passed
  - `npm run build`: passed
- Production post-push smoke:
  - `/host`: `200`; no browser Basic Auth prompt
  - `/account`: `200`; no browser Basic Auth prompt
  - `/api/auth/host-login`: app-level `400` for empty input; not Basic Auth `401`
  - `npm run test:e2e:production`: passed
- Authenticated `/account` smoke:
  - Current plan: `Free`
  - Status: `inactive`
  - Participant limit: `4`
  - Extra Packs: `0`
  - Logout button displayed
  - Customer Portal button disabled because no Stripe Customer exists yet
- Starter live Checkout open-only verification:
  - Checkout opened from authenticated `/account`
  - Mode: live Checkout URL (`checkout.stripe.com`, live session prefix visible)
  - Product: `Smart Buzzer Starter`
  - Amount: `¥980 / month`
  - Today's total: `¥980`
  - Branding/display name: `SMART BUZZER`
  - Old name `七宝占術`: not visible
  - Test mode indicator: not visible
  - Payment information was not entered
  - The final `申し込む` button was not clicked
- No real-card payment was attempted.
- No cleanup, deletion, refund, cancellation, or Preview/Development live key operation was performed.
- No live secret key, webhook secret, Checkout session URL, or host email address was written to docs.

## 2026-04-29 19:16 JST First Live Charge Verification

- User explicitly approved one real-card payment for Starter `¥980`.
- Starter live Checkout was re-opened from authenticated `/account`.
- Checkout confirmation before payment:
  - Product: `Smart Buzzer Starter`
  - Amount: `¥980 / month`
  - Today's total: `¥980`
  - Branding/display name: `SMART BUZZER`
  - Old name `七宝占術`: not visible
  - Test mode indicator: not visible
- User completed the payment in the browser.
- App verification:
  - `/account?checkout=success`: loaded successfully
  - Current plan: `Starter`
  - Status: `active`
  - Participant limit: `8`
  - Extra Packs: `0`
  - Customer Portal button: enabled
- Supabase verification:
  - Latest live `subscriptions` row has `plan=starter`, `status=active`, `participant_limit=8`, `extra_pack_quantity=0`
  - Stripe customer and subscription references are present in the row, but full IDs are not recorded here
  - Latest `processed_stripe_events` records for `customer.subscription.created` and `checkout.session.completed` are `completed` with no recorded error
- Stripe Dashboard verification:
  - Live webhook endpoint `smart-buzzer-production-webhook` is active
  - `customer.subscription.created`: `200 OK`
  - `checkout.session.completed`: `200 OK`
  - Active subscription exists for `Smart Buzzer Starter`, `¥980 / month`, created 2026-04-29 19:07 JST
  - Paid invoice exists for `¥980 JPY`, created 2026-04-29 19:07 JST
- Customer Portal verification:
  - Portal opened successfully
  - Portal shows `Smart Buzzer Starter`, `1 month / ¥980`
  - Next billing date shown as 2026-05-29
  - Paid invoice history is visible
- Not performed:
  - No subscription cancellation
  - No refund
  - No Stripe customer / invoice / temporary host deletion
  - No cleanup
  - No Preview / Development live key operation
  - No Pro or Extra Pack real payment
- No live secret key, webhook secret, Checkout session URL, Customer Portal session URL, host email address, full Stripe customer ID, full subscription ID, or full invoice ID was written to docs.

## Important Constraints

- Do not run cleanup unless the user explicitly asks.
- Do not delete Stripe customer / invoice / temporary host.
- Do not expose live secret key or webhook secret in docs, logs, or chat.
- Do not complete a real-card payment without explicit user confirmation immediately before payment.
- Do not switch Preview / Development to live Stripe keys.
- Existing unrelated uncommitted changes are present; do not revert them.

## Git / Working Tree Notes

- Commit `1c3b73c` records the live env readiness checks in `docs/go-live-final-gate.md`.
- Commit `e4de3d5` adds this dedicated handoff file.
- Tag `v0.1.6-live-env-ready` points at `e4de3d5`.
- Commit `def832a` refreshes this handoff after tag confirmation.
- Commit `050a3c8` records the 2026-04-26 17:09 handoff refresh and is pushed to `origin/main`.
- Commit `c5938b1` records the 2026-04-26 17:22 post-push verification and is pushed to `origin/main`.
- Commit `f38dbf5` removes browser Basic Auth from user-facing flows and is pushed to `origin/main`.
- This handoff refresh should be committed and pushed as docs-only.
- The worktree still has unrelated modified and untracked app/security files from earlier work.
- Only docs files should be staged for handoff/status commits unless the user explicitly asks for app changes.

## Remaining Work

- Push docs-only handoff refresh commit(s) to GitHub from an authenticated user terminal if the agent process cannot authenticate.
- First live Starter charge has been completed and verified.
- Next required user decision: keep subscription active, cancel immediately, schedule cancellation at period end, or refund. Do not perform cancellation or refund without explicit user confirmation.
- If the docs-only verification commit is pushed successfully, create and push annotated tag `v1.0.0-live-verified`.
- Keep updating this file at each work boundary before asking ChatGPT Pro for the next plan.

## Suggested Next Prompt

```
docs/current-handoff.md と docs/go-live-final-gate.md を読んで、次に安全に進める作業工程を提案してください。実カード決済、cleanup、Stripe customer/invoice/temporary host 削除、Preview/Development の live key 化は行わず、第三者サービスの確定操作の直前では必ず停止してください。
```
