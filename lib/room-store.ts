import "server-only";

import { randomUUID } from "node:crypto";
import { AppError } from "@/lib/errors";
import { getParticipantLimit, getUpgradeMessage, normalizeExtraPackQuantity } from "@/lib/plans";
import type {
  HostAccount,
  Participant,
  ParticipantResult,
  RoomSnapshot,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/lib/types";

interface StoreState {
  accounts: Map<string, HostAccount>;
  rooms: Map<string, RoomSnapshot>;
  hostRooms: Map<string, string[]>;
  roomQueues: Map<string, Promise<unknown>>;
}

const globalForStore = globalThis as typeof globalThis & {
  __smartBuzzerStore?: StoreState;
};

function nowIso() {
  return new Date().toISOString();
}

function cloneRoom<T>(value: T) {
  return structuredClone(value);
}

function buildAccount(hostId: string): HostAccount {
  return {
    hostId,
    displayName: "Demo Host",
    plan: "free",
    status: "inactive",
    participantLimit: getParticipantLimit("free"),
    extraPackQuantity: 0,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripeSubscriptionStatus: null,
    lastUpdatedAt: nowIso(),
  };
}

function buildEmptyRoom(hostId: string, hostName: string, code: string): RoomSnapshot {
  const account = getHostAccount(hostId);
  const timestamp = nowIso();

  return {
    code,
    hostId,
    hostName,
    createdAt: timestamp,
    updatedAt: timestamp,
    subscription: {
      plan: account.plan,
      status: account.status,
      participantLimit: account.participantLimit,
      extraPackQuantity: account.extraPackQuantity,
    },
    participants: [],
    round: {
      id: 1,
      status: "idle",
      startedAt: null,
      closedAt: null,
      winners: [],
    },
  };
}

function getStore() {
  globalForStore.__smartBuzzerStore ??= {
    accounts: new Map<string, HostAccount>(),
    rooms: new Map<string, RoomSnapshot>(),
    hostRooms: new Map<string, string[]>(),
    roomQueues: new Map<string, Promise<unknown>>(),
  };

  return globalForStore.__smartBuzzerStore;
}

function ensureHostRoomIndex(hostId: string, code: string) {
  const store = getStore();
  const current = store.hostRooms.get(hostId) ?? [];
  if (!current.includes(code)) {
    current.unshift(code);
  }
  store.hostRooms.set(hostId, current);
}

function syncRoomSubscription(room: RoomSnapshot) {
  const account = getHostAccount(room.hostId);
  room.subscription = {
    plan: account.plan,
    status: account.status,
    participantLimit: account.participantLimit,
    extraPackQuantity: account.extraPackQuantity,
  };
  room.updatedAt = nowIso();
}

function findRoom(code: string) {
  const store = getStore();
  const room = store.rooms.get(code.toUpperCase());
  if (!room) {
    throw new AppError("ルームが見つかりません。", 404);
  }

  syncRoomSubscription(room);
  return room;
}

function generateRoomCode() {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const store = getStore();

  while (true) {
    const code = Array.from({ length: 6 }, () =>
      charset[Math.floor(Math.random() * charset.length)],
    ).join("");

    if (!store.rooms.has(code)) {
      return code;
    }
  }
}

function findParticipant(room: RoomSnapshot, participantId: string) {
  const participant = room.participants.find((entry) => entry.id === participantId);
  if (!participant) {
    throw new AppError("参加者が見つかりません。", 404);
  }

  return participant;
}

function updateParticipantResult(
  room: RoomSnapshot,
  participantId: string,
  result: ParticipantResult,
) {
  const participant = findParticipant(room, participantId);
  participant.lastResult = result;
}

export function getHostAccount(hostId: string) {
  const store = getStore();
  const current = store.accounts.get(hostId);

  if (current) {
    return current;
  }

  const created = buildAccount(hostId);
  store.accounts.set(hostId, created);
  return created;
}

export function setHostSubscriptionPlan(
  hostId: string,
  plan: SubscriptionPlan,
  status: SubscriptionStatus,
  extraPackQuantity = 0,
  stripeData?: {
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    stripeSubscriptionStatus?: string | null;
  },
) {
  const account = getHostAccount(hostId);
  const normalizedExtraPackQuantity = normalizeExtraPackQuantity(extraPackQuantity);
  account.plan = plan;
  account.status = status;
  account.extraPackQuantity = normalizedExtraPackQuantity;
  account.participantLimit = getParticipantLimit(plan, normalizedExtraPackQuantity);
  account.lastUpdatedAt = nowIso();
  account.stripeCustomerId = stripeData?.stripeCustomerId ?? account.stripeCustomerId;
  account.stripeSubscriptionId =
    stripeData?.stripeSubscriptionId ?? account.stripeSubscriptionId;
  account.stripeSubscriptionStatus =
    stripeData?.stripeSubscriptionStatus ?? account.stripeSubscriptionStatus;

  for (const room of listRoomsForHost(hostId)) {
    const liveRoom = findRoom(room.code);
    syncRoomSubscription(liveRoom);
  }

  return cloneRoom(account);
}

export function listRoomsForHost(hostId: string) {
  const store = getStore();
  const codes = store.hostRooms.get(hostId) ?? [];
  return codes
    .map((code) => {
      const room = store.rooms.get(code);
      if (room) {
        syncRoomSubscription(room);
      }
      return room;
    })
    .filter((room): room is RoomSnapshot => Boolean(room))
    .map((room) => cloneRoom(room));
}

export function getRoomSnapshot(code: string) {
  const upperCode = code.toUpperCase();
  const store = getStore();

  if (upperCode === "DEMO42" && !store.rooms.has(upperCode)) {
    const demoRoom = buildEmptyRoom("demo-host", "Demo Host", upperCode);
    store.rooms.set(upperCode, demoRoom);
    ensureHostRoomIndex("demo-host", upperCode);
  }

  const room = store.rooms.get(upperCode);
  if (!room) {
    return null;
  }

  syncRoomSubscription(room);
  return cloneRoom(room);
}

export function createRoom(hostId: string) {
  const store = getStore();
  const account = getHostAccount(hostId);
  const code = generateRoomCode();
  const room = buildEmptyRoom(hostId, account.displayName, code);
  store.rooms.set(code, room);
  ensureHostRoomIndex(hostId, code);
  return cloneRoom(room);
}

export async function withRoomLock<T>(
  code: string,
  task: () => T | Promise<T>,
): Promise<T> {
  const store = getStore();
  const key = code.toUpperCase();
  const previous = store.roomQueues.get(key) ?? Promise.resolve();

  let release = () => {};
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const queued = previous.then(() => current);

  store.roomQueues.set(key, queued);

  try {
    await previous;
    return await task();
  } finally {
    release();
    if (store.roomQueues.get(key) === queued) {
      store.roomQueues.delete(key);
    }
  }
}

export function joinRoom(code: string, name: string) {
  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    throw new AppError("参加者名は2文字以上で入力してください。");
  }

  const room = findRoom(code);

  if (room.participants.length >= room.subscription.participantLimit) {
    throw new AppError(
      getUpgradeMessage(room.subscription.participantLimit),
      403,
    );
  }

  const duplicate = room.participants.find(
    (participant) => participant.name.toLowerCase() === trimmedName.toLowerCase(),
  );

  if (duplicate) {
    throw new AppError("同じ名前の参加者がすでにいます。");
  }

  const participant: Participant = {
    id: randomUUID(),
    name: trimmedName,
    joinedAt: nowIso(),
    lastResult: "waiting",
  };

  room.participants.push(participant);
  room.updatedAt = nowIso();

  return {
    participant: cloneRoom(participant),
    room: cloneRoom(room),
  };
}

export function startRound(code: string) {
  const room = findRoom(code);
  room.round = {
    id: room.round.id + 1,
    status: "open",
    startedAt: nowIso(),
    closedAt: null,
    winners: [],
  };
  room.participants.forEach((participant) => {
    participant.lastResult = "waiting";
  });
  room.updatedAt = nowIso();
  return cloneRoom(room);
}

export function resetRound(code: string) {
  const room = findRoom(code);
  room.round = {
    id: room.round.id + 1,
    status: "idle",
    startedAt: null,
    closedAt: null,
    winners: [],
  };
  room.participants.forEach((participant) => {
    participant.lastResult = "waiting";
  });
  room.updatedAt = nowIso();
  return cloneRoom(room);
}

export function buzzRoom(code: string, participantId: string) {
  const room = findRoom(code);

  if (room.round.status !== "open") {
    throw new AppError("現在のラウンドは受付中ではありません。", 409);
  }

  if (room.round.winners.some((winner) => winner.participantId === participantId)) {
    throw new AppError("この参加者はすでに入賞しています。", 409);
  }

  const participant = findParticipant(room, participantId);

  if (room.round.winners.length >= 2) {
    participant.lastResult = "locked_out";
    room.round.status = "closed";
    room.round.closedAt = room.round.closedAt ?? nowIso();
    room.updatedAt = nowIso();
    return {
      outcome: "locked_out" as const,
      room: cloneRoom(room),
    };
  }

  const rank = (room.round.winners.length + 1) as 1 | 2;
  const receivedAt = nowIso();

  room.round.winners.push({
    participantId,
    name: participant.name,
    rank,
    serverReceivedAt: receivedAt,
  });
  updateParticipantResult(room, participantId, rank === 1 ? "first" : "second");

  if (rank === 2) {
    room.round.status = "closed";
    room.round.closedAt = receivedAt;

    room.participants.forEach((entry) => {
      if (!room.round.winners.some((winner) => winner.participantId === entry.id)) {
        entry.lastResult = "locked_out";
      }
    });
  }

  room.updatedAt = receivedAt;

  return {
    outcome: rank === 1 ? "first" : "second",
    room: cloneRoom(room),
  };
}
