import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Product Safety" };

const UPDATED = "August 27, 2026";

export default function ProductSafetyPage() {
  return (
    <main className="max-w-[860px] mx-auto px-6 py-16">
      <p className="text-xs uppercase tracking-widest opacity-60">Product safety</p>
      <h1 className="mt-3 text-4xl font-display">Product safety</h1>
      <p className="mt-2 text-sm opacity-60">Effective {UPDATED} • Last updated {UPDATED}</p>

      <section className="mt-10 space-y-4 text-[15px] leading-relaxed">
        <h2 className="font-semibold text-lg">Report a safety concern</h2>
        <p>If you believe a product you bought from Basco Sports is unsafe or defective in a way that could cause harm, stop using it and contact support through the <Link className="underline" href="/contact">contact page</Link> with your order number, photos and a description. We treat safety reports as priority messages.</p>

        <h2 className="font-semibold text-lg pt-2">Recalls</h2>
        <p>If a recall is ever required, we will: (1) stop selling the affected product, (2) contact known purchasers by email with clear instructions, (3) publish a recall notice on this page with the affected model/lot details, and (4) offer the remedy required by law, such as repair, replacement or refund. No products are currently subject to a recall.</p>

        <h2 className="font-semibold text-lg pt-2">Product information for your market</h2>
        <p>For products offered to customers in the European Union, we display the manufacturer’s (or, where required, the EU Responsible Person’s) name, postal and electronic contact details, product identification, and applicable warnings and safety information on the product page. Where that information is not yet verified for a product, the product is not offered for sale in the EU rather than being shown with placeholder data.</p>

        <h2 className="font-semibold text-lg pt-2">Protective equipment</h2>
        <p>Items intended to protect users (for example helmets, shin guards and pads) must meet applicable safety standards before we may present conformity marks. We do not display CE, UKCA or certification marks without documented, currently valid evidence.</p>
      </section>
    </main>
  );
}
