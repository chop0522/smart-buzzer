import "server-only";

import Stripe from "stripe";
import { publicEnv, serverEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { getParticipantLimit } from "@/lib/plans";
import { setHostSubscriptionPlan } from "@/lib/room-store";
import type { SubscriptionPlan } from "@/lib/types";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  if (!serverEnv.stripeSecretKey) {
    return null;
  }

  stripeClient ??= new Stripe(serverEnv.stripeSecretKey, {
    apiVersion: "2026-03-25.dahlia",
  });

  return stripeClient;
}

export function assertRequestedPlan(plan: string): SubscriptionPlan {
  if (plan !== "pro") {
    throw new AppError("現在の課金フローでは Pro プランのみ扱います。", 400);
  }

  return plan;
}

export async function createCheckoutSession(hostId: string, plan: SubscriptionPlan) {
  const stripe = getStripeClient();
  if (!stripe || !serverEnv.stripePriceProMonthly) {
    throw new AppError(
      "Stripe の課金設定が未完了です。.env.local を確認してください。",
      503,
    );
  }

  const successUrl = new URL("/account?checkout=success", publicEnv.appUrl);
  const cancelUrl = new URL("/account?checkout=cancelled", publicEnv.appUrl);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price: serverEnv.stripePriceProMonthly,
        quantity: 1,
      },
    ],
    success_url: successUrl.toString(),
    cancel_url: cancelUrl.toString(),
    metadata: {
      hostId,
      requestedPlan: plan,
      participantLimit: String(getParticipantLimit(plan)),
    },
    subscription_data: {
      metadata: {
        hostId,
        requestedPlan: plan,
      },
    },
  });

  return session;
}

export async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const hostId = session.metadata?.hostId;
      const requestedPlan = session.metadata?.requestedPlan;

      if (hostId && requestedPlan === "pro") {
        setHostSubscriptionPlan(hostId, "pro", "active", {
          stripeCustomerId:
            typeof session.customer === "string" ? session.customer : null,
          stripeSubscriptionId:
            typeof session.subscription === "string"
              ? session.subscription
              : null,
        });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const hostId = subscription.metadata?.hostId;
      if (hostId) {
        setHostSubscriptionPlan(hostId, "free", "inactive", {
          stripeCustomerId:
            typeof subscription.customer === "string"
              ? subscription.customer
              : null,
          stripeSubscriptionId: subscription.id,
        });
      }
      break;
    }
    default:
      break;
  }
}
