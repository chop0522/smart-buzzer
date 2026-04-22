const defaultAppUrl = "http://127.0.0.1:3000";
const forceFallbackMode = process.env.PLAYWRIGHT_FALLBACK_MODE === "1";

function getEnvValue(name: keyof NodeJS.ProcessEnv) {
  if (forceFallbackMode) {
    return "";
  }

  return process.env[name] ?? "";
}

function getPositiveIntEnv(
  name: keyof NodeJS.ProcessEnv,
  fallback: number,
) {
  const raw = process.env[name];
  const parsed = Number.parseInt(raw ?? "", 10);

  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return fallback;
}

export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? defaultAppUrl,
  supabaseUrl: getEnvValue("NEXT_PUBLIC_SUPABASE_URL"),
  supabasePublishableKey: getEnvValue("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
};

export const serverEnv = {
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? "smart_buzzer_host",
  hostDemoPassword: process.env.HOST_DEMO_PASSWORD ?? "",
  hostSessionSecret: process.env.HOST_SESSION_SECRET ?? "",
  adminBasicAuthUser: process.env.ADMIN_BASIC_AUTH_USER ?? "",
  adminBasicAuthPassword: process.env.ADMIN_BASIC_AUTH_PASSWORD ?? "",
  hostLoginMaxAttempts: getPositiveIntEnv("HOST_LOGIN_MAX_ATTEMPTS", 10),
  hostLoginLockoutMinutes: getPositiveIntEnv("HOST_LOGIN_LOCKOUT_MINUTES", 30),
  hostLoginAttemptWindowMinutes: getPositiveIntEnv(
    "HOST_LOGIN_ATTEMPT_WINDOW_MINUTES",
    30,
  ),
  stripeSecretKey: getEnvValue("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: getEnvValue("STRIPE_WEBHOOK_SECRET"),
  stripePriceStarterMonthly: getEnvValue("STRIPE_PRICE_STARTER_MONTHLY"),
  stripePriceProMonthly: getEnvValue("STRIPE_PRICE_PRO_MONTHLY"),
  stripePriceExtraPackMonthly: getEnvValue("STRIPE_PRICE_EXTRA_PACK_MONTHLY"),
  supabaseServiceRoleKey: getEnvValue("SUPABASE_SERVICE_ROLE_KEY"),
};

export function isRealtimeConfigured() {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabasePublishableKey);
}

export function isRealtimeBroadcastServerConfigured() {
  return Boolean(publicEnv.supabaseUrl && serverEnv.supabaseServiceRoleKey);
}

export function isStripeConfigured() {
  return Boolean(
    serverEnv.stripeSecretKey &&
      serverEnv.stripeWebhookSecret &&
      serverEnv.stripePriceStarterMonthly &&
      serverEnv.stripePriceProMonthly &&
      serverEnv.stripePriceExtraPackMonthly,
  );
}

export function isSupabaseConfigured() {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabasePublishableKey);
}

export function isSupabaseAdminConfigured() {
  return Boolean(isSupabaseConfigured() && serverEnv.supabaseServiceRoleKey);
}

export function isAdminBasicAuthConfigured() {
  return Boolean(
    serverEnv.adminBasicAuthUser && serverEnv.adminBasicAuthPassword,
  );
}
