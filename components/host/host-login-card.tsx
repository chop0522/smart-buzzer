"use client";

import { useState, useTransition } from "react";
import { fetchJson } from "@/lib/fetch-json";

const authModes = [
  { value: "sign-in", label: "ログイン" },
  { value: "sign-up", label: "無料登録" },
] as const;

export function HostLoginCard({
  demoAvailable,
  useSupabaseAuth = false,
}: {
  demoAvailable: boolean;
  useSupabaseAuth?: boolean;
}) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const login = (
    payload: {
      email?: string;
      password?: string;
      displayName?: string;
      demo?: boolean;
      intent?: "sign-in" | "sign-up";
    },
    successMessage?: string,
  ) => {
    startTransition(async () => {
      try {
        const response = await fetchJson<{
          requiresEmailConfirmation?: boolean;
        }>("/api/auth/host-login", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (response.requiresEmailConfirmation) {
          setMessage(
            successMessage ??
              "確認メールを送信しました。メールを確認してからログインしてください。",
          );
          return;
        }

        window.location.reload();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "ログインに失敗しました。");
      }
    });
  };

  const isSignUp = useSupabaseAuth && mode === "sign-up";
  const isPrimaryDisabled =
    isPending ||
    password.trim().length === 0 ||
    (useSupabaseAuth && email.trim().length === 0) ||
    (isSignUp && password.trim().length < 6);

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
          Host
        </p>
        <h1 className="text-3xl font-semibold text-white">
          {isSignUp ? "無料でホスト登録" : "ホストログイン"}
        </h1>
        <p className="text-sm leading-7 text-slate-300">
          {useSupabaseAuth
            ? "ホストはメールアドレスで管理画面に入ります。参加者は登録不要のゲスト参加です。"
            : "参加者はゲスト参加です。ホストはサーバー側で検証されるセッションを取得してから、ルーム作成とラウンド操作を行います。"}
        </p>
      </div>

      {useSupabaseAuth ? (
        <div className="grid grid-cols-2 rounded-2xl border border-white/10 bg-white/5 p-1">
          {authModes.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setMode(value);
                setMessage(null);
              }}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                mode === value
                  ? "bg-cyan-300 text-slate-950"
                  : "text-slate-200 hover:bg-white/5"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {useSupabaseAuth ? (
        <>
          <label className="space-y-2">
            <span className="text-sm text-slate-200">メールアドレス</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="host@example.com"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-300 focus:bg-white/10"
            />
          </label>
          {isSignUp ? (
            <label className="space-y-2">
              <span className="text-sm text-slate-200">表示名</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                type="text"
                placeholder="ルームに表示するホスト名"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-300 focus:bg-white/10"
              />
            </label>
          ) : null}
          <label className="space-y-2">
            <span className="text-sm text-slate-200">パスワード</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="6文字以上"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-300 focus:bg-white/10"
            />
          </label>
          {isSignUp ? (
            <p className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm leading-6 text-cyan-50">
              登録直後は Free プランです。4人までのルームを作成できます。
            </p>
          ) : null}
        </>
      ) : (
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
      )}

      <button
        type="button"
        disabled={isPrimaryDisabled}
        onClick={() =>
          login(
            {
              email,
              password,
              displayName,
              intent: isSignUp ? "sign-up" : "sign-in",
            },
            "ホストアカウントを作成しました。確認メールが有効な場合は承認後にログインしてください。",
          )
        }
        className="rounded-2xl bg-cyan-300 px-4 py-3 text-base font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending
          ? "送信中..."
          : isSignUp
            ? "無料でホスト登録"
            : "ホストとして入る"}
      </button>

      {demoAvailable && !useSupabaseAuth ? (
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
