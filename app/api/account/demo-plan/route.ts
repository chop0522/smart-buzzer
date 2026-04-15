import { broadcastRoomSnapshot } from "@/lib/realtime";
import { toAppError } from "@/lib/errors";
import { requireHostSession } from "@/lib/host-auth";
import { jsonError, jsonOk } from "@/lib/http";
import { listRoomsForHost, setHostSubscriptionPlan } from "@/lib/room-store";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return jsonError("本番環境ではデモ課金切替は使えません。", 403);
  }

  const body = (await request.json().catch(() => ({}))) as { plan?: string };

  try {
    const session = await requireHostSession();
    const nextPlan = body.plan === "pro" ? "pro" : "free";
    const nextStatus = nextPlan === "pro" ? "active" : "inactive";
    const account = setHostSubscriptionPlan(session.hostId, nextPlan, nextStatus);

    for (const room of listRoomsForHost(session.hostId)) {
      void broadcastRoomSnapshot(room).catch((error) => {
        console.error("broadcast failed after demo plan update", error);
      });
    }

    return jsonOk({ account });
  } catch (error) {
    const appError = toAppError(error);
    return jsonError(appError.message, appError.status);
  }
}
