import type Stripe from "stripe";
import { isStripeConfigured, serverEnv } from "@/lib/env";
import { toAppError } from "@/lib/errors";
import { jsonError, jsonOk } from "@/lib/http";
import { handleStripeEvent, getStripeClient } from "@/lib/stripe";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return jsonError("Stripe webhook はまだ設定されていません。", 503);
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return jsonError("Stripe-Signature ヘッダーがありません。", 400);
  }

  const stripe = getStripeClient();

  if (!stripe) {
    return jsonError("Stripe クライアントを初期化できません。", 500);
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      serverEnv.stripeWebhookSecret,
    );
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Webhook 検証に失敗しました。",
      400,
    );
  }

  try {
    const result = await handleStripeEvent(event);
    return jsonOk({ received: true, duplicate: result.duplicate });
  } catch (error) {
    const appError = toAppError(error);
    return jsonError(appError.message, appError.status);
  }
}
