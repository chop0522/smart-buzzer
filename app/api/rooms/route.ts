import { broadcastRoomSnapshot } from "@/lib/realtime";
import { isSupabaseConfigured } from "@/lib/env";
import { requireHostSession } from "@/lib/host-auth";
import { jsonError, jsonOk } from "@/lib/http";
import { createRoom, listRoomsForHost } from "@/lib/room-store";
import { toAppError } from "@/lib/errors";
import { requireSupabaseUser } from "@/lib/supabase-auth";
import {
  createRoomFromSupabase,
  listHostRoomsFromSupabase,
} from "@/lib/supabase-room-service";

export async function GET() {
  try {
    if (isSupabaseConfigured()) {
      const { supabase } = await requireSupabaseUser();
      return jsonOk({
        rooms: await listHostRoomsFromSupabase(supabase),
      });
    }

    const session = await requireHostSession();
    return jsonOk({
      rooms: listRoomsForHost(session.hostId),
    });
  } catch (error) {
    const appError = toAppError(error);
    return jsonError(appError.message, appError.status);
  }
}

export async function POST() {
  try {
    if (isSupabaseConfigured()) {
      const { supabase } = await requireSupabaseUser();
      const room = await createRoomFromSupabase(supabase);
      return jsonOk({ room }, { status: 201 });
    }

    const session = await requireHostSession();
    const room = createRoom(session.hostId);
    void broadcastRoomSnapshot(room).catch((error) => {
      console.error("broadcast failed after room create", error);
    });
    return jsonOk({ room }, { status: 201 });
  } catch (error) {
    const appError = toAppError(error);
    return jsonError(appError.message, appError.status);
  }
}
