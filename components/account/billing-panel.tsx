"use client";

import { useState, useTransition } from "react";
import { LegalLinks } from "@/components/legal/legal-links";
import { fetchJson } from "@/lib/fetch-json";
import { formatYen } from "@/lib/format";
import {
  EXTRA_PACK_INCREMENT,
  EXTRA_PACK_PRICE_YEN,
  EXTRA_PACK_PRICE_LABEL,
  PLAN_CATALOG,
  PLAN_ORDER,
} from "@/lib/plans";
import type { HostAccount, SubscriptionPlan } from "@/lib/types";

const PAID_PLAN_ORDER = PLAN_ORDER.filter((plan) => plan !== "free");

function formatPlanName(plan: SubscriptionPlan) {
  return PLAN_CATALOG[plan].name;
}

export function BillingPanel({
  account,
  stripeEnabled,
}: {
  account: HostAccount;
  stripeEnabled: boolean;
}) {
  const [selectedPlan, setSelectedPlan] = useState<Exclude<SubscriptionPlan, "free">>(
    account.plan === "free" ? "starter" : account.plan,
  );
  const [extraPackQuantity, setExtraPackQuantity] = useState(
    account.extraPackQuantity,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (action: () => Promise<void>) => {
    startTransition(async () => {
      try {
        setMessage(null);
        await action();
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "操作に失敗しました。",
        );
      }
    });
  };

  const selectedLimit =
    PLAN_CATALOG[selectedPlan].participantLimit +
    extraPackQuantity * EXTRA_PACK_INCREMENT;
  const isSameAsCurrent =
    account.plan === selectedPlan &&
    account.extraPackQuantity === extraPackQuantity;
  const hasManagedSubscription =
    account.plan !== "free" &&
    Boolean(account.stripeCustomerId && account.stripeSubscriptionId) &&
    account.status !== "canceled";
  const selectedMonthlyTotal =
    PLAN_CATALOG[selectedPlan].priceYen +
    extraPackQuantity * EXTRA_PACK_PRICE_YEN;

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
          Billing
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">契約状況</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          Free は 4 人、Starter は 8 人、Pro は 16 人までです。Extra Pack を 1 つ追加するごとに +4 人され、上限判定は room 作成時と参加時の両方でサーバー側が検証します。
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <article className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Current Plan
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {formatPlanName(account.plan)}
            </p>
          </article>
          <article className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Extra Packs
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {account.extraPackQuantity}
            </p>
          </article>
          <article className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Participant Limit
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {account.participantLimit}
            </p>
          </article>
          <article className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Status
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {account.status}
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
              Upgrade
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Stripe Billing を使って上限を拡張
            </h2>
          </div>
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
            選択中: {formatPlanName(selectedPlan)} / {selectedLimit} 人
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {PAID_PLAN_ORDER.map((plan) => {
            const catalog = PLAN_CATALOG[plan];
            const active = selectedPlan === plan;

            return (
              <button
                key={plan}
                type="button"
                onClick={() => setSelectedPlan(plan)}
                className={`rounded-[1.75rem] border p-5 text-left transition ${
                  active
                    ? "border-cyan-300/60 bg-cyan-300/10 shadow-[0_20px_60px_-30px_rgba(34,211,238,0.65)]"
                    : "border-white/15 bg-white/5 hover:bg-white/10"
                }`}
              >
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
                  {catalog.name}
                </p>
                <h3 className="mt-2 text-3xl font-semibold text-white">
                  {catalog.priceLabel}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {catalog.description}
                </p>
                <p className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100">
                  ベース上限: {catalog.participantLimit} 人
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-[1.75rem] border border-white/15 bg-white/5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
                Extra Pack
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-white">
                quantity ごとに +{EXTRA_PACK_INCREMENT} 人
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Starter / Pro に追加できます。{EXTRA_PACK_PRICE_LABEL} で、
                選択中の quantity は Checkout と webhook の両方でサーバー側が検証します。
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2">
              <button
                type="button"
                disabled={isPending || extraPackQuantity === 0}
                onClick={() =>
                  setExtraPackQuantity((current) => Math.max(0, current - 1))
                }
                className="h-10 w-10 rounded-full border border-white/15 text-lg text-white transition hover:bg-white/5 disabled:opacity-50"
              >
                -
              </button>
              <div className="min-w-16 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Qty
                </p>
                <p className="text-2xl font-semibold text-white">
                  {extraPackQuantity}
                </p>
              </div>
              <button
                type="button"
                disabled={isPending || extraPackQuantity >= 99}
                onClick={() =>
                  setExtraPackQuantity((current) => Math.min(99, current + 1))
                }
                className="h-10 w-10 rounded-full border border-white/15 text-lg text-white transition hover:bg-white/5 disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[1.75rem] border border-amber-300/25 bg-amber-300/10 p-5">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-amber-100">
            Checkout 前の確認
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            料金・自動更新・解約方法
          </h3>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-100">
            <li>
              選択中プラン: {formatPlanName(selectedPlan)} /{" "}
              {PLAN_CATALOG[selectedPlan].priceLabel}
            </li>
            <li>参加者上限: {selectedLimit} 人</li>
            <li>
              Extra Pack: {extraPackQuantity} 件 / {EXTRA_PACK_PRICE_LABEL}
            </li>
            <li>
              今回の月額合計目安: {formatYen(selectedMonthlyTotal)}（税込想定）
            </li>
            <li>契約は月単位で自動更新されます。</li>
            <li>
              解約はアカウント画面の請求管理からいつでも行えます。解約後も現在の請求期間の終了までは有料機能を利用できます。
            </li>
            <li>
              支払済み料金の日割り返金は原則として行いません。誤課金やシステム不具合等で必要と判断した場合のみ個別に対応します。
            </li>
          </ul>
          <p className="mt-4 text-sm leading-7 text-slate-100">
            Stripe Checkout へ進むことで、利用規約、プライバシーポリシー、特定商取引法に基づく表記、解約・返金ポリシーを確認のうえ申込むものとします。
          </p>
          <div className="mt-4">
            <LegalLinks />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {stripeEnabled ? (
            <>
              <button
                type="button"
                disabled={isPending || isSameAsCurrent || hasManagedSubscription}
                onClick={() =>
                  run(async () => {
                    const payload = await fetchJson<{ url: string }>(
                      "/api/billing/checkout",
                      {
                        method: "POST",
                        body: JSON.stringify({
                          plan: selectedPlan,
                          extraPackQuantity,
                        }),
                      },
                    );

                    window.location.href = payload.url;
                  })
                }
                className="rounded-2xl bg-cyan-300 px-4 py-4 text-base font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {hasManagedSubscription
                  ? "既存契約は Portal から変更"
                  : isSameAsCurrent
                    ? "現在の契約と同じです"
                    : "Stripe Checkout へ進む"}
              </button>
              <button
                type="button"
                disabled={isPending || !account.stripeCustomerId}
                onClick={() =>
                  run(async () => {
                    const payload = await fetchJson<{ url: string }>(
                      "/api/billing/portal",
                      {
                        method: "POST",
                      },
                    );

                    window.location.href = payload.url;
                  })
                }
                className="rounded-2xl border border-white/15 px-4 py-4 text-base font-semibold text-slate-100 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Customer Portal を開く
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  run(async () => {
                    await fetchJson("/api/account/demo-plan", {
                      method: "POST",
                      body: JSON.stringify({
                        plan: selectedPlan,
                        extraPackQuantity,
                      }),
                    });
                    window.location.reload();
                  })
                }
                className="rounded-2xl bg-cyan-300 px-4 py-4 text-base font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                ローカルで {formatPlanName(selectedPlan)} を模擬適用
              </button>
              <button
                type="button"
                disabled={
                  isPending ||
                  (account.plan === "free" && account.extraPackQuantity === 0)
                }
                onClick={() =>
                  run(async () => {
                    await fetchJson("/api/account/demo-plan", {
                      method: "POST",
                      body: JSON.stringify({
                        plan: "free",
                        extraPackQuantity: 0,
                      }),
                    });
                    window.location.reload();
                  })
                }
                className="rounded-2xl border border-white/15 px-4 py-4 text-base font-semibold text-slate-100 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Free に戻す
              </button>
            </>
          )}
        </div>

        {message ? (
          <p className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
            {message}
          </p>
        ) : null}
      </section>
    </div>
  );
}
