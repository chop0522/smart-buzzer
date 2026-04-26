# Current Handoff

Last updated: 2026-04-26 13:55 JST

This file is the short status handoff for ChatGPT Pro or the next operator.
Do not paste secret values into this file.

## Current State

- Project: Smart Buzzer
- Workspace: `/Users/Yuya/smart-buzzer`
- Branch: `main`
- Local HEAD: `1c3b73c docs: record live env readiness checks`
- Remote `origin/main` before push: `05a94d4 Improve host onboarding UI`
- Production URL: `https://smart-buzzer.vercel.app`
- Current Production deployment: `dpl_9ChZz9UWwCsaNDzUEuf6Mmb9dPQi`
- Current Production deployment URL: `https://smart-buzzer-7rnx202e9-chop0522s-projects.vercel.app`

## Completed

- Stripe business name / public business name / statement descriptor were confirmed as `SMART BUZZER`.
- Vercel Production env was switched to live Stripe values.
- Preview / Development env were left without live keys.
- Production redeploy completed and `https://smart-buzzer.vercel.app` was aliased to the new Ready deployment.
- Read-only smoke passed for `/`, `/pricing`, `/legal/tokushoho`, `/legal/privacy`, `/legal/terms`, and `/legal/cancellation`.
- `/account` returned `401` when unauthenticated because Basic Auth is active; it did not return `500`.
- Live Checkout open-only checks passed:
  - Starter: `¥980 / month`
  - Pro: `¥1,980 / month`
  - Starter + Extra Pack 1: `¥1,560 / month`
- Checkout display showed Smart Buzzer branding, no visible `七宝占術`, and no test mode text.
- No real-card payment was completed.
- Results were recorded in `docs/go-live-final-gate.md`.

## Important Constraints

- Do not run cleanup unless the user explicitly asks.
- Do not delete Stripe customer / invoice / temporary host.
- Do not expose live secret key or webhook secret in docs, logs, or chat.
- Do not complete a real-card payment without explicit user confirmation immediately before payment.
- Do not switch Preview / Development to live Stripe keys.
- Existing unrelated uncommitted changes are present; do not revert them.

## Git / Working Tree Notes

- Local commit `1c3b73c` records the live env readiness checks in `docs/go-live-final-gate.md`.
- A dedicated handoff file was added at `docs/current-handoff.md`.
- The worktree still has unrelated modified and untracked files from earlier work.
- Only docs files should be staged for handoff/status commits unless the user explicitly asks for app changes.

## Remaining Work

- Push the latest docs commits to GitHub once authentication succeeds.
- If needed, verify Vercel's post-push deployment stays Ready.
- Authenticated `/account` smoke can be done later if Basic Auth / host login credentials are available.
- First live charge is still not done and should remain behind a final user confirmation gate.
- After the first live charge, verify `/account?checkout=success`, Supabase subscription row, and Stripe webhook delivery.

## Suggested Next Prompt

```
docs/current-handoff.md と docs/go-live-final-gate.md を読んで、次に安全に進める作業工程を提案してください。実カード決済や第三者サービスの確定操作の直前では必ず停止してください。
```
