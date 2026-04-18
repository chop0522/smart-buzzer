import "server-only";

import { AppError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export async function getSupabaseUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    if (error.message === "Auth session missing!") {
      return { supabase, user: null };
    }

    throw new AppError(error.message, 401);
  }

  return { supabase, user };
}

export async function requireSupabaseUser() {
  const { supabase, user } = await getSupabaseUser();

  if (!user) {
    throw new AppError("ホストログインが必要です。", 401);
  }

  return { supabase, user };
}
