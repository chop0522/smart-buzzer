import { isSupabaseConfigured } from "@/lib/env";
import {
  assertRequestedExtraPackQuantity,
  assertRequestedPlan,
  createCheckoutSession,
} from "@/lib/stripe";
import { toAppError } from "@/lib/errors";
import { requireHostSession } from "@/lib/host-auth";
import { jsonError, jsonOk } from "@/lib/http";
import { getHostAccount } from "@/lib/room-store";
import { requireSupabaseUser } from "@/lib/supabase-auth";
import { getHostAccountFromSupabase } from "@/lib/supabase-room-service";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    plan?: string;
    extraPackQuantity?: number;
  };

  try {
    const plan = assertRequestedPlan(body.plan ?? "");
    const extraPackQuantity = assertRequestedExtraPackQuantity(
      body.extraPackQuantity,
    );

    if (isSupabaseConfigured()) {
      const { supabase, user } = await requireSupabaseUser();
      const account = await getHostAccountFromSupabase(supabase);

      if (
        account.plan !== "free" &&
        account.stripeCustomerId &&
        account.stripeSubscriptionId &&
        account.status !== "canceled"
      ) {
        return jsonError(
          "既存契約の変更は Customer Portal から行ってください。",
          409,
        );
      }

      const checkoutSession = await createCheckoutSession({
        hostId: user.id,
        email: user.email,
        currentStripeCustomerId: account.stripeCustomerId,
        plan,
        extraPackQuantity,
      });

      if (!checkoutSession.url) {
        return jsonError("Checkout URL の生成に失敗しました。", 500);
      }

      return jsonOk({ url: checkoutSession.url });
    }

    const session = await requireHostSession();
    const account = getHostAccount(session.hostId);

    if (
      account.plan !== "free" &&
      account.stripeCustomerId &&
      account.stripeSubscriptionId &&
      account.status !== "canceled"
    ) {
      return jsonError(
        "既存契約の変更は Customer Portal から行ってください。",
        409,
      );
    }

    const checkoutSession = await createCheckoutSession({
      hostId: session.hostId,
      currentStripeCustomerId: account.stripeCustomerId,
      plan,
      extraPackQuantity,
    });

    if (!checkoutSession.url) {
      return jsonError("Checkout URL の生成に失敗しました。", 500);
    }

    return jsonOk({ url: checkoutSession.url });
  } catch (error) {
    const appError = toAppError(error);
    return jsonError(appError.message, appError.status);
  }
}
