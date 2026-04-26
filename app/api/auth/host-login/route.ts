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
    intent?: "sign-in" | "sign-up" | "reset-password";
  };

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const email = body.email?.trim().toLowerCase() ?? "";

    if (!email) {
      return jsonError("メールアドレスを入力してください。");
    }

    if (body.intent === "reset-password") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: new URL(
          "/auth/callback?next=/auth/reset-password",
          publicEnv.appUrl,
        ).toString(),
      });

      if (error) {
        return jsonError(error.message, 400);
      }

      return jsonOk({
        passwordResetEmailSent: true,
      });
    }

    if (!body.password) {
      return jsonError("メールアドレスとパスワードを入力してください。");
    }

    if (body.intent === "sign-up") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: body.password,
        options: {
          emailRedirectTo: new URL("/auth/callback", publicEnv.appUrl).toString(),
          data: {
            display_name: body.displayName?.trim() || email.split("@")[0],
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
      email,
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
