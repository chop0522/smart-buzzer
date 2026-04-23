import Link from "next/link";
import { LegalLinks } from "@/components/legal/legal-links";
import { LEGAL_BUSINESS_INFO } from "@/lib/legal";

const features = [
  "ホストがブラウザから早押しルームを作成",
  "参加者はURLと表示名だけでスマートフォンから参加",
  "ラウンド開始、リセット、参加者一覧をホスト画面で管理",
  "無料プランから有料プランまで参加人数上限を選択可能",
];

const useCases = [
  {
    title: "イベント・店舗クイズ",
    copy: "参加者のスマートフォンを使い、専用機材なしで早押し企画を始められます。",
  },
  {
    title: "オンライン配信・勉強会",
    copy: "URL共有で参加導線を作り、ホストが進行とラウンド状態を管理できます。",
  },
  {
    title: "少人数から中規模まで",
    copy: "Free、Starter、Pro、Extra Pack により、必要な参加人数に合わせて選択できます。",
  },
];

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur sm:p-8">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
            Mobile First Buzzer
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            スマホだけで始める
            <br />
            早押し Web アプリ
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
            Smart Buzzer は、クイズやイベント向けにホストが早押しルームを作成し、
            参加者がスマートフォンのブラウザからリアルタイムに参加できるWebサービスです。
            料金、解約方法、返金方針、問い合わせ先は公開ページで確認できます。
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Link
              href="/pricing"
              className="rounded-2xl bg-cyan-300 px-4 py-4 text-center text-base font-semibold text-slate-950 transition hover:bg-cyan-200"
            >
              料金ページ
            </Link>
            <Link
              href="/join/DEMO42"
              className="rounded-2xl border border-white/15 px-4 py-4 text-center text-base font-semibold text-slate-100 transition hover:bg-white/5"
            >
              DEMO 参加導線
            </Link>
            <Link
              href="/legal/tokushoho"
              className="rounded-2xl border border-white/15 px-4 py-4 text-center text-base font-semibold text-slate-100 transition hover:bg-white/5"
            >
              事業者情報
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

      <section className="grid gap-4 lg:grid-cols-3">
        {useCases.map((item) => (
          <article
            key={item.title}
            className="rounded-[1.75rem] border border-white/15 bg-slate-950/70 p-5 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur"
          >
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">
              Use Case
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">{item.copy}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
          Customer Support
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          料金・契約・問い合わせ
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Starter / Pro / Extra Pack は月額課金で、決済は Stripe Checkout
          を通じて安全に処理されます。導入相談、請求、解約、返金に関する問い合わせは
          {LEGAL_BUSINESS_INFO.email} で受け付けています。
        </p>
        <div className="mt-5">
          <LegalLinks />
        </div>
      </section>
    </div>
  );
}
