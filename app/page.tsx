import Link from "next/link";
import { LegalLinks } from "@/components/legal/legal-links";

const steps = [
  {
    label: "01",
    title: "ホスト登録",
    copy: "メールとパスワードで作成。Free は4人まで使えます。",
  },
  {
    label: "02",
    title: "ルーム作成",
    copy: "ホスト画面でルームを作り、参加URLを共有します。",
  },
  {
    label: "03",
    title: "早押し開始",
    copy: "参加者は名前だけで入り、スマホからボタンを押します。",
  },
];

const planHighlights = [
  ["Free", "4人", "まず試す"],
  ["Starter", "8人", "小規模イベント"],
  ["Pro", "16人", "中規模運用"],
];

export default function Home() {
  return (
    <div className="space-y-5">
      <section className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur sm:p-8">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
            Smart Buzzer
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold text-white sm:text-5xl">
            早押しルームを作って、
            <br className="hidden sm:block" />
            参加URLを配るだけ。
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
            参加者はアプリ登録不要。ホストはブラウザでルームを作成し、
            スマートフォン参加者の早押し順をサーバー側で判定します。
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-[1.2fr_1fr_1fr]">
            <Link
              href="/host"
              className="rounded-2xl bg-cyan-300 px-4 py-4 text-center text-base font-semibold text-slate-950 transition hover:bg-cyan-200"
            >
              無料でホスト登録
            </Link>
            <Link
              href="/join/DEMO42"
              className="rounded-2xl border border-white/15 px-4 py-4 text-center text-base font-semibold text-slate-100 transition hover:bg-white/5"
            >
              参加デモ
            </Link>
            <Link
              href="/pricing"
              className="rounded-2xl border border-white/15 px-4 py-4 text-center text-base font-semibold text-slate-100 transition hover:bg-white/5"
            >
              料金を見る
            </Link>
          </div>
        </div>

        <aside className="rounded-[2rem] border border-cyan-300/20 bg-[linear-gradient(160deg,rgba(34,211,238,0.14),rgba(15,23,42,0.9))] p-6 shadow-[0_24px_80px_-28px_rgba(34,211,238,0.55)]">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-100">
            Start Flow
          </p>
          <div className="mt-5 space-y-3">
            {steps.map((step) => (
              <div
                key={step.label}
                className="grid grid-cols-[3rem_1fr] gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <span className="font-display text-sm font-semibold text-cyan-200">
                  {step.label}
                </span>
                <div>
                  <h2 className="text-base font-semibold text-white">{step.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{step.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {planHighlights.map(([name, limit, useCase]) => (
          <article
            key={name}
            className="rounded-3xl border border-white/15 bg-slate-950/65 p-5 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur"
          >
            <p className="text-sm font-medium text-cyan-300">{name}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{limit}</p>
            <p className="mt-2 text-sm text-slate-300">{useCase}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[2rem] border border-white/15 bg-slate-950/65 p-5 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-7 text-slate-300">
            料金、解約、返金、事業者情報は公開ページから確認できます。
          </p>
          <LegalLinks />
        </div>
      </section>
    </div>
  );
}
