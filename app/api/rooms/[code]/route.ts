import { jsonError, jsonOk } from "@/lib/http";
import { getRoomSnapshot } from "@/lib/room-store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  const room = getRoomSnapshot(code);

  if (!room) {
    return jsonError("ルームが見つかりません。", 404);
  }

  return jsonOk({ room });
}
