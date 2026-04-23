import { EXTRA_PACK_INCREMENT, EXTRA_PACK_PRICE_LABEL, PLAN_CATALOG } from "@/lib/plans";

export const LEGAL_LAST_UPDATED = "2026-04-23";
export const LEGAL_SERVICE_NAME = "Smart Buzzer";

export const LEGAL_LINKS = [
  {
    href: "/legal/tokushoho",
    label: "特定商取引法に基づく表記",
  },
  {
    href: "/legal/terms",
    label: "利用規約",
  },
  {
    href: "/legal/privacy",
    label: "プライバシーポリシー",
  },
  {
    href: "/legal/cancellation",
    label: "解約・返金ポリシー",
  },
] as const;

export const LEGAL_BUSINESS_INFO = {
  sellerName: "田中裕也",
  operatorName: "田中裕也",
  address: "千葉県市川市湊新田2−1−18 ビアメゾンロジェール１０１",
  phone: "090-4051-7011",
  email: "smartbuzzer.support@gmail.com",
  businessHours: "11:00-20:00",
  governingCourt: "千葉地方裁判所又は千葉簡易裁判所",
} as const;

export const LEGAL_REQUIRED_FIELDS = [
  { key: "sellerName", label: "販売事業者" },
  { key: "operatorName", label: "運営責任者" },
  { key: "address", label: "所在地" },
  { key: "phone", label: "電話番号" },
  { key: "email", label: "メールアドレス" },
  { key: "businessHours", label: "受付時間" },
  { key: "governingCourt", label: "管轄裁判所" },
] as const;

export function getLegalValue(
  value: string | null | undefined,
  fallbackLabel: string,
) {
  if (value && value.trim().length > 0) {
    return value;
  }

  return `要設定: ${fallbackLabel}`;
}

export function getMissingLegalFields() {
  return LEGAL_REQUIRED_FIELDS.filter(({ key }) => {
    const value = LEGAL_BUSINESS_INFO[key] as string | undefined;
    return !value || value.trim().length === 0;
  });
}

export const LEGAL_WARNING_TEXT =
  "live 前に実在の事業者情報・問い合わせ先・返金方針へ差し替えてください。仮の値や空欄のまま公開しないでください。";

export const LEGAL_REFUND_POLICY =
  "支払済み料金については、サービスの性質上、原則として日割り返金を行いません。ただし、誤課金、二重課金、当サービスの重大な不具合、その他当方が必要と判断した場合には、個別に返金対応を行うことがあります。";

export const LEGAL_PAYMENT_SUMMARY = [
  `Starter は ${PLAN_CATALOG.starter.priceLabel}、Pro は ${PLAN_CATALOG.pro.priceLabel} です。`,
  `Extra Pack は ${EXTRA_PACK_PRICE_LABEL} で、1 つ追加するごとに +${EXTRA_PACK_INCREMENT} 人されます。`,
  "有料プランは月単位で自動更新されます。",
  "お支払いは Stripe Checkout を通じて処理されます。",
  "解約はアカウント画面の請求管理から行えます。",
  LEGAL_REFUND_POLICY,
] as const;

export const LEGAL_PRIVACY_DATA_POINTS = [
  "ホストのメールアドレスその他アカウント関連情報",
  "Stripe customer ID / subscription ID など契約管理に必要な識別子",
  "ルーム情報、参加者表示名、ラウンド情報、早押し結果",
  "アクセス情報、操作ログ、障害調査に必要な技術情報",
  "決済処理に必要な情報",
] as const;

export const LEGAL_PRIVACY_PURPOSES = [
  "ホスト認証、契約管理、料金プランの提供のため",
  "ルーム作成、参加者同期、順位判定、結果表示のため",
  "決済、解約、返金、請求サポート対応のため",
  "障害対応、不正利用対策、セキュリティ確保のため",
  "サービス改善、問い合わせ対応、重要なお知らせのため",
] as const;

export const LEGAL_ENVIRONMENT_NOTES = [
  "最新版の Chrome / Safari / Edge を推奨します。",
  "PC、タブレット、スマートフォンのブラウザから利用できます。",
  "通信料金、インターネット接続料金、端末代金はお客様の負担です。",
] as const;
