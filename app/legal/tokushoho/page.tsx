import {
  LEGAL_BUSINESS_INFO,
  LEGAL_ENVIRONMENT_NOTES,
  LEGAL_PAYMENT_SUMMARY,
  LEGAL_SERVICE_NAME,
  getLegalValue,
} from "@/lib/legal";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

const fieldRows = [
  {
    label: "販売事業者",
    value: getLegalValue(LEGAL_BUSINESS_INFO.sellerName, "販売事業者"),
  },
  {
    label: "運営責任者",
    value: getLegalValue(LEGAL_BUSINESS_INFO.operatorName, "運営責任者"),
  },
  {
    label: "所在地",
    value: getLegalValue(LEGAL_BUSINESS_INFO.address, "所在地"),
  },
  {
    label: "電話番号",
    value: getLegalValue(LEGAL_BUSINESS_INFO.phone, "電話番号"),
  },
  {
    label: "メールアドレス",
    value: getLegalValue(LEGAL_BUSINESS_INFO.email, "メールアドレス"),
  },
  {
    label: "受付時間",
    value: getLegalValue(LEGAL_BUSINESS_INFO.businessHours, "受付時間"),
  },
  {
    label: "サービス名",
    value: LEGAL_SERVICE_NAME,
  },
  {
    label: "支払方法",
    value: "クレジットカード決済。決済処理は Stripe Checkout を通じて行います。",
  },
  {
    label: "支払時期",
    value: "初回申込時および契約更新時に課金されます。",
  },
  {
    label: "サービス提供時期",
    value: "決済完了後、直ちに有料機能を利用できます。",
  },
  {
    label: "解約方法",
    value: "アカウント画面の請求管理からいつでも解約できます。",
  },
  {
    label: "返金について",
    value:
      "支払済み料金の日割り返金は原則として行いません。誤課金やシステム不具合など、当方が必要と判断した場合のみ個別に対応します。",
  },
  {
    label: "管轄裁判所",
    value: getLegalValue(LEGAL_BUSINESS_INFO.governingCourt, "管轄裁判所"),
  },
] as const;

export default function TokushohoPage() {
  return (
    <LegalPageShell
      eyebrow="Legal"
      title="特定商取引法に基づく表記"
      description="通信販売に関する表示事項をまとめています。live 課金開始前に、事業者情報と問い合わせ先を実データへ差し替えてください。"
    >
      <section className="overflow-hidden rounded-[2rem] border border-white/15 bg-slate-950/70 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
        <div className="border-b border-white/10 px-6 py-5">
          <h2 className="text-2xl font-semibold text-white">表示事項</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-slate-200">
            <tbody>
              {fieldRows.map((row) => (
                <tr key={row.label} className="border-t border-white/10 align-top first:border-t-0">
                  <th className="w-56 bg-white/5 px-6 py-4 text-left font-medium text-slate-300">
                    {row.label}
                  </th>
                  <td className="px-6 py-4 leading-7">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
          <h2 className="text-2xl font-semibold text-white">販売価格</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
            {LEGAL_PAYMENT_SUMMARY.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            商品代金以外に必要となる通信料金、インターネット接続料金、端末代金等はお客様の負担となります。
          </p>
        </article>

        <article className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
          <h2 className="text-2xl font-semibold text-white">動作環境</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
            {LEGAL_ENVIRONMENT_NOTES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>
    </LegalPageShell>
  );
}
