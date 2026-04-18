export type SubscriptionPlan = "free" | "starter" | "pro";
export type SubscriptionStatus =
  | "inactive"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled";
export type RoundStatus = "idle" | "open" | "closed";
export type ParticipantResult = "waiting" | "first" | "second" | "locked_out";

export interface HostAccount {
  hostId: string;
  displayName: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  participantLimit: number;
  extraPackQuantity: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeSubscriptionStatus: string | null;
  lastUpdatedAt: string;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  lastResult: ParticipantResult;
}

export interface Winner {
  participantId: string;
  name: string;
  rank: 1 | 2;
  serverReceivedAt: string;
}

export interface RoundState {
  id: number;
  status: RoundStatus;
  startedAt: string | null;
  closedAt: string | null;
  winners: Winner[];
}

export interface RoomSnapshot {
  code: string;
  hostId: string;
  hostName: string;
  createdAt: string;
  updatedAt: string;
  subscription: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    participantLimit: number;
    extraPackQuantity: number;
  };
  participants: Participant[];
  round: RoundState;
}

export interface HostSession {
  hostId: string;
  issuedAt: number;
}

export interface ApiSuccess<T> {
  data: T;
}

export interface ApiFailure {
  error: string;
}
