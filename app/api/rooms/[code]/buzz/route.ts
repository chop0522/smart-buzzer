import { toAppError } from "@/lib/errors";
import { jsonError, jsonOk } from "@/lib/http";
import { broadcastRoomSnapshot } from "@/lib/realtime";
import { buzzRoom, withRoomLock } from "@/lib/room-store";

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    participantId?: string;
  };

  try {
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
