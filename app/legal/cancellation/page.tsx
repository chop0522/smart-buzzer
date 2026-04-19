import { LEGAL_PAYMENT_SUMMARY } from "@/lib/legal";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

const cancellationPoints = [
  "有料プランは月単位で自動更新されます。",
  "解約はアカウント画面の請求管理からいつでも行えます。",
  "解約後も、現在の請求期間の終了までは有料機能を利用できます。",
  "次回更新日以降は無料プランへ戻ります。",
  "支払済み料金の日割り返金は原則として行いません。",
  "誤課金、二重課金、システム不具合等で必要と判断した場合のみ個別に返金対応を行うことがあります。",
] as const;

export default function CancellationPage() {
  return (
    <LegalPageShell
      eyebrow="Legal"
      title="解約・返金ポリシー"
      description="月額課金の更新、解約、返金に関する基本方針です。実運用に合わせて、返金条件やサポート窓口を最終確認してください。"
    >
      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
          <h2 className="text-2xl font-semibold text-white">解約ポリシー</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
            {cancellationPoints.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
          <h2 className="text-2xl font-semibold text-white">課金前の確認事項</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
            {LEGAL_PAYMENT_SUMMARY.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Stripe Checkout に進む前に、料金、月額課金、自動更新、解約方法、返金方針を必ず確認してください。
          </p>
        </article>
      </section>
    </LegalPageShell>
  );
}
