/**
 * Basco Sports – Integration Configuration Layer
 * Typed server-side environment validation.
 * No secrets are exposed to client bundle.
 */

export type PaymentProviderName = 'demo' | 'stripe' | 'paypal';

export interface ServerEnv {
  GOOGLE_SITE_VERIFICATION: string | null;
  ADMIN_EMAIL: string | null;
  ADMIN_PASSWORD_HASH: string | null;
  ADMIN_SESSION_SECRET: string | null;
  PAYMENT_PROVIDER: PaymentProviderName;
  STRIPE_SECRET_KEY: string | null;
  STRIPE_WEBHOOK_SECRET: string | null;
  HERMES_API_KEY: string | null;
  HERMES_BASE_URL: string | null;
  HERMES_ENABLED: boolean;
  NODE_ENV: string;
}

export interface ClientEnv {
  NEXT_PUBLIC_GA_MEASUREMENT_ID: string | null;
  NEXT_PUBLIC_ADSENSE_CLIENT_ID: string | null;
  NEXT_PUBLIC_ADSENSE_SLOT_HEADER: string | null;
  NEXT_PUBLIC_ADSENSE_SLOT_FOOTER: string | null;
  NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR: string | null;
  NEXT_PUBLIC_ADSENSE_SLOT_PRODUCT: string | null;
  NEXT_PUBLIC_BASCO_PAYMENT_MODE: 'demo' | 'live';
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string | null;
  NEXT_PUBLIC_SITE_URL: string | null;
}

function getTrimmed(name: string): string | null {
  const v = process.env[name];
  if (!v) return null;
  const t = v.trim();
  if (t === '' || t.toLowerCase() === 'placeholder' || t.includes('REPLACE') || t.includes('XXXX')) return null;
  // Also treat obvious dummy placeholders as not configured
  if (t === 'your-google-site-verification-token' || t === 'ca-pub-XXXXXXXXXXXXXXXX' || t.startsWith('G-XXXXXXXX')) return null;
  return t;
}

function getBoolean(name: string, defaultVal = false): boolean {
  const v = process.env[name];
  if (!v) return defaultVal;
  return v.toLowerCase() === 'true' || v === '1';
}

export function getServerEnv(): ServerEnv {
  const paymentRaw = (getTrimmed('PAYMENT_PROVIDER') || 'demo').toLowerCase() as PaymentProviderName;
  const allowed: PaymentProviderName[] = ['demo', 'stripe', 'paypal'];
  const paymentProvider = allowed.includes(paymentRaw) ? paymentRaw : 'demo';

  return {
    GOOGLE_SITE_VERIFICATION: getTrimmed('GOOGLE_SITE_VERIFICATION'),
    ADMIN_EMAIL: getTrimmed('ADMIN_EMAIL'),
    ADMIN_PASSWORD_HASH: getTrimmed('ADMIN_PASSWORD_HASH'),
    ADMIN_SESSION_SECRET: getTrimmed('ADMIN_SESSION_SECRET'),
    PAYMENT_PROVIDER: paymentProvider,
    STRIPE_SECRET_KEY: getTrimmed('STRIPE_SECRET_KEY'),
    STRIPE_WEBHOOK_SECRET: getTrimmed('STRIPE_WEBHOOK_SECRET'),
    HERMES_API_KEY: getTrimmed('HERMES_API_KEY'),
    HERMES_BASE_URL: getTrimmed('HERMES_BASE_URL'),
    HERMES_ENABLED: getBoolean('HERMES_ENABLED', false),
    NODE_ENV: process.env.NODE_ENV || 'development',
  };
}

export function getClientEnv(): ClientEnv {
  const modeRaw = (getTrimmed('NEXT_PUBLIC_BASCO_PAYMENT_MODE') || 'demo').toLowerCase();
  const paymentMode = modeRaw === 'live' ? 'live' : 'demo';

  return {
    NEXT_PUBLIC_GA_MEASUREMENT_ID: getTrimmed('NEXT_PUBLIC_GA_MEASUREMENT_ID'),
    NEXT_PUBLIC_ADSENSE_CLIENT_ID: getTrimmed('NEXT_PUBLIC_ADSENSE_CLIENT_ID'),
    NEXT_PUBLIC_ADSENSE_SLOT_HEADER: getTrimmed('NEXT_PUBLIC_ADSENSE_SLOT_HEADER'),
    NEXT_PUBLIC_ADSENSE_SLOT_FOOTER: getTrimmed('NEXT_PUBLIC_ADSENSE_SLOT_FOOTER'),
    NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR: getTrimmed('NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR'),
    NEXT_PUBLIC_ADSENSE_SLOT_PRODUCT: getTrimmed('NEXT_PUBLIC_ADSENSE_SLOT_PRODUCT'),
    NEXT_PUBLIC_BASCO_PAYMENT_MODE: paymentMode,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: getTrimmed('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
    NEXT_PUBLIC_SITE_URL: getTrimmed('NEXT_PUBLIC_SITE_URL'),
  };
}

// Helpers for integration status (no secret values exposed)
export function isGaConfigured(env: ClientEnv): boolean {
  return !!env.NEXT_PUBLIC_GA_MEASUREMENT_ID && env.NEXT_PUBLIC_GA_MEASUREMENT_ID.startsWith('G-');
}

export function isAdSenseConfigured(env: ClientEnv): boolean {
  return !!env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && env.NEXT_PUBLIC_ADSENSE_CLIENT_ID.startsWith('ca-pub-');
}

export function hasAdSlot(env: ClientEnv, slot: keyof ClientEnv): boolean {
  return !!env[slot];
}

export function isSearchConsoleConfigured(env: ServerEnv): boolean {
  return !!env.GOOGLE_SITE_VERIFICATION;
}

export function isAdminConfigured(env: ServerEnv): boolean {
  return !!env.ADMIN_EMAIL && !!env.ADMIN_PASSWORD_HASH && !!env.ADMIN_SESSION_SECRET;
}

export function isHermesConfigured(env: ServerEnv): boolean {
  return env.HERMES_ENABLED && !!env.HERMES_API_KEY && !!env.HERMES_BASE_URL;
}

export function isStripeConfigured(server: ServerEnv, client: ClientEnv): boolean {
  return server.PAYMENT_PROVIDER === 'stripe' && !!server.STRIPE_SECRET_KEY && !!client.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
}
