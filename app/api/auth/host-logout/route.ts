import { isSupabaseConfigured } from "@/lib/env";
import { clearHostSession } from "@/lib/host-auth";
import { jsonOk } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return jsonOk({ loggedOut: true });
  }

  await clearHostSession();
  return jsonOk({ loggedOut: true });
}
