export default function TermsPage() {
  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <h1 className="font-display text-[40px] leading-[0.9]">Terms of Service</h1>
      <p className="mt-4 text-[13px] opacity-60">Demo terms – not legal advice. Replace with counsel-reviewed version before going live.</p>
      <div className="mt-10 space-y-6 text-[14px] leading-relaxed text-obsidian/70">
        <section className="bg-white rounded-[20px] border p-8">
          <h2 className="font-semibold text-obsidian">Demo nature</h2>
          <p className="mt-3">This site is a demonstration ecommerce build. No real transactions occur. Prices, inventory and coupons are mock data. No contract is formed by using demo checkout. Checkout remains demo-only and cannot charge a user – payment adapter is in demo mode until Stripe env configured.</p>
        </section>
        <section className="bg-white rounded-[20px] border p-8">
          <h2 className="font-semibold text-obsidian">Use of site</h2>
          <p className="mt-3">You may browse and test cart/wishlist functionality, cookie consent preferences (Necessary/Analytics/Advertising), and admin mock (when env not configured). Do not attempt to inject real payment data – demo fields are not PCI-compliant. When live, payments will be handled by Stripe (PCI DSS Level 1) via server env STRIPE_SECRET_KEY.</p>
        </section>
        <section className="bg-white rounded-[20px] border p-8">
          <h2 className="font-semibold text-obsidian">Google services</h2>
          <ul className="mt-3 list-disc pl-5 space-y-2">
            <li>Google Analytics loads only after explicit analytics consent and only if NEXT_PUBLIC_GA_MEASUREMENT_ID configured.</li>
            <li>Google AdSense AdSlot renders real ad only if client ID + slot ID configured AND advertising consent given. Otherwise no ad request. Requires AdSense account approval and ads.txt.</li>
            <li>Search Console verification via GOOGLE_SITE_VERIFICATION meta tag, server env only.</li>
          </ul>
        </section>
        <section className="bg-white rounded-[20px] border p-8">
          <h2 className="font-semibold text-obsidian">Admin area</h2>
          <p className="mt-3">/admin is development-only settings mock when ADMIN_EMAIL, ADMIN_PASSWORD_HASH, ADMIN_SESSION_SECRET not configured. In production, admin requires env-provided credentials with salted hash (bcrypt) and secure session secret, httpOnly signed cookie. Never use email as password, never hardcode secrets. See README Admin Hardening and src/lib/admin-auth.ts.</p>
        </section>
        <section className="bg-white rounded-[20px] border p-8">
          <h2 className="font-semibold text-obsidian">Hermes Connector</h2>
          <p className="mt-3">Generic custom API integration – configurable via HERMES_ENABLED, HERMES_BASE_URL, HERMES_API_KEY (server-only). No assumptions about Hermes service. Inactive until configured. Implementation point: src/lib/hermes-client.ts.</p>
        </section>
        <section className="bg-white rounded-[20px] border p-8">
          <h2 className="font-semibold text-obsidian">Intellectual property</h2>
          <p className="mt-3">Basco Sports wordmark and icon are fully original for this demo. Product images from Unsplash – licensed for demo use. Do not reuse without checking license. All branding, copy, and design are original to Basco Sports.</p>
        </section>
      </div>
    </div>
  );
}
