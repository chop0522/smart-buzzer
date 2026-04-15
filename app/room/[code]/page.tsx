import { ParticipantRoom } from "@/components/room/participant-room";
import { getRoomSnapshot } from "@/lib/room-store";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const normalizedCode = code.toUpperCase();
  const room = getRoomSnapshot(normalizedCode);

  return <ParticipantRoom code={normalizedCode} initialRoom={room} />;
}
