const defaultAppUrl = "http://127.0.0.1:3000";

export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? defaultAppUrl,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
};

export const serverEnv = {
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? "smart_buzzer_host",
  hostDemoPassword: process.env.HOST_DEMO_PASSWORD ?? "",
  hostSessionSecret: process.env.HOST_SESSION_SECRET ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripePriceStarterMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? "",
  stripePriceProMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "",
  stripePriceExtraPackMonthly: process.env.STRIPE_PRICE_EXTRA_PACK_MONTHLY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
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
