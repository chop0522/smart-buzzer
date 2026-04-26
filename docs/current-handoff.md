# Current Handoff

Last updated: 2026-04-26 16:48 JST

This file is the short status handoff for ChatGPT Pro or the next operator.
Do not paste secret values into this file.

## Current State

- Project: Smart Buzzer
- Workspace: `/Users/Yuya/smart-buzzer`
- Branch: `main`
- Current stable docs commit: `e4de3d5 docs: add current handoff`
- Current live-ready tag: `v0.1.6-live-env-ready`
- Tag target: `e4de3d5 docs: add current handoff`
- Production URL: `https://smart-buzzer.vercel.app`
- Current Production deployment: `dpl_3ZdyUyaDbQyLip45LCrnzQ1KyqfQ`
- Current Production deployment URL: `https://smart-buzzer-doy095lk5-chop0522s-projects.vercel.app`
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
- No real-card payment was completed.
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
- This handoff refresh is docs-only and should be committed separately.
- The worktree still has unrelated modified and untracked app/security files from earlier work.
- Only docs files should be staged for handoff/status commits unless the user explicitly asks for app changes.

## Remaining Work

- Authenticated `/account` smoke can be done later if Basic Auth / host login credentials are available.
- First live charge is still not done and should remain behind a final user confirmation gate.
- After the first live charge, verify `/account?checkout=success`, Supabase subscription row, and Stripe webhook delivery.
- Keep updating this file at each work boundary before asking ChatGPT Pro for the next plan.

## Suggested Next Prompt

```
docs/current-handoff.md と docs/go-live-final-gate.md を読んで、次に安全に進める作業工程を提案してください。実カード決済、cleanup、Stripe customer/invoice/temporary host 削除、Preview/Development の live key 化は行わず、第三者サービスの確定操作の直前では必ず停止してください。
```
