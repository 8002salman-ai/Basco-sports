import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Cookies" };

const UPDATED = "August 27, 2026";

export default function CookiesPage() {
  return (
    <main className="max-w-[860px] mx-auto px-6 py-16">
      <p className="text-xs uppercase tracking-widest opacity-60">Cookie notice</p>
      <h1 className="mt-3 text-4xl font-display">Cookies & storage</h1>
      <p className="mt-2 text-sm opacity-60">Effective {UPDATED} • Last updated {UPDATED}</p>

      <section className="mt-10 space-y-4 text-[15px] leading-relaxed">
        <p>This notice lists the cookies and similar technologies this store actually uses. You can change your choices at any time via the cookie preferences link in the footer (where your consent choice is stored) — withdrawal is as easy as giving consent.</p>

        <h2 className="font-semibold text-lg pt-2">Strictly necessary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead><tr className="text-left border-b border-stone-200"><th className="py-2 pr-4">Name / storage key</th><th className="py-2 pr-4">Provider</th><th className="py-2 pr-4">Purpose</th><th className="py-2 pr-4">Duration</th><th className="py-2">Type</th></tr></thead>
            <tbody>
              <tr className="border-b border-stone-100"><td className="py-2 pr-4">basco-cart-v1, basco-wishlist-v1, basco-coupon-v1</td><td className="py-2 pr-4">Basco Sports (first party)</td><td className="py-2 pr-4">Cart, wishlist and coupon contents (localStorage)</td><td className="py-2 pr-4">Until you clear them</td><td className="py-2">Local storage</td></tr>
              <tr className="border-b border-stone-100"><td className="py-2 pr-4">basco-country-v1, basco-currency-v1, basco-language-v1</td><td className="py-2 pr-4">Basco Sports (first party)</td><td className="py-2 pr-4">Remembers your shipping country, currency and language</td><td className="py-2 pr-4">Until you clear them</td><td className="py-2">Local storage</td></tr>
              <tr className="border-b border-stone-100"><td className="py-2 pr-4">basco-consent-v1 (and preferences)</td><td className="py-2 pr-4">Basco Sports (first party)</td><td className="py-2 pr-4">Stores your cookie consent choice</td><td className="py-2 pr-4">Until you change it</td><td className="py-2">Local storage</td></tr>
              <tr className="border-b border-stone-100"><td className="py-2 pr-4">basco_admin_session</td><td className="py-2 pr-4">Basco Sports (first party)</td><td className="py-2 pr-4">Admin panel sign-in (HttpOnly, secure)</td><td className="py-2 pr-4">Session</td><td className="py-2">Cookie</td></tr>
              <tr><td className="py-2 pr-4">basco-market-suggestion-dismissed-v1</td><td className="py-2 pr-4">Basco Sports (first party)</td><td className="py-2 pr-4">Remembers that you dismissed the country suggestion</td><td className="py-2 pr-4">Until cleared</td><td className="py-2">Local storage</td></tr>
            </tbody>
          </table>
        </div>

        <h2 className="font-semibold text-lg pt-4">Analytics and advertising (require your consent)</h2>
        <p>Google Analytics and Google AdSense load <strong>only</strong> if they are configured by us AND you enable the corresponding consent category in the banner. Without your consent, no analytics or advertising requests are made. Country and currency suggestion uses only your device timezone setting on your own device — it is not sent anywhere and no tracking is activated for it.</p>

        <h2 className="font-semibold text-lg pt-4">Managing consent</h2>
        <p>Use the banner’s “Reject non-essential” or “Manage preferences” options, or reopen preferences any time from the footer. See also our <Link className="underline" href="/privacy">Privacy Policy</Link>.</p>
      </section>
    </main>
  );
}
