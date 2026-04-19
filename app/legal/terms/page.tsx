import { LEGAL_BUSINESS_INFO, LEGAL_SERVICE_NAME, getLegalValue } from "@/lib/legal";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

const sections = [
  {
    title: "1. 適用",
    body:
      `本規約は、${LEGAL_SERVICE_NAME} の利用条件を定めるものです。ホストアカウントの登録者および本サービスを利用する参加者は、本規約に従って本サービスを利用するものとします。`,
  },
  {
    title: "2. サービス内容",
    body:
      "本サービスは、スマートフォンやブラウザから利用できる早押し進行支援サービスです。ホストはルームを作成し、参加者は表示名を入力して参加します。順位判定や参加人数上限の検証はサーバー側で行われます。",
  },
  {
    title: "3. ホストアカウント",
    body:
      "ホストは登録情報を正確に管理し、第三者にアカウントを貸与しないものとします。登録情報に変更があった場合は、速やかに最新状態へ更新してください。",
  },
  {
    title: "4. 有料プラン",
    body:
      "有料プランは月単位で自動更新されます。Starter、Pro、Extra Pack の料金、課金周期、解約方法、返金方針は、料金ページ、アカウント画面、特定商取引法に基づく表記、解約・返金ポリシーに表示します。",
  },
  {
    title: "5. 禁止事項",
    body:
      "不正アクセス、他者のなりすまし、システムへの過度な負荷、法令違反、公序良俗違反、知的財産権の侵害、本サービスの運営を妨げる行為を禁止します。",
  },
  {
    title: "6. サービス変更・停止",
    body:
      "当方は、保守、障害対応、法令対応、改善のために、本サービスの全部または一部を変更、停止、終了することがあります。",
  },
  {
    title: "7. 免責",
    body:
      "当方は、本サービスの完全性、正確性、継続性、特定目的適合性を保証しません。ただし、法令上免責が認められない場合を除きます。",
  },
  {
    title: "8. 準拠法・管轄",
    body: `本規約の準拠法は日本法とします。紛争が生じた場合は、${getLegalValue(
      LEGAL_BUSINESS_INFO.governingCourt,
      "管轄裁判所",
    )} を第一審の専属的合意管轄裁判所とします。`,
  },
] as const;

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Legal"
      title="利用規約"
      description="本サービスの利用条件を定めています。実公開前に、運営主体や裁判管轄などの未設定情報を実データへ差し替えてください。"
    >
      <section className="space-y-4">
        {sections.map((section) => (
          <article
            key={section.title}
            className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur"
          >
            <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">{section.body}</p>
          </article>
        ))}
      </section>
    </LegalPageShell>
  );
}
