import type { SubscriptionPlan } from "@/lib/types";

export const FREE_PARTICIPANT_LIMIT = 4;
export const PRO_PARTICIPANT_LIMIT = 20;

export const PLAN_CATALOG = {
  free: {
    id: "free",
    name: "Free",
    priceLabel: "¥0 / month",
    participantLimit: FREE_PARTICIPANT_LIMIT,
    highlight: "4人までの小規模セッション向け",
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceLabel: "Stripe Checkout で課金",
    participantLimit: PRO_PARTICIPANT_LIMIT,
    highlight: "より多い参加人数に対応",
  },
} as const;

export function getParticipantLimit(plan: SubscriptionPlan) {
  return PLAN_CATALOG[plan].participantLimit;
}

export function isPaidPlan(plan: SubscriptionPlan) {
  return plan !== "free";
}
