import Link from "next/link";

const features = [
  "ホストだけログイン。参加者はURLと表示名だけで参加",
  "順位判定はサーバー側で実施し、クライアント時刻を使わない",
  "同一ラウンドで1位と2位だけを確定",
  "無料は4人まで。有料化で参加人数上限を拡張",
];

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur sm:p-8">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
            Mobile First MVP
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            スマホだけで始める
            <br />
            早押し Web アプリ
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
            Next.js App Router と Route Handlers を前提にした MVP です。
            まずはダミーデータで動かしつつ、Supabase Broadcast と Stripe の差し替え口を先に揃えています。
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Link
              href="/host"
              className="rounded-2xl bg-cyan-300 px-4 py-4 text-center text-base font-semibold text-slate-950 transition hover:bg-cyan-200"
            >
              ホスト画面へ
            </Link>
            <Link
              href="/join/DEMO42"
              className="rounded-2xl border border-white/15 px-4 py-4 text-center text-base font-semibold text-slate-100 transition hover:bg-white/5"
            >
              DEMO 参加導線
            </Link>
            <Link
              href="/pricing"
              className="rounded-2xl border border-white/15 px-4 py-4 text-center text-base font-semibold text-slate-100 transition hover:bg-white/5"
            >
              料金ページ
            </Link>
          </div>
        </div>

        <aside className="rounded-[2rem] border border-cyan-300/20 bg-[linear-gradient(160deg,rgba(34,211,238,0.16),rgba(15,23,42,0.85))] p-6 shadow-[0_24px_80px_-28px_rgba(34,211,238,0.65)]">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-100">
            Fixed Spec
          </p>
          <ul className="mt-5 space-y-3">
            {features.map((feature) => (
              <li
                key={feature}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-7 text-slate-50"
              >
                {feature}
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "/host",
            copy: "ルーム作成、参加者一覧、ラウンド開始、リセットを集約したホスト専用画面。",
          },
          {
            title: "/join/[code]",
            copy: "参加リンクを開いた直後の導線。ルーム情報と参加ボタンを表示。",
          },
          {
            title: "/room/[code]",
            copy: "名前入力、待機状態、大きなボタン、結果表示を1画面で完結。",
          },
          {
            title: "/account",
            copy: "契約状況と参加上限の確認。開発環境ではローカル模擬切り替えに対応。",
          },
        ].map((item) => (
          <article
            key={item.title}
            className="rounded-[1.75rem] border border-white/15 bg-slate-950/70 p-5 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur"
          >
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">
              Route
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">{item.copy}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
