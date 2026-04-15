import type { RoomSnapshot } from "@/lib/types";
import { isRealtimeBroadcastServerConfigured, publicEnv, serverEnv } from "@/lib/env";

export function getRoomTopic(code: string) {
  return `room:${code}`;
}

export async function broadcastRoomSnapshot(room: RoomSnapshot) {
  if (!isRealtimeBroadcastServerConfigured()) {
    return { skipped: true as const };
  }

  const response = await fetch(
    `${publicEnv.supabaseUrl}/realtime/v1/api/broadcast`,
    {
      method: "POST",
      headers: {
        apikey: serverEnv.supabaseServiceRoleKey,
        Authorization: `Bearer ${serverEnv.supabaseServiceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            topic: getRoomTopic(room.code),
            event: "room.sync",
            payload: {
              room,
              sentAt: new Date().toISOString(),
            },
          },
        ],
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Supabase Broadcast への送信に失敗しました。");
  }

  return { skipped: false as const };
}
