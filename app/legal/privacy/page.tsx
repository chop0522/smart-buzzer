import {
  LEGAL_BUSINESS_INFO,
  LEGAL_PRIVACY_DATA_POINTS,
  LEGAL_PRIVACY_PURPOSES,
  LEGAL_SERVICE_NAME,
  getLegalValue,
} from "@/lib/legal";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Legal"
      title="プライバシーポリシー"
      description="本サービスで取得する情報、利用目的、外部サービス利用、問い合わせ窓口を記載しています。live 前に問い合わせ先等を実データへ差し替えてください。"
    >
      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
          <h2 className="text-2xl font-semibold text-white">取得する情報</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
            {LEGAL_PRIVACY_DATA_POINTS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            カード番号等の決済情報そのものは、当サービスでは保存せず、Stripe により処理されます。
          </p>
        </article>

        <article className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
          <h2 className="text-2xl font-semibold text-white">利用目的</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
            {LEGAL_PRIVACY_PURPOSES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
          <h2 className="text-2xl font-semibold text-white">外部サービス</h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
            <p>
              {LEGAL_SERVICE_NAME}
              は、認証・データ保存・課金処理・配信のために外部サービスを利用します。
            </p>
            <p>
              現時点の構成では、Stripe、Supabase、Vercel 等の事業者が提供するサービスを利用する可能性があります。
            </p>
            <p>
              法令に基づく場合を除き、個人データを第三者へ提供する際には、適切な法的根拠と運用手順に従います。
            </p>
          </div>
        </article>

        <article className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
          <h2 className="text-2xl font-semibold text-white">開示・お問い合わせ</h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
            <p>
              保有個人データの開示、訂正、利用停止、削除等を希望する場合は、下記窓口までお問い合わせください。
            </p>
            <p>お問い合わせ先: {getLegalValue(LEGAL_BUSINESS_INFO.email, "メールアドレス")}</p>
            <p>受付時間: {getLegalValue(LEGAL_BUSINESS_INFO.businessHours, "受付時間")}</p>
            <p>
              本ポリシーは、法令やサービス内容の変更に応じて改定することがあります。重要な変更がある場合は、本ページ等で公表します。
            </p>
          </div>
        </article>
      </section>
    </LegalPageShell>
  );
}
