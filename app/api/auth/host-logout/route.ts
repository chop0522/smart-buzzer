import { clearHostSession } from "@/lib/host-auth";
import { jsonOk } from "@/lib/http";

export async function POST() {
  await clearHostSession();
  return jsonOk({ loggedOut: true });
}
