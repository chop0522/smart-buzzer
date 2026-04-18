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

const ROOM_SYNC_POLL_MS = 1500;

export function useRoomFeed(
  code: string | null,
  onRoomUpdate: (room: RoomSnapshot) => void,
) {
  const emitUpdate = useEffectEvent(onRoomUpdate);
  const syncSnapshot = useEffectEvent(async (targetCode: string) => {
    try {
      const payload = await fetchJson<{ room: RoomSnapshot }>(`/api/rooms/${targetCode}`, {
        cache: "no-store",
      });
      emitUpdate(payload.room);
    } catch {
      // Best-effort sync. The next poll or broadcast can recover.
    }
  });

  useEffect(() => {
    if (!code) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const interval = window.setInterval(() => {
      void syncSnapshot(code);
    }, ROOM_SYNC_POLL_MS);

    void syncSnapshot(code);

    let channel:
      | ReturnType<NonNullable<typeof supabase>["channel"]>
      | null = null;

    if (supabase) {
      channel = supabase.channel(getRoomTopic(code), {
        config: {
          broadcast: { self: true },
          private: false,
        },
      });

      channel.on("broadcast", { event: "room.sync" }, ({ payload }) => {
        const nextPayload = payload as RoomFeedPayload;
        if (nextPayload.room) {
          emitUpdate(nextPayload.room);
          return;
        }

        void syncSnapshot(code);
      });

      channel.subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          void syncSnapshot(code);
        }
      });
    }

    return () => {
      window.clearInterval(interval);

      if (supabase && channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [code]);
}
