import { isSupabaseConfigured } from "@/lib/env";
import { toAppError } from "@/lib/errors";
import { requireHostSession } from "@/lib/host-auth";
import { jsonError, jsonOk } from "@/lib/http";
import { broadcastRoomSnapshot } from "@/lib/realtime";
import { startRound, withRoomLock } from "@/lib/room-store";
import { requireSupabaseUser } from "@/lib/supabase-auth";
import { startRoomRoundFromSupabase } from "@/lib/supabase-room-service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;

  try {
    if (isSupabaseConfigured()) {
      const { supabase } = await requireSupabaseUser();
      return jsonOk({ room: await startRoomRoundFromSupabase(supabase, code) });
    }

    await requireHostSession();
    const room = await withRoomLock(code, () => startRound(code));
    void broadcastRoomSnapshot(room).catch((error) => {
      console.error("broadcast failed after round start", error);
    });
    return jsonOk({ room });
  } catch (error) {
    const appError = toAppError(error);
    return jsonError(appError.message, appError.status);
  }
}
