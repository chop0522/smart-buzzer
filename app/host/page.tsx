import { HostDashboard } from "@/components/host/host-dashboard";
import { HostLoginCard } from "@/components/host/host-login-card";
import { getHostSession, isDemoHostLoginAvailable } from "@/lib/host-auth";
import { getHostAccount, listRoomsForHost } from "@/lib/room-store";

export default async function HostPage() {
  const session = await getHostSession();

  if (!session) {
    return <HostLoginCard demoAvailable={isDemoHostLoginAvailable()} />;
  }

  const account = getHostAccount(session.hostId);
  const initialRoom = listRoomsForHost(session.hostId)[0] ?? null;

  return <HostDashboard account={account} initialRoom={initialRoom} />;
}
