import { isStripeConfigured, serverEnv } from "@/lib/env";
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

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      serverEnv.stripeWebhookSecret,
    );
    await handleStripeEvent(event);
    return jsonOk({ received: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Webhook 検証に失敗しました。",
      400,
    );
  }
}
