import { toAppError } from "@/lib/errors";
import { requireHostSession } from "@/lib/host-auth";
import { jsonError, jsonOk } from "@/lib/http";
import { getHostAccount } from "@/lib/room-store";

export async function GET() {
  try {
    const session = await requireHostSession();
    return jsonOk({
      account: getHostAccount(session.hostId),
    });
  } catch (error) {
    const appError = toAppError(error);
    return jsonError(appError.message, appError.status);
  }
}
