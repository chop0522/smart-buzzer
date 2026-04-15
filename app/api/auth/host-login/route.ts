import { jsonError, jsonOk } from "@/lib/http";
import {
  createHostSession,
  isDemoHostLoginAvailable,
  validateHostPassword,
} from "@/lib/host-auth";
import { getHostAccount } from "@/lib/room-store";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    password?: string;
    demo?: boolean;
  };

  if (body.demo) {
    if (!isDemoHostLoginAvailable()) {
      return jsonError("デモログインは現在利用できません。", 403);
    }
  } else {
    try {
      validateHostPassword(body.password ?? "");
    } catch (error) {
      return jsonError(
        error instanceof Error ? error.message : "ログインに失敗しました。",
        401,
      );
    }
  }

  await createHostSession("demo-host");
  return jsonOk({
    host: getHostAccount("demo-host"),
  });
}
