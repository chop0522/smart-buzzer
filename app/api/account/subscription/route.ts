import { isSupabaseConfigured } from "@/lib/env";
import { toAppError } from "@/lib/errors";
import { requireHostSession } from "@/lib/host-auth";
import { jsonError, jsonOk } from "@/lib/http";
import { getHostAccount } from "@/lib/room-store";
import { requireSupabaseUser } from "@/lib/supabase-auth";
import { getHostAccountFromSupabase } from "@/lib/supabase-room-service";

export async function GET() {
  try {
    if (isSupabaseConfigured()) {
      const { supabase } = await requireSupabaseUser();
      return jsonOk({
        account: await getHostAccountFromSupabase(supabase),
      });
    }

    const session = await requireHostSession();
    return jsonOk({
      account: getHostAccount(session.hostId),
    });
  } catch (error) {
    const appError = toAppError(error);
    return jsonError(appError.message, appError.status);
  }
}
