"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { fetchJson } from "@/lib/fetch-json";

export function HostPasswordResetCard() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isDisabled =
    isPending ||
    password.trim().length < 6 ||
    password !== confirmation;

  const updatePassword = () => {
    setMessage(null);

    startTransition(async () => {
      try {
        await fetchJson("/api/auth/password", {
          method: "POST",
          body: JSON.stringify({ password }),
        });
        setIsComplete(true);
        setPassword("");
        setConfirmation("");
        setMessage("パスワードを更新しました。新しいパスワードでログインできます。");
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "パスワードの更新に失敗しました。",
        );
      }
    });
  };

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
          Password Reset
        </p>
        <h1 className="text-3xl font-semibold text-white">パスワード再設定</h1>
        <p className="text-sm leading-7 text-slate-300">
          確認メールのリンクを開いた後、新しいホスト用パスワードを設定します。
        </p>
      </div>

      {!isComplete ? (
        <>
          <label className="space-y-2">
            <span className="text-sm text-slate-200">新しいパスワード</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="6文字以上"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-300 focus:bg-white/10"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-200">確認用パスワード</span>
            <input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              type="password"
              placeholder="もう一度入力"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-300 focus:bg-white/10"
            />
          </label>
          {password && confirmation && password !== confirmation ? (
            <p className="text-sm text-rose-200">
              確認用パスワードが一致していません。
            </p>
          ) : null}
          <button
            type="button"
            disabled={isDisabled}
            onClick={updatePassword}
            className="rounded-2xl bg-cyan-300 px-4 py-3 text-base font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "更新中..." : "パスワードを更新"}
          </button>
        </>
      ) : (
        <Link
          href="/host"
          className="rounded-2xl bg-cyan-300 px-4 py-3 text-center text-base font-semibold text-slate-950 transition hover:bg-cyan-200"
        >
          ホストログインへ戻る
        </Link>
      )}

      {message ? (
        <p
          className={`rounded-2xl border px-4 py-3 text-sm ${
            isComplete
              ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-50"
              : "border-rose-400/20 bg-rose-400/10 text-rose-100"
          }`}
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
