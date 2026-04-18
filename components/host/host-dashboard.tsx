"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRoomFeed } from "@/hooks/use-room-feed";
import { fetchJson } from "@/lib/fetch-json";
import { formatDateTime } from "@/lib/format";
import { PLAN_CATALOG } from "@/lib/plans";
import type { HostAccount, RoomSnapshot } from "@/lib/types";

interface HostDashboardProps {
  account: HostAccount;
  initialRoom: RoomSnapshot | null;
}

export function HostDashboard({
  account,
  initialRoom,
}: HostDashboardProps) {
  const [room, setRoom] = useState(initialRoom);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useRoomFeed(room?.code ?? null, setRoom);

  const runAction = async (path: string, init?: RequestInit) => {
    const payload = await fetchJson<{ room: RoomSnapshot }>(path, init);
    setRoom(payload.room);
  };

  const perform = (action: () => Promise<void>) => {
    startTransition(async () => {
      try {
        setStatusMessage(null);
        await action();
      } catch (error) {
        setStatusMessage(
          error instanceof Error ? error.message : "操作に失敗しました。",
        );
      }
    });
  };

  const invitePath = room ? `/join/${room.code}` : null;
  const inviteUrl = useMemo(() => {
    if (!invitePath || typeof window === "undefined") {
      return invitePath;
    }

    return `${window.location.origin}${invitePath}`;
  }, [invitePath]);

  return (
    <div className="space-y-5">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
                Host Console
              </p>
              <h1 className="text-3xl font-semibold text-white">
                早押しルームを操作
              </h1>
              <p className="max-w-xl text-sm leading-7 text-slate-300">
                順位判定はサーバーでのみ実行し、同一ラウンドでは1位と2位だけを確定します。
                クライアント時刻には依存しません。
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                perform(async () => {
                  await fetchJson("/api/auth/host-logout", { method: "POST" });
                  window.location.reload();
                })
              }
              className="rounded-2xl border border-white/15 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/5"
            >
              ログアウト
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <article className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Current Plan
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {PLAN_CATALOG[account.plan].name}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                上限 {account.participantLimit} 人 / extra {account.extraPackQuantity} / status {account.status}
              </p>
            </article>
            <article className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Latest Room
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {room?.code ?? "未作成"}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {room ? `${room.participants.length} 人参加中` : "新規ルームを作成してください"}
              </p>
            </article>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                perform(async () => {
                  const payload = await fetchJson<{ room: RoomSnapshot }>(
                    "/api/rooms",
                    {
                      method: "POST",
                    },
                  );
                  setRoom(payload.room);
                })
              }
              className="rounded-2xl bg-cyan-300 px-4 py-4 text-base font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:opacity-60"
            >
              ルーム作成
            </button>
            <button
              type="button"
              disabled={isPending || !room}
              onClick={() =>
                room
                  ? perform(() =>
                      runAction(`/api/rooms/${room.code}/start`, {
                        method: "POST",
                      }),
                    )
                  : null
              }
              className="rounded-2xl border border-emerald-300/35 bg-emerald-300/10 px-4 py-4 text-base font-semibold text-emerald-100 transition hover:bg-emerald-300/15 disabled:opacity-60"
            >
              ラウンド開始
            </button>
            <button
              type="button"
              disabled={isPending || !room}
              onClick={() =>
                room
                  ? perform(() =>
                      runAction(`/api/rooms/${room.code}/reset`, {
                        method: "POST",
                      }),
                    )
                  : null
              }
              className="rounded-2xl border border-amber-300/35 bg-amber-300/10 px-4 py-4 text-base font-semibold text-amber-100 transition hover:bg-amber-300/15 disabled:opacity-60"
            >
              リセット
            </button>
          </div>

          {room && inviteUrl ? (
            <div className="mt-6 space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">参加導線</p>
                  <p className="text-xs text-slate-400">
                    {invitePath} から参加者を誘導します。
                  </p>
                </div>
                <Link
                  href={invitePath ?? "/"}
                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-100 transition hover:bg-white/5"
                >
                  画面を開く
                </Link>
              </div>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteUrl ?? invitePath ?? ""}
                  className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100"
                />
                <button
                  type="button"
                  onClick={() =>
                    navigator.clipboard
                      .writeText(inviteUrl ?? invitePath ?? "")
                      .then(() => setStatusMessage("招待リンクをコピーしました。"))
                      .catch(() =>
                        setStatusMessage("クリップボードへのコピーに失敗しました。"),
                      )
                  }
                  className="rounded-2xl border border-white/15 px-4 py-3 text-sm text-slate-100 transition hover:bg-white/5"
                >
                  コピー
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
            Server Truth
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">現在の判定結果</h2>
          {room ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Round Status
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {room.round.status}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  開始: {formatDateTime(room.round.startedAt)}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  確定: {formatDateTime(room.round.closedAt)}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {[1, 2].map((rank) => {
                  const winner = room.round.winners.find(
                    (entry) => entry.rank === rank,
                  );
                  return (
                    <div
                      key={rank}
                      className="rounded-3xl border border-white/10 bg-white/5 p-4"
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        {rank} 位
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {winner?.name ?? "未確定"}
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        {formatDateTime(winner?.serverReceivedAt ?? null)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <Link
                href="/account"
                className="inline-flex rounded-2xl border border-white/15 px-4 py-3 text-sm text-slate-100 transition hover:bg-white/5"
              >
                契約状況ページへ
              </Link>
            </div>
          ) : (
            <p className="mt-5 text-sm leading-7 text-slate-300">
              ルームを作ると、参加者一覧・判定結果・招待リンクがここに表示されます。
            </p>
          )}
        </aside>
      </section>

      <section className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
              Participants
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">参加者一覧</h2>
          </div>
          {room ? (
            <p className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-100">
              {room.participants.length} / {room.subscription.participantLimit}
            </p>
          ) : null}
        </div>

        {statusMessage ? (
          <p className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
            {statusMessage}
          </p>
        ) : null}

        {room && room.participants.length > 0 ? (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {room.participants.map((participant) => (
              <li
                key={participant.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-semibold text-white">
                    {participant.name}
                  </p>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-200">
                    {participant.lastResult}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-300">
                  参加時刻: {formatDateTime(participant.joinedAt)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 text-sm leading-7 text-slate-300">
            まだ参加者はいません。作成後に招待リンクを共有してください。
          </p>
        )}
      </section>
    </div>
  );
}
