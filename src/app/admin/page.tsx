import Link from "next/link";
import { cookies } from "next/headers";
import { getServerEnv, getClientEnv, isAdminConfigured, isGaConfigured, isAdSenseConfigured, isSearchConsoleConfigured, isHermesConfigured, isStripeConfigured } from "@/lib/env";
import { verifySessionToken, ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";
import { products } from "@/data/products";

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  const serverEnv = getServerEnv();
  const clientEnv = getClientEnv();
  const adminConfigured = isAdminConfigured(serverEnv);

  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const isAuthenticated = !!session || !adminConfigured; // if not configured, allow dev mock

  const gaConfigured = isGaConfigured(clientEnv);
  const adSenseConfigured = isAdSenseConfigured(clientEnv);
  const searchConfigured = isSearchConsoleConfigured(serverEnv);
  const hermesConfigured = isHermesConfigured(serverEnv);
  const stripeConfigured = isStripeConfigured(serverEnv, clientEnv);

  const integrationCount = [gaConfigured, adSenseConfigured, searchConfigured, hermesConfigured, stripeConfigured].filter(Boolean).length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[32px] leading-none">Admin overview</h1>
          <p className="mt-2 text-[13px] text-obsidian/60">Catalog, orders (demo), newsletter (demo), integration status – based only on whether config exists, never secret values.</p>
        </div>
        <div className="flex gap-2">
          {isAuthenticated ? (
            <form action="/api/admin/logout" method="POST">
              <button type="submit" className="h-10 px-5 rounded-full border border-stone-200 bg-white text-[13px]">Log out</button>
            </form>
          ) : (
            <Link href="/admin/login" className="h-10 px-5 rounded-full bg-obsidian text-white text-[13px] flex items-center">Log in</Link>
          )}
          <Link href="/admin/integrations" className="h-10 px-5 rounded-full bg-lime text-obsidian text-[13px] font-semibold flex items-center">Integrations →</Link>
        </div>
      </div>

      {!isAuthenticated && adminConfigured && (
        <div className="mt-8 bg-white rounded-[20px] border p-12 text-center">
          <h3 className="font-display text-[22px]">Authentication required</h3>
          <p className="mt-2 text-[14px] text-obsidian/60">Admin env is configured. Please log in to view dashboard. Session is httpOnly, signed.</p>
          <Link href="/admin/login" className="mt-6 inline-flex h-11 px-6 rounded-full bg-obsidian text-white items-center">Go to login</Link>
        </div>
      )}

      {(isAuthenticated || !adminConfigured) && (
        <>
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-[20px] border p-6">
              <div className="text-[11px] tracking-widest uppercase opacity-50">Catalog</div>
              <div className="mt-2 font-display text-[28px] font-bold">{products.length}</div>
              <div className="text-[12px] text-obsidian/60 mt-1">Seeded products across 8 categories</div>
              <div className="mt-4 h-px bg-stone-100" />
              <div className="mt-3 text-[11px]">Demo data – no DB writes</div>
            </div>
            <div className="bg-white rounded-[20px] border p-6">
              <div className="text-[11px] tracking-widest uppercase opacity-50">Orders (demo)</div>
              <div className="mt-2 font-display text-[28px] font-bold">0</div>
              <div className="text-[12px] text-obsidian/60 mt-1">Real orders appear after Stripe live + DB integration</div>
              <div className="mt-4 h-px bg-stone-100" />
              <div className="mt-3 text-[11px]">Checkout remains demo-only – cannot charge</div>
            </div>
            <div className="bg-white rounded-[20px] border p-6">
              <div className="text-[11px] tracking-widest uppercase opacity-50">Newsletter signups (demo)</div>
              <div className="mt-2 font-display text-[28px] font-bold">—</div>
              <div className="text-[12px] text-obsidian/60 mt-1">Demo alert only – no email delivery. Integration point: Resend/SendGrid API route.</div>
              <div className="mt-4 h-px bg-stone-100" />
              <div className="mt-3 text-[11px]">See README Email later</div>
            </div>
            <div className="bg-white rounded-[20px] border p-6">
              <div className="text-[11px] tracking-widest uppercase opacity-50">Integrations</div>
              <div className="mt-2 font-display text-[28px] font-bold">{integrationCount}/5</div>
              <div className="text-[12px] text-obsidian/60 mt-1">Configured based on env presence, not secret values</div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${gaConfigured ? 'bg-lime' : 'bg-stone-100'}`}>GA {gaConfigured ? '✓' : '✗'}</span>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${adSenseConfigured ? 'bg-lime' : 'bg-stone-100'}`}>AdSense {adSenseConfigured ? '✓' : '✗'}</span>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${searchConfigured ? 'bg-lime' : 'bg-stone-100'}`}>Search {searchConfigured ? '✓' : '✗'}</span>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${stripeConfigured ? 'bg-lime' : 'bg-stone-100'}`}>Payments {stripeConfigured ? '✓' : '✗'}</span>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${hermesConfigured ? 'bg-lime' : 'bg-stone-100'}`}>Hermes {hermesConfigured ? '✓' : '✗'}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-[20px] border p-6">
              <h3 className="font-semibold">Configuration-required states</h3>
              <p className="mt-2 text-[13px] text-obsidian/60">All integrations are inactive until configured/deployed. No secret values are displayed in browser UI. Status is derived from whether env vars exist, not their content.</p>
              <div className="mt-6 space-y-3">
                {[
                  { name: 'Google Analytics', ok: gaConfigured, desc: 'Requires NEXT_PUBLIC_GA_MEASUREMENT_ID + analytics consent' },
                  { name: 'AdSense', ok: adSenseConfigured, desc: 'Requires NEXT_PUBLIC_ADSENSE_CLIENT_ID + slot ID + advertising consent' },
                  { name: 'Search Console', ok: searchConfigured, desc: 'Requires GOOGLE_SITE_VERIFICATION meta token' },
                  { name: 'Payments', ok: stripeConfigured, desc: `Provider: ${serverEnv.PAYMENT_PROVIDER} – Stripe requires STRIPE_SECRET_KEY + publishable key` },
                  { name: 'Hermes Connector', ok: hermesConfigured, desc: 'Generic custom API – requires HERMES_ENABLED=true + HERMES_BASE_URL + HERMES_API_KEY' },
                ].map(item => (
                  <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border">
                    <div>
                      <div className="font-medium text-[13px]">{item.name}</div>
                      <div className="text-[11px] text-obsidian/60">{item.desc}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${item.ok ? 'bg-lime text-obsidian' : 'bg-stone-200 text-obsidian/60'}`}>{item.ok ? 'Configured' : 'Not configured'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-obsidian text-white rounded-[20px] p-6">
              <h3 className="font-display text-[18px]">Production hardening notes</h3>
              <ul className="mt-4 space-y-3 text-[12px] leading-relaxed text-white/70 list-disc pl-5">
                <li>Admin: set ADMIN_EMAIL, ADMIN_PASSWORD_HASH (pbkdf2$iterations$salt$dk – WebCrypto PBKDF2, 600k iterations, 16-byte salt, 64-byte dk; works on Edge + Node), ADMIN_SESSION_SECRET (64+ random). Never hardcode. Use httpOnly HMAC-signed cookie, 8h expiry. This mock allows dev access when env missing, but production must enforce login.</li>
                <li>Payments: checkout remains demo-only, cannot charge. To go live, set PAYMENT_PROVIDER=stripe, add STRIPE_SECRET_KEY server-only, publishable key client, implement StripePaymentProvider, webhook at /api/webhooks/stripe.</li>
                <li>Google: GA loads only after explicit analytics consent, AdSense only after advertising consent + client+slot configured. No ad request without consent.</li>
                <li>Hermes: generic connector – treat as custom API. Enable with HERMES_ENABLED, base URL, API key server-only. No assumptions about service.</li>
                <li>Env: all secrets server-only, never NEXT_PUBLIC_ for secrets. Use Vercel/Cloudflare Pages dashboard env UI.</li>
              </ul>
              <div className="mt-6 p-3 rounded-xl bg-white/10 border border-white/10 text-[11px]">
                <div className="font-semibold">Safe empty/loading/error states</div>
                <div className="opacity-70 mt-1">Dashboard shows 0 orders, — newsletter, masked integration status. No secret leakage. Errors return 503 with message to configure env, not stack traces.</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
