"use client";

import { useState, useTransition } from "react";
import { fetchJson } from "@/lib/fetch-json";
import type { HostAccount } from "@/lib/types";

export function BillingPanel({
  account,
  stripeEnabled,
}: {
  account: HostAccount;
  stripeEnabled: boolean;
}) {
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

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
          Billing
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">契約状況</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          無料プランは4人まで、有料プランで上限を拡張します。サーバー側でも常に課金状態を検証してから参加上限を判定します。
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <article className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Plan
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {account.plan.toUpperCase()}
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

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {stripeEnabled ? (
            <button
              type="button"
              disabled={isPending || account.plan === "pro"}
              onClick={() =>
                run(async () => {
                  const payload = await fetchJson<{ url: string }>(
                    "/api/billing/checkout",
                    {
                      method: "POST",
                      body: JSON.stringify({ plan: "pro" }),
                    },
                  );

                  window.location.href = payload.url;
                })
              }
              className="rounded-2xl bg-cyan-300 px-4 py-4 text-base font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {account.plan === "pro" ? "すでに Pro です" : "Stripe Checkout を開始"}
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={isPending || account.plan === "pro"}
                onClick={() =>
                  run(async () => {
                    await fetchJson("/api/account/demo-plan", {
                      method: "POST",
                      body: JSON.stringify({ plan: "pro" }),
                    });
                    window.location.reload();
                  })
                }
                className="rounded-2xl bg-cyan-300 px-4 py-4 text-base font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                ローカルで Pro を模擬適用
              </button>
              <button
                type="button"
                disabled={isPending || account.plan === "free"}
                onClick={() =>
                  run(async () => {
                    await fetchJson("/api/account/demo-plan", {
                      method: "POST",
                      body: JSON.stringify({ plan: "free" }),
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
