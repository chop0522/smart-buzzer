import Link from "next/link";
import { LegalLinks } from "@/components/legal/legal-links";
import {
  EXTRA_PACK_INCREMENT,
  EXTRA_PACK_PRICE_LABEL,
  PLAN_ORDER,
  PLAN_CATALOG,
} from "@/lib/plans";

const comparisonRows = [
  {
    label: "ベース人数上限",
    values: {
      free: "4人",
      starter: "8人",
      pro: "16人",
    },
  },
  {
    label: "Extra Pack",
    values: {
      free: "追加不可",
      starter: `+${EXTRA_PACK_INCREMENT}人 / quantity (${EXTRA_PACK_PRICE_LABEL})`,
      pro: `+${EXTRA_PACK_INCREMENT}人 / quantity (${EXTRA_PACK_PRICE_LABEL})`,
    },
  },
  {
    label: "想定用途",
    values: {
      free: "試用・小規模",
      starter: "少人数イベント",
      pro: "中規模イベント",
    },
  },
];

const paidPlans = PLAN_ORDER.filter((plan) => plan !== "free");

export default function PricingPage() {
  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
          Pricing
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">料金プラン比較</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          無料プランは 4 人までです。Starter は 月額 980 円で 8 人、Pro は
          月額 1,980 円で 16 人まで。Extra Pack は 月額 580 円 / quantity で
          1 つ追加するごとに +4 人され、Checkout / webhook / participant
          参加時のすべてでサーバー側が人数上限を検証します。
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {PLAN_ORDER.map((plan) => {
          const catalog = PLAN_CATALOG[plan];
          const emphasized = plan !== "free";

          return (
            <article
              key={plan}
              className={`rounded-[2rem] border p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur ${
                emphasized
                  ? "border-cyan-300/20 bg-[linear-gradient(160deg,rgba(34,211,238,0.12),rgba(15,23,42,0.88))]"
                  : "border-white/15 bg-slate-950/70"
              }`}
            >
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
                {catalog.name}
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-white">
                {catalog.priceLabel}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {catalog.description}
              </p>
              <p className="mt-4 rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-slate-100">
                参加上限: {catalog.participantLimit} 人
              </p>
              <p className="mt-3 text-sm text-slate-300">{catalog.highlight}</p>
            </article>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/15 bg-slate-950/70 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
        <div className="border-b border-white/10 px-6 py-5">
          <h2 className="text-2xl font-semibold text-white">比較表</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-slate-200">
            <thead className="bg-white/5 text-left">
              <tr>
                <th className="px-6 py-4 font-medium text-slate-300">項目</th>
                {PLAN_ORDER.map((plan) => (
                  <th key={plan} className="px-6 py-4 font-medium text-white">
                    {PLAN_CATALOG[plan].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.label} className="border-t border-white/10">
                  <td className="px-6 py-4 text-slate-300">{row.label}</td>
                  {PLAN_ORDER.map((plan) => (
                    <td key={plan} className="px-6 py-4">
                      {row.values[plan]}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-white/10">
                <td className="px-6 py-4 text-slate-300">契約変更</td>
                <td className="px-6 py-4">不要</td>
                {paidPlans.map((plan) => (
                  <td key={plan} className="px-6 py-4">
                    Stripe Checkout / Customer Portal
                  </td>
                ))}
              </tr>
              <tr className="border-t border-white/10">
                <td className="px-6 py-4 text-slate-300">価格</td>
                <td className="px-6 py-4">¥0 / month</td>
                <td className="px-6 py-4">¥980 / month</td>
                <td className="px-6 py-4">¥1,980 / month</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/15 bg-[linear-gradient(160deg,rgba(14,165,233,0.12),rgba(15,23,42,0.88))] p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
          Add-on
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Extra Pack
        </h2>
        <p className="mt-3 text-3xl font-semibold text-white">
          {EXTRA_PACK_PRICE_LABEL}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Starter / Pro に追加できる可変 quantity の recurring Price です。1
          quantity ごとに {EXTRA_PACK_INCREMENT} 人増えます。quantity が 0
          のときは Checkout の line item に含めません。
        </p>
      </section>

      <section className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
        <h2 className="text-2xl font-semibold text-white">Billing フロー</h2>
        <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
          <li>Starter / Pro / Extra Pack quantity を Checkout Session の `line_items` で作成します。</li>
          <li>Customer Portal ではプラン変更、支払い方法更新、解約導線を開けます。</li>
          <li>Webhook では署名検証後に `subscriptions` テーブルへ契約状態を保存します。</li>
          <li>ルーム作成時と participant 参加時はサーバー側で人数上限を再計算して検証します。</li>
        </ul>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/account"
            className="rounded-2xl bg-cyan-300 px-4 py-4 text-center text-base font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            契約状況ページへ
          </Link>
          <Link
            href="/host"
            className="rounded-2xl border border-white/15 px-4 py-4 text-center text-base font-semibold text-slate-100 transition hover:bg-white/5"
          >
            ホスト画面へ
          </Link>
        </div>
      </section>

      <section className="rounded-[2rem] border border-amber-300/25 bg-amber-300/10 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-amber-100">
          Checkout 前の確認
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          月額課金と法務ページ
        </h2>
        <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-100">
          <li>Starter は月額 980 円（税込）、Pro は月額 1,980 円（税込）です。</li>
          <li>
            Extra Pack は 1 個あたり月額 580 円（税込）で、1 個ごとに
            {EXTRA_PACK_INCREMENT} 人分拡張されます。
          </li>
          <li>有料プランは月単位で自動更新されます。</li>
          <li>解約はアカウント画面の請求管理から行えます。</li>
          <li>支払済み料金の日割り返金は原則として行いません。</li>
        </ul>
        <div className="mt-5">
          <LegalLinks />
        </div>
      </section>
    </div>
  );
}
