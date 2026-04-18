import "server-only";

import { createClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";

let adminClient: ReturnType<typeof createClient> | null = null;

export function createAdminClient() {
  if (!publicEnv.supabaseUrl || !serverEnv.supabaseServiceRoleKey) {
    throw new AppError(
      "Supabase の service role key が不足しています。",
      503,
    );
  }

  adminClient ??= createClient(
    publicEnv.supabaseUrl,
    serverEnv.supabaseServiceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );

  return adminClient;
}
