import { HostDashboard } from "@/components/host/host-dashboard";
import { HostLoginCard } from "@/components/host/host-login-card";
import { isSupabaseConfigured } from "@/lib/env";
import { getHostSession, isDemoHostLoginAvailable } from "@/lib/host-auth";
import { getHostAccount, listRoomsForHost } from "@/lib/room-store";
import { getSupabaseUser } from "@/lib/supabase-auth";
import {
  getHostAccountFromSupabase,
  listHostRoomsFromSupabase,
} from "@/lib/supabase-room-service";

export default async function HostPage() {
  if (isSupabaseConfigured()) {
    const { supabase, user } = await getSupabaseUser();

    if (!user) {
      return <HostLoginCard demoAvailable={false} useSupabaseAuth />;
    }

    const account = await getHostAccountFromSupabase(supabase);
    const initialRoom = (await listHostRoomsFromSupabase(supabase))[0] ?? null;

    return <HostDashboard account={account} initialRoom={initialRoom} />;
  }

  const session = await getHostSession();

  if (!session) {
    return <HostLoginCard demoAvailable={isDemoHostLoginAvailable()} />;
  }

  const account = getHostAccount(session.hostId);
  const initialRoom = listRoomsForHost(session.hostId)[0] ?? null;

  return <HostDashboard account={account} initialRoom={initialRoom} />;
}
