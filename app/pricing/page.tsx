import Link from "next/link";
import { PLAN_CATALOG } from "@/lib/plans";

export default function PricingPage() {
  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
          Pricing
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">料金プラン</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          無料プランは4人までです。有料プランでは人数上限を増やせます。サーバー側の参加処理でも契約状態を検証するため、クライアント改ざんだけでは上限を超えられません。
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {Object.values(PLAN_CATALOG).map((plan) => (
          <article
            key={plan.id}
            className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur"
          >
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
              {plan.name}
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white">
              {plan.priceLabel}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {plan.highlight}
            </p>
            <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100">
              参加上限: {plan.participantLimit} 人
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
        <h2 className="text-2xl font-semibold text-white">課金フロー</h2>
        <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
          <li>Stripe Checkout を使って有料プランへ遷移します。</li>
          <li>Webhook では署名検証を行ってから契約状態を反映します。</li>
          <li>秘密鍵は `.env.local` から読み込み、コードには直書きしません。</li>
        </ul>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/host"
            className="rounded-2xl bg-cyan-300 px-4 py-4 text-center text-base font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            ホストとして始める
          </Link>
          <Link
            href="/account"
            className="rounded-2xl border border-white/15 px-4 py-4 text-center text-base font-semibold text-slate-100 transition hover:bg-white/5"
          >
            契約状況を見る
          </Link>
        </div>
      </section>
    </div>
  );
}
