import { broadcastRoomSnapshot } from "@/lib/realtime";
import { requireHostSession } from "@/lib/host-auth";
import { jsonError, jsonOk } from "@/lib/http";
import { createRoom, listRoomsForHost } from "@/lib/room-store";
import { toAppError } from "@/lib/errors";

export async function GET() {
  try {
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
