import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Warranty" };

const UPDATED = "August 27, 2026";

export default function WarrantyPage() {
  return (
    <main className="max-w-[860px] mx-auto px-6 py-16">
      <p className="text-xs uppercase tracking-widest opacity-60">Warranty</p>
      <h1 className="mt-3 text-4xl font-display">Warranty & your statutory rights</h1>
      <p className="mt-2 text-sm opacity-60">Effective {UPDATED} • Last updated {UPDATED}</p>

      <section className="mt-10 space-y-4 text-[15px] leading-relaxed">
        <h2 className="font-semibold text-lg">Statutory legal guarantee first</h2>
        <p>Nothing on this page limits your statutory rights. In the EU and UK, goods must conform to the contract and be of satisfactory quality — statutory legal guarantee rights apply automatically and cannot be waived by us. Those rights exist regardless of anything below.</p>

        <h2 className="font-semibold text-lg pt-2">Basco commercial warranty</h2>
        <p><strong>Status: under review.</strong> Product pages previously mentioned a 2-year warranty. That claim has been withdrawn until Basco Sports publishes a complete, enforceable warranty program with a named warrantor, duration, coverage, exclusions, claim process, shipping responsibility and geographic scope that we can actually operate. Where a commercial warranty becomes available, its full pre-sale terms will appear here and on the relevant product pages, clearly designated as a voluntary commercial warranty that is additional to — and never a replacement for — your statutory rights.</p>

        <h2 className="font-semibold text-lg pt-2">Defective or non-conforming items</h2>
        <p>Defective, damaged or wrong items are handled under the <Link className="underline" href="/returns">Returns & Refunds</Link> policy, section 3, and your applicable statutory rights. You do not need a commercial warranty to be remedied for a defective item.</p>
      </section>
    </main>
  );
}
