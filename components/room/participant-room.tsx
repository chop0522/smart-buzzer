"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRoomFeed } from "@/hooks/use-room-feed";
import { fetchJson } from "@/lib/fetch-json";
import type { Participant, RoomSnapshot } from "@/lib/types";

const storageKey = (code: string) => `smart-buzzer:${code}:participant`;

function resolveResultLabel(room: RoomSnapshot | null, participantId: string | null) {
  if (!room || !participantId) {
    return "waiting";
  }

  const participant = room.participants.find((entry) => entry.id === participantId);
  return participant?.lastResult ?? "waiting";
}

export function ParticipantRoom({
  code,
  initialRoom,
}: {
  code: string;
  initialRoom: RoomSnapshot | null;
}) {
  const [room, setRoom] = useState(initialRoom);
  const [name, setName] = useState("");
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useRoomFeed(code, setRoom);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey(code));
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Participant;
      queueMicrotask(() => {
        setParticipantId(parsed.id);
        setName(parsed.name);
      });
    } catch {
      window.localStorage.removeItem(storageKey(code));
    }
  }, [code]);

  useEffect(() => {
    if (!participantId || name.trim().length === 0) {
      return;
    }

    const latest = room?.participants.find((entry) => entry.id === participantId);
    const snapshot = latest ?? {
      id: participantId,
      name,
      joinedAt: "",
      lastResult: "waiting",
    };
    window.localStorage.setItem(storageKey(code), JSON.stringify(snapshot));
  }, [code, name, participantId, room]);

  const participant = useMemo(() => {
    if (!participantId) {
      return null;
    }

    return room?.participants.find((entry) => entry.id === participantId) ?? null;
  }, [participantId, room]);

  const result = useMemo(
    () => resolveResultLabel(room, participantId),
    [participantId, room],
  );

  const joinRoom = () => {
    startTransition(async () => {
      try {
        const payload = await fetchJson<{
          room: RoomSnapshot;
          participant: Participant;
        }>(`/api/rooms/${code}/join`, {
          method: "POST",
          body: JSON.stringify({ name }),
        });

        setRoom(payload.room);
        setParticipantId(payload.participant.id);
        setName(payload.participant.name);
        window.localStorage.setItem(
          storageKey(code),
          JSON.stringify(payload.participant),
        );
        setMessage(null);
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "参加に失敗しました。",
        );
      }
    });
  };

  const buzz = () => {
    if (!participantId) {
      return;
    }

    startTransition(async () => {
      try {
        const payload = await fetchJson<{ room: RoomSnapshot }>(
          `/api/rooms/${code}/buzz`,
          {
            method: "POST",
            body: JSON.stringify({ participantId }),
          },
        );
        setRoom(payload.room);
        setMessage(null);
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "回答送信に失敗しました。",
        );
      }
    });
  };

  const canBuzz =
    Boolean(participantId) &&
    room?.round.status === "open" &&
    result === "waiting";

  const winnerCards = room?.round.winners ?? [];

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
          Guest Room
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          ルーム {code}
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          参加者はゲスト参加です。サーバーが到着順を判定し、1位と2位だけを確定します。
        </p>

        {room ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <article className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Round
              </p>
              <p className="mt-2 text-xl font-semibold text-white">
                {room.round.status}
              </p>
            </article>
            <article className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Participants
              </p>
              <p className="mt-2 text-xl font-semibold text-white">
                {room.participants.length} / {room.subscription.participantLimit}
              </p>
            </article>
            <article className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Plan
              </p>
              <p className="mt-2 text-xl font-semibold text-white">
                {room.subscription.plan}
              </p>
            </article>
          </div>
        ) : (
          <div className="mt-5 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-7 text-amber-50">
            このルームはまだ存在しません。ホストが作成してから再度アクセスしてください。
          </div>
        )}
      </section>

      <section className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
              Entry
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">参加者情報</h2>
          </div>

          {!participantId ? (
            <div className="space-y-4">
              <label className="space-y-2">
                <span className="text-sm text-slate-200">表示名</span>
                <input
                  aria-label="表示名"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="2文字以上で入力"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white outline-none transition focus:border-cyan-300 focus:bg-white/10"
                />
              </label>

              <button
                type="button"
                disabled={isPending || !room || name.trim().length < 2}
                onClick={joinRoom}
                className="w-full rounded-2xl bg-cyan-300 px-4 py-4 text-base font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "参加中..." : "この名前で参加"}
              </button>
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-300">参加者名</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {participant?.name ?? name}
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {room?.round.status === "idle"
                  ? "ホストがラウンドを開始するのを待っています。"
                  : room?.round.status === "open"
                    ? "ラウンド受付中です。準備ができたらボタンを押してください。"
                    : "このラウンドは確定済みです。ホストのリセットを待ってください。"}
              </p>
            </div>
          )}

          {message ? (
            <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {message}
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
            Buzzer
          </p>
          <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <button
              type="button"
              disabled={!canBuzz || isPending}
              onClick={buzz}
              className="aspect-square min-h-64 rounded-[2.5rem] border border-cyan-200/20 bg-[radial-gradient(circle_at_top,_rgba(103,232,249,0.5),_rgba(6,182,212,0.12)_45%,_rgba(15,23,42,0.95)_75%)] p-6 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_30px_80px_-30px_rgba(34,211,238,0.7)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="block text-sm uppercase tracking-[0.28em] text-cyan-100/80">
                Buzz
              </span>
              <span className="mt-6 block text-5xl font-semibold text-white">
                TAP
              </span>
              <span className="mt-4 block max-w-xs text-sm leading-7 text-cyan-50/80">
                サーバー到着順で判定されます。クライアント時刻は使用しません。
              </span>
            </button>

            <div className="space-y-3">
              <article className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  あなたの状態
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">{result}</p>
              </article>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {[1, 2].map((rank) => {
                  const winner = winnerCards.find((entry) => entry.rank === rank);
                  return (
                    <article
                      key={rank}
                      className="rounded-3xl border border-white/10 bg-white/5 p-4"
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        {rank} 位
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {winner?.name ?? "未確定"}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
              Results
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">結果表示</h2>
          </div>
          <Link
            href={`/join/${code}`}
            className="rounded-2xl border border-white/15 px-4 py-3 text-sm text-slate-100 transition hover:bg-white/5"
          >
            参加導線に戻る
          </Link>
        </div>

        {room?.participants.length ? (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {room.participants.map((entry) => (
              <li
                key={entry.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-semibold text-white">{entry.name}</p>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-200">
                    {entry.lastResult}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 text-sm leading-7 text-slate-300">
            まだ参加者はいません。まずは名前を入力して参加してください。
          </p>
        )}
      </section>
    </div>
  );
}
