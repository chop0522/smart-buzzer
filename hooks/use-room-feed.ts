"use client";

import { useEffect, useEffectEvent } from "react";
import { fetchJson } from "@/lib/fetch-json";
import { getRoomTopic } from "@/lib/realtime";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";
import type { RoomSnapshot } from "@/lib/types";

interface RoomFeedPayload {
  room: RoomSnapshot;
  sentAt: string;
}

export function useRoomFeed(
  code: string | null,
  onRoomUpdate: (room: RoomSnapshot) => void,
) {
  const emitUpdate = useEffectEvent(onRoomUpdate);

  useEffect(() => {
    if (!code) {
      return;
    }

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      const interval = window.setInterval(async () => {
        try {
          const payload = await fetchJson<{ room: RoomSnapshot }>(
            `/api/rooms/${code}`,
            {
              cache: "no-store",
            },
          );
          emitUpdate(payload.room);
        } catch {
          // Polling fallback is best-effort in local demo mode.
        }
      }, 2500);

      return () => {
        window.clearInterval(interval);
      };
    }

    const channel = supabase.channel(getRoomTopic(code), {
      config: {
        broadcast: { self: true },
      },
    });

    channel.on("broadcast", { event: "room.sync" }, ({ payload }) => {
      const nextPayload = payload as RoomFeedPayload;
      if (nextPayload.room) {
        emitUpdate(nextPayload.room);
      }
    });

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [code]);
}
