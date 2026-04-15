import { toAppError } from "@/lib/errors";
import { jsonError, jsonOk } from "@/lib/http";
import { broadcastRoomSnapshot } from "@/lib/realtime";
import { joinRoom, withRoomLock } from "@/lib/room-store";

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { name?: string };

  try {
    const payload = await withRoomLock(code, () => joinRoom(code, body.name ?? ""));
    void broadcastRoomSnapshot(payload.room).catch((error) => {
      console.error("broadcast failed after join", error);
    });
    return jsonOk(payload);
  } catch (error) {
    const appError = toAppError(error);
    return jsonError(appError.message, appError.status);
  }
}
