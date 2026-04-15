"use client";

import { useState, useTransition } from "react";
import { fetchJson } from "@/lib/fetch-json";

export function HostLoginCard({ demoAvailable }: { demoAvailable: boolean }) {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const login = (payload: { password?: string; demo?: boolean }) => {
    startTransition(async () => {
      try {
        await fetchJson("/api/auth/host-login", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        window.location.reload();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "ログインに失敗しました。");
      }
    });
  };

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
          Host Login
        </p>
        <h1 className="text-3xl font-semibold text-white">ホストだけログイン</h1>
        <p className="text-sm leading-7 text-slate-300">
          参加者はゲスト参加です。ホストはサーバー側で検証されるセッションを取得してから、
          ルーム作成とラウンド操作を行います。
        </p>
      </div>

      <label className="space-y-2">
        <span className="text-sm text-slate-200">ホスト用パスワード</span>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          placeholder="env で設定したパスワード"
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-300 focus:bg-white/10"
        />
      </label>

      <button
        type="button"
        disabled={isPending || password.trim().length === 0}
        onClick={() => login({ password })}
        className="rounded-2xl bg-cyan-300 px-4 py-3 text-base font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "ログイン中..." : "ホストとして入る"}
      </button>

      {demoAvailable ? (
        <button
          type="button"
          disabled={isPending}
          onClick={() => login({ demo: true })}
          className="rounded-2xl border border-white/15 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          ローカルのデモホストで入る
        </button>
      ) : null}

      {message ? (
        <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {message}
        </p>
      ) : null}
    </section>
  );
}
