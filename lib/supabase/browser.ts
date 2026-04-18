"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

let browserClient: SupabaseClient | null = null;

export function createClient() {
  if (!publicEnv.supabaseUrl || !publicEnv.supabasePublishableKey) {
    return null;
  }

  browserClient ??= createBrowserClient(
    publicEnv.supabaseUrl,
    publicEnv.supabasePublishableKey,
  );

  return browserClient;
}
