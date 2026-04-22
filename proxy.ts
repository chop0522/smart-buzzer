import type { NextRequest } from "next/server";
import { isAdminBasicAuthConfigured, serverEnv } from "@/lib/env";
import { updateSession } from "@/lib/supabase/proxy";

const BASIC_AUTH_REALM = 'Basic realm="Smart Buzzer Host Admin", charset="UTF-8"';

function unauthorized() {
  return new Response("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": BASIC_AUTH_REALM,
    },
  });
}

function parseBasicAuth(authorization: string | null) {
  if (!authorization?.startsWith("Basic ")) {
    return null;
  }

  try {
    const decoded = atob(authorization.slice(6));
    const separatorIndex = decoded.indexOf(":");

    if (separatorIndex === -1) {
      return null;
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}

function isProtectedAdminPath(pathname: string) {
  if (pathname === "/host" || pathname.startsWith("/host/")) {
    return true;
  }

  if (pathname === "/account" || pathname.startsWith("/account/")) {
    return true;
  }

  if (pathname === "/api/auth/host-login" || pathname === "/api/auth/host-logout") {
    return true;
  }

  if (pathname.startsWith("/api/account/") || pathname.startsWith("/api/billing/")) {
    return true;
  }

  if (pathname === "/api/rooms") {
    return true;
  }

  return /^\/api\/rooms\/[^/]+\/(start|reset)$/.test(pathname);
}

export async function proxy(request: NextRequest) {
  if (isAdminBasicAuthConfigured() && isProtectedAdminPath(request.nextUrl.pathname)) {
    const credentials = parseBasicAuth(request.headers.get("authorization"));

    if (
      credentials?.username !== serverEnv.adminBasicAuthUser ||
      credentials.password !== serverEnv.adminBasicAuthPassword
    ) {
      return unauthorized();
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
