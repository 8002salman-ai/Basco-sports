import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Returns & Refunds" };

const UPDATED = "August 27, 2026";

export default function ReturnsPage() {
  return (
    <main className="max-w-[860px] mx-auto px-6 py-16">
      <p className="text-xs uppercase tracking-widest opacity-60">Returns & refunds</p>
      <h1 className="mt-3 text-4xl font-display">Returns & refunds</h1>
      <p className="mt-2 text-sm opacity-60">Effective {UPDATED} • Last updated {UPDATED}</p>

      <section className="mt-10 space-y-4 text-[15px] leading-relaxed">
        <p>This policy has four separate parts. Your statutory rights always override anything here where local law gives you stronger protection.</p>

        <h2 className="font-semibold text-lg pt-2">1. Voluntary 30-day change-of-mind returns</h2>
        <p>Where we have opened checkout in your market, you may request a return of unworn, unwashed items in original packaging with tags attached within <strong>30 days of delivery</strong>. Start a return by contacting support with your order number. We issue a return authorisation and the correct return destination for your order — please do not send items back without one. Return shipping for change-of-mind returns is at your cost unless we state otherwise for your market. Refunds are issued to the original payment method after the return is received and checked.</p>

        <h2 className="font-semibold text-lg pt-2">2. Statutory cancellation / withdrawal rights (EU, UK and similar markets)</h2>
        <p>If you live in the EU or UK (or another market with a statutory distance-selling withdrawal right), you have the right to withdraw from your order within <strong>14 days of receiving the goods</strong>, without giving a reason. This statutory right is separate from and in addition to our voluntary 30-day policy, and nothing in our voluntary conditions limits it.</p>
        <p>To exercise withdrawal, contact support with your order number and the items concerned, or use the model wording: “I hereby withdraw from the contract for order [order number].” We confirm receipt of your withdrawal and refund the payments we received, including standard delivery costs, without undue delay and in accordance with applicable law, once the goods are returned or you supply evidence of return shipment. You are responsible for any diminished value resulting from handling beyond what is necessary to establish the nature, characteristics and functioning of the goods. Statutory exceptions (for example sealed items unsealed after delivery for health-protection reasons) apply where valid.</p>

        <h2 className="font-semibold text-lg pt-2">3. Defective, damaged or wrong items</h2>
        <p>If an item arrives damaged, is defective, or is not what you ordered, contact us with photos and your order number. You are entitled to a remedy under applicable consumer law — this is not treated as a change-of-mind return, and we will not require you to pay return shipping for our error or a defect. Nothing in this policy excludes statutory rights regarding non-conforming goods. This section does not remove your rights to a repair, replacement, price reduction or refund where the law provides them.</p>

        <h2 className="font-semibold text-lg pt-2">4. Warranty claims</h2>
        <p>Any commercial warranty Basco offers is described on the <Link className="underline" href="/warranty">Warranty page</Link> and applies in addition to statutory guarantee rights. See also <Link className="underline" href="/product-safety">Product Safety</Link>.</p>

        <h2 className="font-semibold text-lg pt-2">Refund timing</h2>
        <p>Once your return is received and checked, refunds are processed to the original payment method. Bank processing times vary by provider and country. We never refund to a different method or person than the original payment.</p>
      </section>
    </main>
  );
}
