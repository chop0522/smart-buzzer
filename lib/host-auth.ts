import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { serverEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import type { HostSession } from "@/lib/types";

const globalForHostAuth = globalThis as typeof globalThis & {
  __smartBuzzerSessionSecret?: string;
};

function getSessionSecret() {
  if (serverEnv.hostSessionSecret) {
    return serverEnv.hostSessionSecret;
  }

  globalForHostAuth.__smartBuzzerSessionSecret ??= randomBytes(32).toString(
    "hex",
  );

  return globalForHostAuth.__smartBuzzerSessionSecret;
}

function signPayload(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}

function encodeSession(session: HostSession) {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString(
    "base64url",
  );
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

function decodeSession(raw: string): HostSession | null {
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expected = signPayload(payload);

  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export function isDemoHostLoginAvailable() {
  return process.env.NODE_ENV !== "production" && !serverEnv.hostDemoPassword;
}

export async function createHostSession(hostId: string) {
  const cookieStore = await cookies();
  const token = encodeSession({
    hostId,
    issuedAt: Date.now(),
  });

  cookieStore.set(serverEnv.sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function clearHostSession() {
  const cookieStore = await cookies();
  cookieStore.delete(serverEnv.sessionCookieName);
}

export async function getHostSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(serverEnv.sessionCookieName)?.value;
  if (!raw) {
    return null;
  }

  return decodeSession(raw);
}

export async function requireHostSession() {
  const session = await getHostSession();
  if (!session) {
    throw new AppError("ホストログインが必要です。", 401);
  }

  return session;
}

export function validateHostPassword(password: string) {
  if (!serverEnv.hostDemoPassword) {
    throw new AppError(
      "HOST_DEMO_PASSWORD が未設定です。開発時はデモログインを使ってください。",
      400,
    );
  }

  const expected = Buffer.from(serverEnv.hostDemoPassword);
  const received = Buffer.from(password);

  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    throw new AppError("ホスト用パスワードが一致しません。", 401);
  }
}
