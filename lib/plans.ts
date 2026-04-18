import type { SubscriptionPlan } from "@/lib/types";

export const FREE_PARTICIPANT_LIMIT = 4;
export const STARTER_PARTICIPANT_LIMIT = 8;
export const PRO_PARTICIPANT_LIMIT = 16;
export const EXTRA_PACK_INCREMENT = 4;
export const STARTER_PRICE_LABEL = "¥980 / month";
export const PRO_PRICE_LABEL = "¥1,980 / month";
export const EXTRA_PACK_PRICE_LABEL = "¥580 / month";

export const PLAN_CATALOG = {
  free: {
    id: "free",
    name: "Free",
    priceLabel: "¥0 / month",
    participantLimit: FREE_PARTICIPANT_LIMIT,
    highlight: "4人までの無料トライアル向け",
    description: "ホスト認証、Realtime 同期、早押し判定の基本機能を利用できます。",
  },
  starter: {
    id: "starter",
    name: "Starter",
    priceLabel: STARTER_PRICE_LABEL,
    participantLimit: STARTER_PARTICIPANT_LIMIT,
    highlight: "小規模イベント向けの有料プラン",
    description:
      "8 人まで利用可能。無料上限を超えたらまずここ。Extra Pack を足して 12 人以上にも対応できます。",
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceLabel: PRO_PRICE_LABEL,
    participantLimit: PRO_PARTICIPANT_LIMIT,
    highlight: "より大きなセッション向けの標準プラン",
    description:
      "16 人まで利用可能。Extra Pack を追加するとさらに拡張できます。",
  },
} as const;

export const PLAN_ORDER: SubscriptionPlan[] = ["free", "starter", "pro"];

export function getBaseParticipantLimit(plan: SubscriptionPlan) {
  return PLAN_CATALOG[plan].participantLimit;
}

export function getParticipantLimit(
  plan: SubscriptionPlan,
  extraPackQuantity = 0,
) {
  return getBaseParticipantLimit(plan) + extraPackQuantity * EXTRA_PACK_INCREMENT;
}

export function normalizeExtraPackQuantity(quantity: number | null | undefined) {
  if (!Number.isFinite(quantity)) {
    return 0;
  }

  return Math.max(0, Math.floor(quantity ?? 0));
}

export function isPaidPlan(plan: SubscriptionPlan) {
  return plan !== "free";
}

export function getUpgradeMessage(limit: number) {
  return `このルームは ${limit} 人までです。Starter / Pro / Extra Pack で上限を引き上げてください。`;
}
