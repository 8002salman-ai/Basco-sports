import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Sale" };

const UPDATED = "August 27, 2026";

export default function TermsPage() {
  return (
    <main className="max-w-[860px] mx-auto px-6 py-16">
      <p className="text-xs uppercase tracking-widest opacity-60">Terms of sale</p>
      <h1 className="mt-3 text-4xl font-display">Terms of sale</h1>
      <p className="mt-2 text-sm opacity-60">Effective {UPDATED} • Last updated {UPDATED}</p>

      <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-[13px] leading-relaxed">
        <strong>Payments are currently in demo mode.</strong> No contract for sale is formed and no payment is taken through checkout while the store is in demo mode. These terms describe how sales will work once live commerce is enabled for your market.
      </div>

      <section className="mt-10 space-y-4 text-[15px] leading-relaxed">
        <h2 className="font-semibold text-lg">1. Who you are buying from</h2>
        <p>Orders are placed with Basco Sports as seller of record. Our verified legal business name, registered address, company/trade register details (where applicable), VAT/tax identifiers (where applicable) and support contacts are published on the <Link className="underline" href="/legal">legal centre</Link>. Where a detail is still being verified, the legal centre states that instead of showing placeholder information.</p>

        <h2 className="font-semibold text-lg pt-2">2. Ordering</h2>
        <p>When you place an order, you make an offer to buy the items in your cart under these terms. We accept when we confirm dispatch. Before you pay, checkout shows the exact items, quantities, prices, discounts, shipping cost, the taxes and duties treatment for your delivery country, the delivery estimate for your chosen service, our identity and links to these terms, our privacy policy and our returns policy. The payment button states “Pay now” with the final total. We do not add mandatory charges after you commit to pay.</p>

        <h2 className="font-semibold text-lg pt-2">3. Prices, currencies and taxes</h2>
        <p>Prices are set in US dollars as the master currency. Where you choose another display currency, converted amounts are estimates produced using our configured exchange rates and rounded for readability; the confirmed chargeable amount is shown at checkout before payment. Depending on your market, applicable VAT/GST and duties are either included in the order total (where our registrations permit collection) or payable on import — checkout states which applies to you before you order.</p>

        <h2 className="font-semibold text-lg pt-2">4. Delivery</h2>
        <p>Delivery estimates are estimates, not guarantees. Risk of loss passes in accordance with the carrier terms applicable to your shipment. See the <Link className="underline" href="/shipping">Shipping Policy</Link> for destinations, services, customs handling and what happens if delivery fails.</p>

        <h2 className="font-semibold text-lg pt-2">5. Cancellation, returns and refunds</h2>
        <p>Our <Link className="underline" href="/returns">Returns & Refunds policy</Link> applies, including voluntary returns, statutory withdrawal rights for eligible markets, and remedies for defective, damaged or incorrect items. Nothing in these terms limits statutory consumer rights that cannot be excluded.</p>

        <h2 className="font-semibold text-lg pt-2">6. Statutory rights</h2>
        <p>These terms are subject to mandatory consumer protection laws in your market, including statutory guarantee/conformity rights in the EU and UK and applicable US federal and state law. If any provision conflicts with a non-excludable statutory right, the statutory right prevails.</p>

        <h2 className="font-semibold text-lg pt-2">7. Product information</h2>
        <p>We describe products accurately and display safety and compliance information required for your market before purchase. Product photography shows the item offered; where a product’s imagery or compliance evidence is not yet verified, the product is not offered for sale in the affected market.</p>

        <h2 className="font-semibold text-lg pt-2">8. Liability</h2>
        <p>To the extent permitted by law, our liability for any order is limited to the amount you paid for that order, except that nothing limits liability for death or personal injury caused by negligence, fraud, or any liability that cannot lawfully be limited.</p>

        <h2 className="font-semibold text-lg pt-2">9. Governing law</h2>
        <p>Where mandatory local law does not require otherwise, these terms are governed by the law of the seller’s place of establishment, without depriving consumers of protections that cannot be excluded under the law of their usual residence.</p>

        <h2 className="font-semibold text-lg pt-2">10. Contact</h2>
        <p>Questions about these terms: use the <Link className="underline" href="/contact">contact page</Link>.</p>
      </section>
    </main>
  );
}
