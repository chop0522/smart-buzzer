import { isSupabaseConfigured, publicEnv } from "@/lib/env";
import { jsonError, jsonOk } from "@/lib/http";
import {
  createHostSession,
  isDemoHostLoginAvailable,
  validateHostPassword,
} from "@/lib/host-auth";
import { getHostAccount } from "@/lib/room-store";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    displayName?: string;
    password?: string;
    demo?: boolean;
    intent?: "sign-in" | "sign-up";
  };

  if (isSupabaseConfigured()) {
    const supabase = await createClient();

    if (!body.email || !body.password) {
      return jsonError("メールアドレスとパスワードを入力してください。");
    }

    if (body.intent === "sign-up") {
      const { data, error } = await supabase.auth.signUp({
        email: body.email,
        password: body.password,
        options: {
          emailRedirectTo: new URL("/auth/callback", publicEnv.appUrl).toString(),
          data: {
            display_name: body.displayName?.trim() || body.email.split("@")[0],
          },
        },
      });

      if (error) {
        return jsonError(error.message, 400);
      }

      return jsonOk({
        host: data.user,
        requiresEmailConfirmation: !data.session,
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    if (error) {
      return jsonError(error.message, 401);
    }

    return jsonOk({
      host: data.user,
    });
  }

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
