import { cookies } from "next/headers";
import Link from "next/link";
import { getServerEnv, getClientEnv, isAdminConfigured, isGaConfigured, isAdSenseConfigured, isSearchConsoleConfigured, isHermesConfigured, isStripeConfigured } from "@/lib/env";
import { verifySessionToken, ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

function maskValue(value: string | null, visibleStart = 4, visibleEnd = 3): string {
  if (!value) return 'Not set';
  if (value.length <= visibleStart + visibleEnd + 3) return '••••••••';
  return `${value.slice(0, visibleStart)}••••${value.slice(-visibleEnd)} (masked)`;
}

export default async function AdminIntegrationsPage() {
  const serverEnv = getServerEnv();
  const clientEnv = getClientEnv();
  const adminConfigured = isAdminConfigured(serverEnv);
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const isAuthenticated = !!session || !adminConfigured;

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-[20px] border p-12 text-center">
        <h3 className="font-display text-[22px]">Authentication required</h3>
        <p className="mt-2 text-[14px] text-obsidian/60">Please log in to view integrations. Secrets are never displayed in UI.</p>
        <Link href="/admin/login" className="mt-6 inline-flex h-11 px-6 rounded-full bg-obsidian text-white items-center">Go to login</Link>
      </div>
    );
  }

  const gaConfigured = isGaConfigured(clientEnv);
  const adSenseConfigured = isAdSenseConfigured(clientEnv);
  const searchConfigured = isSearchConsoleConfigured(serverEnv);
  const hermesConfigured = isHermesConfigured(serverEnv);
  const stripeConfigured = isStripeConfigured(serverEnv, clientEnv);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[32px] leading-none">Integrations</h1>
          <p className="mt-2 text-[13px] text-obsidian/60">Status based only on whether config exists – never actual secret values. All settings are masked, never editable in public browser UI.</p>
        </div>
        <Link href="/admin" className="h-10 px-5 rounded-full border bg-white text-[13px] flex items-center">← Overview</Link>
      </div>

      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        {/* GA */}
        <div className="bg-white rounded-[20px] border p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Google Analytics 4</h3>
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${gaConfigured ? 'bg-lime text-obsidian' : 'bg-stone-200'}`}>{gaConfigured ? 'Configured' : 'Not configured'}</span>
          </div>
          <p className="mt-2 text-[12px] text-obsidian/60">Privacy-respecting: loads only when NEXT_PUBLIC_GA_MEASUREMENT_ID configured AND user gives explicit analytics consent via cookie banner.</p>
          <div className="mt-4 space-y-2 text-[12px]">
            <div className="flex justify-between"><span className="opacity-60">Env var</span><span className="font-mono">NEXT_PUBLIC_GA_MEASUREMENT_ID</span></div>
            <div className="flex justify-between"><span className="opacity-60">Status</span><span>{gaConfigured ? '✓ ID present and valid format G-...' : '✗ Missing or placeholder'}</span></div>
            <div className="flex justify-between"><span className="opacity-60">Value (masked)</span><span>{maskValue(clientEnv.NEXT_PUBLIC_GA_MEASUREMENT_ID)}</span></div>
            <div className="flex justify-between"><span className="opacity-60">Consent required</span><span>Analytics = true</span></div>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-stone-50 border text-[11px]">Inactive until configured/deployed. No tracking without consent. See Privacy page for cookie preferences link.</div>
        </div>

        {/* AdSense */}
        <div className="bg-white rounded-[20px] border p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Google AdSense</h3>
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${adSenseConfigured ? 'bg-lime text-obsidian' : 'bg-stone-200'}`}>{adSenseConfigured ? 'Configured' : 'Not configured'}</span>
          </div>
          <p className="mt-2 text-[12px] text-obsidian/60">Reusable AdSlot component – does NOT load/render real AdSense ad unless client ID AND slot ID configured AND advertising consent exists. Otherwise safe placeholder only in development, no ad request in production.</p>
          <div className="mt-4 space-y-2 text-[12px]">
            <div className="flex justify-between"><span className="opacity-60">Client ID env</span><span className="font-mono">NEXT_PUBLIC_ADSENSE_CLIENT_ID</span></div>
            <div className="flex justify-between"><span className="opacity-60">Client masked</span><span>{maskValue(clientEnv.NEXT_PUBLIC_ADSENSE_CLIENT_ID, 10, 4)}</span></div>
            <div className="flex justify-between"><span className="opacity-60">Slots</span><span className="text-[11px]">Header: {clientEnv.NEXT_PUBLIC_ADSENSE_SLOT_HEADER ? '✓' : '✗'} | Footer: {clientEnv.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER ? '✓' : '✗'} | Sidebar: {clientEnv.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR ? '✓' : '✗'} | Product: {clientEnv.NEXT_PUBLIC_ADSENSE_SLOT_PRODUCT ? '✓' : '✗'}</span></div>
            <div className="flex justify-between"><span className="opacity-60">Consent</span><span>Advertising = true</span></div>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px]">AdSense policy: requires approved AdSense account, domain approval, ads.txt. No real ads in demo. Component prevents policy violation by not loading script without consent+config.</div>
        </div>

        {/* Search Console */}
        <div className="bg-white rounded-[20px] border p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Google Search Console</h3>
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${searchConfigured ? 'bg-lime text-obsidian' : 'bg-stone-200'}`}>{searchConfigured ? 'Configured' : 'Not configured'}</span>
          </div>
          <p className="mt-2 text-[12px] text-obsidian/60">Verification via meta tag driven by server env GOOGLE_SITE_VERIFICATION. No client exposure of secret, only meta content.</p>
          <div className="mt-4 space-y-2 text-[12px]">
            <div className="flex justify-between"><span className="opacity-60">Env var</span><span className="font-mono">GOOGLE_SITE_VERIFICATION</span></div>
            <div className="flex justify-between"><span className="opacity-60">Masked</span><span>{maskValue(serverEnv.GOOGLE_SITE_VERIFICATION)}</span></div>
            <div className="flex justify-between"><span className="opacity-60">Implementation</span><span>generateMetadata() verification.google + meta tag</span></div>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-stone-50 border text-[11px]">Setup: Search Console → Add property → HTML tag → copy content token → set env → deploy → Verify. No Google API call from app.</div>
        </div>

        {/* Payments */}
        <div className="bg-white rounded-[20px] border p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Payments</h3>
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${serverEnv.PAYMENT_PROVIDER === 'demo' ? 'bg-stone-200' : 'bg-lime'}`}>Provider: {serverEnv.PAYMENT_PROVIDER} • Mode: {clientEnv.NEXT_PUBLIC_BASCO_PAYMENT_MODE}</span>
          </div>
          <p className="mt-2 text-[12px] text-obsidian/60">Checkout remains demo-only and cannot charge user. Payment adapter pattern in src/lib/payment-adapter.ts – DemoPaymentProvider active. Stripe live requires server env STRIPE_SECRET_KEY (never NEXT_PUBLIC) + publishable key + webhook.</p>
          <div className="mt-4 space-y-2 text-[12px]">
            <div className="flex justify-between"><span className="opacity-60">PAYMENT_PROVIDER</span><span>{serverEnv.PAYMENT_PROVIDER}</span></div>
            <div className="flex justify-between"><span className="opacity-60">NEXT_PUBLIC_BASCO_PAYMENT_MODE</span><span>{clientEnv.NEXT_PUBLIC_BASCO_PAYMENT_MODE}</span></div>
            <div className="flex justify-between"><span className="opacity-60">Stripe secret</span><span>{maskValue(serverEnv.STRIPE_SECRET_KEY)}</span></div>
            <div className="flex justify-between"><span className="opacity-60">Stripe publishable</span><span>{maskValue(clientEnv.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)}</span></div>
            <div className="flex justify-between"><span className="opacity-60">Stripe webhook</span><span>{maskValue(serverEnv.STRIPE_WEBHOOK_SECRET)}</span></div>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-800">Demo-only: No real charge possible. UI shows PAYMENTS IN DEMO MODE badge. To go live, follow README Payments later section – never hardcode secrets.</div>
        </div>

        {/* Hermes */}
        <div className="bg-white rounded-[20px] border p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Hermes Connector – Generic Custom API</h3>
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${hermesConfigured ? 'bg-lime text-obsidian' : 'bg-stone-200'}`}>{hermesConfigured ? 'Configured & Enabled' : 'Not configured / Disabled'}</span>
          </div>
          <p className="mt-2 text-[12px] text-obsidian/60">Do not assume which Hermes service – label as configurable custom API integration. Acts as generic HTTP connector for future custom backend, fulfillment, or ERP.</p>
          <div className="mt-4 grid sm:grid-cols-3 gap-4 text-[12px]">
            <div className="p-3 rounded-xl bg-stone-50 border"><div className="opacity-60">HERMES_ENABLED</div><div className="font-mono mt-1">{String(serverEnv.HERMES_ENABLED)}</div><div className="text-[11px] opacity-60 mt-1">Boolean flag to enable connector</div></div>
            <div className="p-3 rounded-xl bg-stone-50 border"><div className="opacity-60">HERMES_BASE_URL</div><div className="font-mono mt-1">{maskValue(serverEnv.HERMES_BASE_URL, 8, 8)}</div><div className="text-[11px] opacity-60 mt-1">Base URL of custom API</div></div>
            <div className="p-3 rounded-xl bg-stone-50 border"><div className="opacity-60">HERMES_API_KEY</div><div className="font-mono mt-1">{maskValue(serverEnv.HERMES_API_KEY)}</div><div className="text-[11px] opacity-60 mt-1">Server-only API key, never client</div></div>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-stone-50 border text-[11px]">
            <div className="font-semibold">Required fields</div>
            <ul className="mt-2 list-disc pl-5 space-y-1 opacity-70">
              <li>HERMES_ENABLED=true to activate</li>
              <li>HERMES_BASE_URL – https://api.hermes.example.com (your custom endpoint)</li>
              <li>HERMES_API_KEY – server-only secret, store in Vercel/Cloudflare env dashboard, never NEXT_PUBLIC</li>
              <li>Implementation point: src/lib/hermes-client.ts (to be created when service defined) – use fetch with API key in Authorization header, never log key</li>
            </ul>
            <div className="mt-3">Inactive until configured/deployed. No external API call is made in demo.</div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-obsidian text-white rounded-[20px] p-6">
        <h3 className="font-display text-[18px]">All settings are masked, never editable in public browser UI</h3>
        <p className="mt-2 text-[12px] text-white/70">Integration status is derived from whether env vars exist, not their content. Secrets are server-only and never sent to client bundle. Admin UI shows masked values only. To change config, update env vars in Vercel (Project Settings → Environment Variables) or Cloudflare Pages (Settings → Environment variables) and redeploy. Never commit .env.local, never expose secrets in README, logs, or UI.</p>
      </div>
    </div>
  );
}
