"use client";
import { useConsent } from "@/components/consent/ConsentContext";
import Link from "next/link";

export default function PrivacyPage() {
  const { consent, setOpenPreferences } = useConsent();

  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <h1 className="font-display text-[40px] leading-[0.9]">Privacy Policy</h1>
      <p className="mt-4 text-[13px] opacity-60">Last updated: Jan 2025 • Demo store – privacy-respecting integrations, consent-first.</p>

      <div className="mt-6 flex gap-3">
        <button onClick={() => setOpenPreferences(true)} className="h-10 px-5 rounded-full bg-obsidian text-white text-[13px]">Manage cookie preferences</button>
        <Link href="/terms" className="h-10 px-5 rounded-full border bg-white text-[13px] flex items-center">Terms</Link>
      </div>

      <div className="mt-10 space-y-6 text-[14px] leading-relaxed text-obsidian/70">
        <section className="bg-white rounded-[20px] border p-8">
          <h2 className="font-semibold text-obsidian">Cookie preferences – Necessary / Analytics / Advertising</h2>
          <p className="mt-3">We use a consent layer with three categories:</p>
          <ul className="mt-3 list-disc pl-5 space-y-2">
            <li><strong>Necessary (always on):</strong> cart (<code>basco-cart-v1</code>), wishlist (<code>basco-wishlist-v1</code>), coupon, consent (<code>basco-consent-v1</code>), admin session (httpOnly). No opt-out – required for store function.</li>
            <li><strong>Analytics (opt-in):</strong> Google Analytics 4 – loads only if <code>NEXT_PUBLIC_GA_MEASUREMENT_ID</code> is configured in deployment env AND you explicitly enable Analytics in preferences. No tracking without consent. See analytics component <code>src/components/analytics/GoogleAnalytics.tsx</code>.</li>
            <li><strong>Advertising (opt-in):</strong> Google AdSense – AdSlot component does NOT load/render real ad unless client ID <code>NEXT_PUBLIC_ADSENSE_CLIENT_ID</code> AND slot ID configured AND you enable Advertising consent. Otherwise no ad request is made; safe placeholder only in development. See <code>src/components/ads/AdSlot.tsx</code>.</li>
          </ul>
          <div className="mt-4 p-3 rounded-xl bg-stone-50 border text-[12px]">
            Current consent: Necessary={String(consent.necessary)} • Analytics={String(consent.analytics)} • Advertising={String(consent.advertising)} • HasConsented={String(consent.hasConsented)} • Updated={consent.updatedAt || 'never'}
          </div>
          <p className="mt-4 text-[12px]">You can change choices anytime via the banner or this button. Consent is persisted locally, not on server.</p>
        </section>

        <section className="bg-white rounded-[20px] border p-8">
          <h2 className="font-semibold text-obsidian">Google integrations – privacy respecting</h2>
          <ul className="mt-3 list-disc pl-5 space-y-2">
            <li><strong>Google Analytics:</strong> Loads gtag.js only after consent. Requires <code>NEXT_PUBLIC_GA_MEASUREMENT_ID</code> (format G-XXXXXXXXXX) set in Vercel/Cloudflare Pages env. No data sent without consent. IP anonymization enabled. See README for verification and consent requirements.</li>
            <li><strong>Google AdSense:</strong> AdSlot requires <code>NEXT_PUBLIC_ADSENSE_CLIENT_ID</code> (ca-pub-...) + slot ID + advertising consent. Real ad script <code>pagead2.googlesyndication.com</code> only injected after consent. In production without config, component renders nothing to avoid policy violation. In development, shows dashed placeholder explaining missing config. Requires approved AdSense account and domain approval (ads.txt). See README AdSense policy/approval prerequisites.</li>
            <li><strong>Search Console verification:</strong> Driven by server env <code>GOOGLE_SITE_VERIFICATION</code> (meta content token only). Implemented via <code>generateMetadata()</code> in <code>src/app/layout.tsx</code> – adds <code>google-site-verification</code> meta tag only if configured. No Google API call from app.</li>
          </ul>
        </section>

        <section className="bg-white rounded-[20px] border p-8">
          <h2 className="font-semibold text-obsidian">What we collect (demo)</h2>
          <p className="mt-3">Currently Basco Sports runs mostly client-side with localStorage for cart/wishlist/consent. Newsletter form shows alert only, no email delivery. Contact form does not send email – integration point documented in README. No personal data sent to server except admin login (server-side, httpOnly cookie) when admin env configured.</p>
        </section>

        <section className="bg-white rounded-[20px] border p-8">
          <h2 className="font-semibold text-obsidian">Hermes Connector – Generic Custom API</h2>
          <p className="mt-3">Future integration for custom backend / fulfillment / ERP. Configurable via env:</p>
          <ul className="mt-3 list-disc pl-5 space-y-2">
            <li><code>HERMES_ENABLED</code>=true/false – feature flag</li>
            <li><code>HERMES_BASE_URL</code> – base URL of your Hermes API (e.g., https://api.hermes.example.com)</li>
            <li><code>HERMES_API_KEY</code> – server-only secret, never exposed to client, stored in deployment env</li>
          </ul>
          <p className="mt-3 text-[12px]">Implementation point: <code>src/lib/hermes-client.ts</code> (to be created when service defined). No external API call in demo. Never log key, never expose in UI.</p>
        </section>

        <section className="bg-white rounded-[20px] border p-8">
          <h2 className="font-semibold text-obsidian">Future live implementation</h2>
          <ul className="mt-3 list-disc pl-5 space-y-2">
            <li>When live, we will collect email, shipping address and payment metadata via Stripe – never raw card numbers. Payments remain demo-only until Stripe env configured.</li>
            <li>Data stored in GDPR-compliant DB (e.g., Supabase EU). Retention 2 years.</li>
            <li>Rights: access, deletion, portability – contact privacy@bascosports.demo (demo address).</li>
            <li>Admin: requires env-provided ADMIN_EMAIL + salted ADMIN_PASSWORD_HASH (bcrypt) + ADMIN_SESSION_SECRET, httpOnly signed cookie, 8h expiry. See README Admin Hardening.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
