import { ParticipantRoom } from "@/components/room/participant-room";
import { isSupabaseConfigured } from "@/lib/env";
import { getRoomSnapshot } from "@/lib/room-store";
import { createClient } from "@/lib/supabase/server";
import { getRoomSnapshotFromSupabase } from "@/lib/supabase-room-service";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const normalizedCode = code.toUpperCase();
  const room = isSupabaseConfigured()
    ? await getRoomSnapshotFromSupabase(await createClient(), normalizedCode)
    : getRoomSnapshot(normalizedCode);

  return <ParticipantRoom code={normalizedCode} initialRoom={room} />;
}
