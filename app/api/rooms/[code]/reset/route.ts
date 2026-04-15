import { toAppError } from "@/lib/errors";
import { requireHostSession } from "@/lib/host-auth";
import { jsonError, jsonOk } from "@/lib/http";
import { broadcastRoomSnapshot } from "@/lib/realtime";
import { resetRound, withRoomLock } from "@/lib/room-store";

export async function POST(
  _request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;

  try {
    await requireHostSession();
    const room = await withRoomLock(code, () => resetRound(code));
    void broadcastRoomSnapshot(room).catch((error) => {
      console.error("broadcast failed after reset", error);
    });
    return jsonOk({ room });
  } catch (error) {
    const appError = toAppError(error);
    return jsonError(appError.message, appError.status);
  }
}
