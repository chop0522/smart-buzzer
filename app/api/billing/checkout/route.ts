import { assertRequestedPlan, createCheckoutSession } from "@/lib/stripe";
import { toAppError } from "@/lib/errors";
import { requireHostSession } from "@/lib/host-auth";
import { jsonError, jsonOk } from "@/lib/http";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { plan?: string };

  try {
    const session = await requireHostSession();
    const plan = assertRequestedPlan(body.plan ?? "");
    const checkoutSession = await createCheckoutSession(session.hostId, plan);

    if (!checkoutSession.url) {
      return jsonError("Checkout URL の生成に失敗しました。", 500);
    }

    return jsonOk({ url: checkoutSession.url });
  } catch (error) {
    const appError = toAppError(error);
    return jsonError(appError.message, appError.status);
  }
}
