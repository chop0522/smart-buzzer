import { isSupabaseConfigured } from "@/lib/env";
import { jsonError, jsonOk } from "@/lib/http";
import { getRoomSnapshot } from "@/lib/room-store";
import { createClient } from "@/lib/supabase/server";
import { getRoomSnapshotFromSupabase } from "@/lib/supabase-room-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const room = await getRoomSnapshotFromSupabase(supabase, code);

    if (!room) {
      return jsonError("ルームが見つかりません。", 404);
    }

    return jsonOk({ room });
  }

  const room = getRoomSnapshot(code);

  if (!room) {
    return jsonError("ルームが見つかりません。", 404);
  }

  return jsonOk({ room });
}
