import { isSupabaseConfigured } from "@/lib/env";
import { toAppError } from "@/lib/errors";
import { requireHostSession } from "@/lib/host-auth";
import { jsonError, jsonOk } from "@/lib/http";
import { getHostAccount } from "@/lib/room-store";
import { createCustomerPortalSession } from "@/lib/stripe";
import { requireSupabaseUser } from "@/lib/supabase-auth";
import { getHostAccountFromSupabase } from "@/lib/supabase-room-service";

export async function POST() {
  try {
    if (isSupabaseConfigured()) {
      const { supabase } = await requireSupabaseUser();
      const account = await getHostAccountFromSupabase(supabase);

      if (!account.stripeCustomerId) {
        return jsonError(
          "まだ Stripe Customer が作成されていません。まず Checkout を完了してください。",
          409,
        );
      }

      const portalSession = await createCustomerPortalSession(
        account.stripeCustomerId,
      );
      return jsonOk({ url: portalSession.url });
    }

    const session = await requireHostSession();
    const account = getHostAccount(session.hostId);

    if (!account.stripeCustomerId) {
      return jsonError(
        "まだ Stripe Customer が作成されていません。まず Checkout を完了してください。",
        409,
      );
    }

    const portalSession = await createCustomerPortalSession(
      account.stripeCustomerId,
    );
    return jsonOk({ url: portalSession.url });
  } catch (error) {
    const appError = toAppError(error);
    return jsonError(appError.message, appError.status);
  }
}
