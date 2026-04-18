import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";

export async function createClient() {
  if (!publicEnv.supabaseUrl || !publicEnv.supabasePublishableKey) {
    throw new AppError("Supabase の公開環境変数が不足しています。", 503);
  }

  const cookieStore = await cookies();

  return createServerClient(
    publicEnv.supabaseUrl,
    publicEnv.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot always mutate cookies.
          }
        },
      },
    },
  );
}
