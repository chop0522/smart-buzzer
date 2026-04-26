import { isSupabaseConfigured } from "@/lib/env";
import { jsonError, jsonOk } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return jsonError("Supabase Auth が設定されていません。", 503);
  }

  const body = (await request.json().catch(() => ({}))) as {
    password?: string;
  };

  const password = body.password?.trim() ?? "";

  if (password.length < 6) {
    return jsonError("パスワードは6文字以上で入力してください。");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return jsonError(
      "パスワード再設定リンクの有効期限が切れています。もう一度リセットメールを送信してください。",
      401,
    );
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return jsonError(error.message, 400);
  }

  return jsonOk({ passwordUpdated: true });
}
