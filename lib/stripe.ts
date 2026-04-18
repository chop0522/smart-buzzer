import "server-only";

import Stripe from "stripe";
import { publicEnv, serverEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import {
  getParticipantLimit,
  normalizeExtraPackQuantity,
} from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  claimStripeEventWithAdmin,
  completeStripeEventWithAdmin,
  failStripeEventWithAdmin,
  upsertHostSubscriptionWithAdmin,
} from "@/lib/supabase-room-service";
import type { HostAccount, SubscriptionPlan } from "@/lib/types";

type PaidPlan = Exclude<SubscriptionPlan, "free">;

interface CheckoutSessionInput {
  hostId: string;
  email?: string | null;
  currentStripeCustomerId?: string | null;
  plan: PaidPlan;
  extraPackQuantity: number;
}

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  if (!serverEnv.stripeSecretKey) {
    return null;
  }

  stripeClient ??= new Stripe(serverEnv.stripeSecretKey);

  return stripeClient;
}

export function assertRequestedPlan(plan: string): PaidPlan {
  if (plan !== "starter" && plan !== "pro") {
    throw new AppError(
      "Starter または Pro のみ Stripe Checkout から購入できます。",
      400,
    );
  }

  return plan;
}

export function assertRequestedExtraPackQuantity(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : 0;

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 99) {
    throw new AppError("Extra Pack 数量は 0 から 99 の整数で指定してください。", 400);
  }

  return normalizeExtraPackQuantity(parsed);
}

function getBasePriceId(plan: PaidPlan) {
  if (plan === "starter") {
    return serverEnv.stripePriceStarterMonthly;
  }

  return serverEnv.stripePriceProMonthly;
}

function getExtraPackPriceId() {
  return serverEnv.stripePriceExtraPackMonthly;
}

function assertStripeBillingConfigured() {
  if (
    !serverEnv.stripeSecretKey ||
    !serverEnv.stripeWebhookSecret ||
    !serverEnv.stripePriceStarterMonthly ||
    !serverEnv.stripePriceProMonthly ||
    !serverEnv.stripePriceExtraPackMonthly
  ) {
    throw new AppError(
      "Stripe Billing の設定が不足しています。.env.local を確認してください。",
      503,
    );
  }
}

function buildSubscriptionLineItems(plan: PaidPlan, extraPackQuantity: number) {
  const lineItems = [
    {
      price: getBasePriceId(plan),
      quantity: 1,
    },
  ];

  if (extraPackQuantity > 0) {
    lineItems.push({
      price: getExtraPackPriceId(),
      quantity: extraPackQuantity,
    });
  }

  return lineItems;
}

export async function createCheckoutSession({
  hostId,
  email,
  currentStripeCustomerId,
  plan,
  extraPackQuantity,
}: CheckoutSessionInput) {
  assertStripeBillingConfigured();

  const stripe = getStripeClient();
  if (!stripe) {
    throw new AppError("Stripe クライアントを初期化できません。", 500);
  }

  const normalizedExtraPackQuantity =
    assertRequestedExtraPackQuantity(extraPackQuantity);
  const successUrl = new URL("/account?checkout=success", publicEnv.appUrl);
  const cancelUrl = new URL("/pricing?checkout=cancelled", publicEnv.appUrl);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    allow_promotion_codes: true,
    client_reference_id: hostId,
    customer: currentStripeCustomerId ?? undefined,
    customer_email: currentStripeCustomerId ? undefined : email ?? undefined,
    line_items: buildSubscriptionLineItems(plan, normalizedExtraPackQuantity),
    success_url: successUrl.toString(),
    cancel_url: cancelUrl.toString(),
    metadata: {
      hostId,
      requestedPlan: plan,
      extraPackQuantity: String(normalizedExtraPackQuantity),
      participantLimit: String(
        getParticipantLimit(plan, normalizedExtraPackQuantity),
      ),
    },
    subscription_data: {
      metadata: {
        hostId,
        requestedPlan: plan,
        extraPackQuantity: String(normalizedExtraPackQuantity),
      },
    },
  });

  return session;
}

export async function createCustomerPortalSession(customerId: string) {
  assertStripeBillingConfigured();

  const stripe = getStripeClient();
  if (!stripe) {
    throw new AppError("Stripe クライアントを初期化できません。", 500);
  }

  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: new URL("/account", publicEnv.appUrl).toString(),
  });
}

function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status,
): HostAccount["status"] {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    default:
      return "inactive";
  }
}

function resolvePlanFromSubscription(subscription: Stripe.Subscription): PaidPlan | "free" {
  const priceIds = subscription.items.data.map((item) => item.price.id);

  if (priceIds.includes(serverEnv.stripePriceProMonthly)) {
    return "pro";
  }

  if (priceIds.includes(serverEnv.stripePriceStarterMonthly)) {
    return "starter";
  }

  return "free";
}

function resolveExtraPackQuantityFromSubscription(subscription: Stripe.Subscription) {
  return normalizeExtraPackQuantity(
    subscription.items.data
      .filter((item) => item.price.id === serverEnv.stripePriceExtraPackMonthly)
      .reduce((sum, item) => sum + (item.quantity ?? 0), 0),
  );
}

async function resolveHostIdFromStripeReferences({
  hostId,
  stripeCustomerId,
  stripeSubscriptionId,
}: {
  hostId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}) {
  if (hostId) {
    return hostId;
  }

  const admin = createAdminClient();
  let query = admin.from("subscriptions").select("host_user_id").limit(1);

  if (stripeSubscriptionId) {
    query = query.eq("stripe_subscription_id", stripeSubscriptionId);
  } else if (stripeCustomerId) {
    query = query.eq("stripe_customer_id", stripeCustomerId);
  } else {
    return null;
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new AppError(error.message, 400);
  }

  return (data as { host_user_id: string } | null)?.host_user_id ?? null;
}

async function persistStripeSubscription(
  subscription: Stripe.Subscription,
  fallbackHostId?: string | null,
) {
  const admin = createAdminClient();
  const plan = resolvePlanFromSubscription(subscription);
  const extraPackQuantity =
    resolveExtraPackQuantityFromSubscription(subscription);
  const hostId = await resolveHostIdFromStripeReferences({
    hostId: subscription.metadata?.hostId ?? fallbackHostId ?? null,
    stripeCustomerId:
      typeof subscription.customer === "string" ? subscription.customer : null,
    stripeSubscriptionId: subscription.id,
  });

  if (!hostId) {
    return;
  }

  await upsertHostSubscriptionWithAdmin(
    admin,
    hostId,
    plan === "free" ? "free" : plan,
    mapStripeSubscriptionStatus(subscription.status),
    plan === "free" ? 0 : extraPackQuantity,
    {
      stripeCustomerId:
        typeof subscription.customer === "string" ? subscription.customer : null,
      stripeSubscriptionId: subscription.id,
      stripeSubscriptionStatus: subscription.status,
    },
  );
}

function getStripeEventErrorMessage(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Stripe webhook の処理に失敗しました。";

  return message.slice(0, 1000);
}

export async function handleStripeEvent(event: Stripe.Event) {
  assertStripeBillingConfigured();

  const admin = createAdminClient();
  const shouldProcess = await claimStripeEventWithAdmin(
    admin,
    event.id,
    event.type,
  );

  if (!shouldProcess) {
    return { duplicate: true as const };
  }

  try {
    const stripe = getStripeClient();
    if (!stripe) {
      throw new AppError("Stripe クライアントを初期化できません。", 500);
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : null;

        if (!subscriptionId) {
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await persistStripeSubscription(
          subscription,
          session.metadata?.hostId ?? null,
        );
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await persistStripeSubscription(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const hostId = await resolveHostIdFromStripeReferences({
          hostId: subscription.metadata?.hostId ?? null,
          stripeCustomerId:
            typeof subscription.customer === "string"
              ? subscription.customer
              : null,
          stripeSubscriptionId: subscription.id,
        });

        if (!hostId) {
          break;
        }

        await upsertHostSubscriptionWithAdmin(
          admin,
          hostId,
          "free",
          "inactive",
          0,
          {
            stripeCustomerId:
              typeof subscription.customer === "string"
                ? subscription.customer
                : null,
            stripeSubscriptionId: subscription.id,
            stripeSubscriptionStatus: subscription.status,
          },
        );
        break;
      }
      default:
        break;
    }

    await completeStripeEventWithAdmin(admin, event.id);
    return { duplicate: false as const };
  } catch (error) {
    await failStripeEventWithAdmin(admin, event.id, getStripeEventErrorMessage(error));
    throw error;
  }
}
