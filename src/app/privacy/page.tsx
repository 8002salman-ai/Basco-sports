import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy Policy" };

const UPDATED = "August 27, 2026";

export default function PrivacyPage() {
  return (
    <main className="max-w-[860px] mx-auto px-6 py-16">
      <p className="text-xs uppercase tracking-widest opacity-60">Privacy policy</p>
      <h1 className="mt-3 text-4xl font-display">Privacy policy</h1>
      <p className="mt-2 text-sm opacity-60">Effective {UPDATED} • Last updated {UPDATED}</p>

      <section className="mt-10 space-y-4 text-[15px] leading-relaxed">
        <h2 className="font-semibold text-lg">1. Who we are</h2>
        <p>Basco Sports is the data controller for this store. Our verified legal business identity and privacy contact are published on the <Link className="underline" href="/legal">legal centre</Link>; while verification is in progress we say so here rather than displaying placeholder details. We do not have a Data Protection Officer because none is currently required for our operations; if that changes, this policy will say so.</p>

        <h2 className="font-semibold text-lg pt-2">2. What we collect (actual current processing)</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Cart, wishlist and coupon contents</strong> — stored on your device (browser local storage) so your basket persists. Not sent to us until you use checkout.</li>
          <li><strong>Delivery country, currency and language choices</strong> — stored on your device; the country suggestion uses only your device’s timezone setting on your device and is never transmitted.</li>
          <li><strong>Checkout information</strong> — when you use checkout (currently demo), the contact and order details you enter, plus the order record, are stored to process and reference the order.</li>
          <li><strong>Payment data</strong> — we never receive or store card numbers. When live payments begin, card data is handled by our payment processor on their secure pages/integration.</li>
          <li><strong>Analytics and advertising</strong> — Google Analytics and Google AdSense load only if configured by us AND you consent via the cookie banner. Without consent, no analytics or ad requests are made.</li>
          <li><strong>Security logs</strong> — server logs needed to operate and secure the service.</li>
        </ul>

        <h2 className="font-semibold text-lg pt-2">3. Why we process data (lawful bases)</h2>
        <p>Where EU/UK GDPR applies: performing our contract with you (orders, delivery, returns); compliance with legal obligations (tax, customs and consumer-law records); legitimate interests in operating a secure store (security logs, fraud prevention, service improvement); and your consent where required (analytics, advertising, marketing email). We do not use consent as the basis for everything.</p>

        <h2 className="font-semibold text-lg pt-2">4. Service providers</h2>
        <p>We use: hosting (Vercel and/or Cloudflare), database (Supabase, when configured), payment processing (Stripe, once live payments are enabled — demo mode today), email delivery for order confirmations (our configured email provider), and analytics/advertising (Google) strictly behind consent. These providers process data on our behalf or as independent controllers per their terms, and may process data outside your country under appropriate safeguards such as adequacy decisions or Standard Contractual Clauses.</p>

        <h2 className="font-semibold text-lg pt-2">5. International transfers</h2>
        <p>Because we operate internationally, your data may be processed in countries other than yours. Where data leaves the EEA/UK we rely on adequacy decisions or Standard Contractual Clauses with our processors.</p>

        <h2 className="font-semibold text-lg pt-2">6. Retention</h2>
        <p>Purpose-based retention: order and transaction records — as long as required by tax, accounting and consumer law for the seller entity (period confirmed with our advisors before live commerce); cart/wishlist local storage — until you clear it; consent records — until withdrawn plus a suppression record; support communications — as long as needed to resolve your query and meet legal requirements; security logs — shortest period that is justified for security purposes. We do not claim fixed periods we cannot yet legally determine.</p>

        <h2 className="font-semibold text-lg pt-2">7. Your rights</h2>
        <p>Depending on your location you may have rights to access, correct, delete, restrict or object to processing, data portability, and to withdraw consent at any time (consent withdrawal is as easy as giving it — see the footer cookie preferences). EU/UK residents may complain to their supervisory authority (for example the ICO in the UK). US state-law rights (such as CCPA/CPRA where applicable) depend on our size and practices; we will document applicability as our operations grow and will honour applicable requests. To exercise any right, use the <Link className="underline" href="/contact">contact page</Link>.</p>

        <h2 className="font-semibold text-lg pt-2">8. Marketing email</h2>
        <p>Marketing email (like the Basco Club newsletter) is sent only with valid consent where required, with unsubscribe in every message. Order, safety and recall emails are transactional and continue regardless of marketing choices.</p>

        <h2 className="font-semibold text-lg pt-2">9. Children</h2>
        <p>This store is not directed at children under 13 (or under 16 where local law requires a higher age for consent), and we do not knowingly collect their data.</p>

        <h2 className="font-semibold text-lg pt-2">10. Changes</h2>
        <p>We update this policy as our processing changes; the effective and last-updated dates above always reflect the current version.</p>
      </section>
    </main>
  );
}
