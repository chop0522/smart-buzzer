import { isSupabaseConfigured } from "@/lib/env";
import { toAppError } from "@/lib/errors";
import { jsonError, jsonOk } from "@/lib/http";
import { broadcastRoomSnapshot } from "@/lib/realtime";
import { buzzRoom, withRoomLock } from "@/lib/room-store";
import { createClient } from "@/lib/supabase/server";
import { submitBuzzFromSupabase } from "@/lib/supabase-room-service";

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    participantId?: string;
  };

  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      return jsonOk(
        await submitBuzzFromSupabase(supabase, code, body.participantId ?? ""),
      );
    }

    const payload = await withRoomLock(code, () =>
      buzzRoom(code, body.participantId ?? ""),
    );
    void broadcastRoomSnapshot(payload.room).catch((error) => {
      console.error("broadcast failed after buzz", error);
    });
    return jsonOk(payload);
  } catch (error) {
    const appError = toAppError(error);
    return jsonError(appError.message, appError.status);
  }
}
