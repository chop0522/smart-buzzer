"use client";

import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

let browserClient:
  | ReturnType<typeof createClient>
  | null = null;

export function getSupabaseBrowserClient() {
  if (!publicEnv.supabaseUrl || !publicEnv.supabasePublishableKey) {
    return null;
  }

  browserClient ??= createClient(
    publicEnv.supabaseUrl,
    publicEnv.supabasePublishableKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  return browserClient;
}
