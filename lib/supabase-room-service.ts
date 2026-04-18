import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";
import { getParticipantLimit, normalizeExtraPackQuantity } from "@/lib/plans";
import type { HostAccount, Participant, RoomSnapshot, SubscriptionPlan } from "@/lib/types";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

async function rpc<T>(
  supabase: SupabaseClient,
  fn: string,
  args?: Record<string, Json>,
) {
  const { data, error } = await supabase.rpc(fn, args);

  if (error) {
    throw new AppError(error.message, 400);
  }

  return data as T;
}

export async function getHostAccountFromSupabase(supabase: SupabaseClient) {
  const account = await rpc<HostAccount | null>(supabase, "get_host_account");

  if (!account) {
    throw new AppError("ホストアカウント情報を取得できません。", 404);
  }

  return account;
}

export async function listHostRoomsFromSupabase(supabase: SupabaseClient) {
  return rpc<RoomSnapshot[]>(supabase, "list_host_rooms");
}

export async function createRoomFromSupabase(supabase: SupabaseClient) {
  return rpc<RoomSnapshot>(supabase, "create_room");
}

export async function startRoomRoundFromSupabase(
  supabase: SupabaseClient,
  code: string,
) {
  return rpc<RoomSnapshot>(supabase, "start_room_round", {
    p_room_code: code,
  });
}

export async function resetRoomRoundFromSupabase(
  supabase: SupabaseClient,
  code: string,
) {
  return rpc<RoomSnapshot>(supabase, "reset_room_round", {
    p_room_code: code,
  });
}

export async function getRoomSnapshotFromSupabase(
  supabase: SupabaseClient,
  code: string,
) {
  return rpc<RoomSnapshot | null>(supabase, "get_room_snapshot", {
    p_room_code: code,
  });
}

export async function joinRoomFromSupabase(
  supabase: SupabaseClient,
  code: string,
  name: string,
) {
  return rpc<{ participant: Participant; room: RoomSnapshot }>(
    supabase,
    "join_room",
    {
      p_room_code: code,
      p_name: name,
    },
  );
}

export async function submitBuzzFromSupabase(
  supabase: SupabaseClient,
  code: string,
  participantId: string,
) {
  return rpc<{ outcome: string; room: RoomSnapshot }>(supabase, "submit_buzz", {
    p_room_code: code,
    p_participant_id: participantId,
  });
}

export async function upsertHostSubscriptionWithAdmin(
  supabase: SupabaseClient,
  hostId: string,
  plan: SubscriptionPlan,
  status: HostAccount["status"],
  extraPackQuantity = 0,
  stripeData?: {
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    stripeSubscriptionStatus?: string | null;
  },
) {
  const normalizedExtraPackQuantity = normalizeExtraPackQuantity(extraPackQuantity);
  const participantLimit = getParticipantLimit(plan, normalizedExtraPackQuantity);
  const { data, error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        host_user_id: hostId,
        plan,
        status,
        participant_limit: participantLimit,
        extra_pack_quantity: normalizedExtraPackQuantity,
        stripe_customer_id: stripeData?.stripeCustomerId ?? null,
        stripe_subscription_id: stripeData?.stripeSubscriptionId ?? null,
        stripe_subscription_status: stripeData?.stripeSubscriptionStatus ?? null,
      },
      { onConflict: "host_user_id" },
    )
    .select()
    .single();

  if (error) {
    throw new AppError(error.message, 400);
  }

  return data;
}

export async function claimStripeEventWithAdmin(
  supabase: SupabaseClient,
  eventId: string,
  eventType: string,
  staleAfterSeconds = 300,
) {
  return rpc<boolean>(supabase, "claim_stripe_event", {
    p_event_id: eventId,
    p_event_type: eventType,
    p_stale_after_seconds: staleAfterSeconds,
  });
}

export async function completeStripeEventWithAdmin(
  supabase: SupabaseClient,
  eventId: string,
) {
  return rpc<null>(supabase, "complete_stripe_event", {
    p_event_id: eventId,
  });
}

export async function failStripeEventWithAdmin(
  supabase: SupabaseClient,
  eventId: string,
  errorMessage: string,
) {
  return rpc<null>(supabase, "fail_stripe_event", {
    p_event_id: eventId,
    p_error: errorMessage,
  });
}
