import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/env";
import { getRoomSnapshot } from "@/lib/room-store";
import { createClient } from "@/lib/supabase/server";
import { getRoomSnapshotFromSupabase } from "@/lib/supabase-room-service";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const normalizedCode = code.toUpperCase();
  const room = isSupabaseConfigured()
    ? await getRoomSnapshotFromSupabase(await createClient(), normalizedCode)
    : getRoomSnapshot(normalizedCode);
  const isAtCapacity = room
    ? room.participants.length >= room.subscription.participantLimit
    : false;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <section className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
          Join
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          ルーム {normalizedCode} に参加
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          参加者はゲスト参加です。次の画面で表示名を入力し、ラウンド開始後に大きなボタンを押します。
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Room Status
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {room ? room.round.status : "unknown"}
            </p>
          </article>
          <article className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Capacity
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {room
                ? `${room.participants.length} / ${room.subscription.participantLimit}`
                : "ホスト作成待ち"}
            </p>
          </article>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/room/${normalizedCode}`}
            className="rounded-2xl bg-cyan-300 px-4 py-4 text-center text-base font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            参加画面へ進む
          </Link>
          <Link
            href="/"
            className="rounded-2xl border border-white/15 px-4 py-4 text-center text-base font-semibold text-slate-100 transition hover:bg-white/5"
          >
            トップへ戻る
          </Link>
        </div>

        {isAtCapacity ? (
          <div className="mt-4 rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-7 text-amber-50">
            このルームは現在満員です。ホストは `/account` または `/pricing` から Starter / Pro / Extra Pack を追加してください。
          </div>
        ) : null}
      </section>
    </div>
  );
}
