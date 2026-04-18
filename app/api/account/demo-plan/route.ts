import { broadcastRoomSnapshot } from "@/lib/realtime";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/env";
import { toAppError } from "@/lib/errors";
import { requireHostSession } from "@/lib/host-auth";
import { jsonError, jsonOk } from "@/lib/http";
import { listRoomsForHost, setHostSubscriptionPlan } from "@/lib/room-store";
import { assertRequestedExtraPackQuantity } from "@/lib/stripe";
import { requireSupabaseUser } from "@/lib/supabase-auth";
import {
  getHostAccountFromSupabase,
  upsertHostSubscriptionWithAdmin,
} from "@/lib/supabase-room-service";
import type { SubscriptionPlan } from "@/lib/types";

function resolveDemoPlan(plan?: string): SubscriptionPlan {
  if (plan === "starter" || plan === "pro") {
    return plan;
  }

  return "free";
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return jsonError("本番環境ではデモ課金切替は使えません。", 403);
  }

  const body = (await request.json().catch(() => ({}))) as {
    plan?: string;
    extraPackQuantity?: number;
  };

  try {
    const nextPlan = resolveDemoPlan(body.plan);
    const nextStatus = nextPlan === "free" ? "inactive" : "active";
    const extraPackQuantity =
      nextPlan === "free" ? 0 : assertRequestedExtraPackQuantity(body.extraPackQuantity);

    if (isSupabaseConfigured()) {
      if (!isSupabaseAdminConfigured()) {
        return jsonError("SUPABASE_SERVICE_ROLE_KEY が必要です。", 503);
      }

      const { user } = await requireSupabaseUser();
      const admin = createAdminClient();

      await upsertHostSubscriptionWithAdmin(
        admin,
        user.id,
        nextPlan,
        nextStatus,
        extraPackQuantity,
        {
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          stripeSubscriptionStatus: null,
        },
      );

      const { supabase } = await requireSupabaseUser();
      return jsonOk({
        account: await getHostAccountFromSupabase(supabase),
      });
    }

    const session = await requireHostSession();
    const account = setHostSubscriptionPlan(
      session.hostId,
      nextPlan,
      nextStatus,
      extraPackQuantity,
      {
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripeSubscriptionStatus: null,
      },
    );

    for (const room of listRoomsForHost(session.hostId)) {
      void broadcastRoomSnapshot(room).catch((error) => {
        console.error("broadcast failed after demo plan update", error);
      });
    }

    return jsonOk({ account });
  } catch (error) {
    const appError = toAppError(error);
    return jsonError(appError.message, appError.status);
  }
}
