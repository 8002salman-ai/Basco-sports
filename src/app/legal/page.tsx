import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Legal Centre" };

const UPDATED = "August 27, 2026";

const links: Array<[string, string, string]> = [
  ["/privacy", "Privacy Policy", "What we collect, why, and your rights"],
  ["/cookies", "Cookies & Storage", "Every cookie and storage key we use"],
  ["/terms", "Terms of Sale", "The rules for buying from Basco Sports"],
  ["/shipping", "Shipping Policy", "Destinations, estimates, duties and customs"],
  ["/returns", "Returns & Refunds", "Voluntary returns, statutory withdrawal, defects"],
  ["/warranty", "Warranty", "Statutory guarantees and any commercial warranty"],
  ["/product-safety", "Product Safety", "Safety concerns, recalls and compliance information"],
  ["/accessibility", "Accessibility", "Our accessibility target and how to report barriers"],
  ["/contact", "Contact", "How to reach support"],
];

export default function LegalPage() {
  return (
    <main className="max-w-[860px] mx-auto px-6 py-16">
      <p className="text-xs uppercase tracking-widest opacity-60">Legal</p>
      <h1 className="mt-3 text-4xl font-display">Legal centre</h1>
      <p className="mt-2 text-sm opacity-60">Last updated {UPDATED}</p>

      <p className="mt-8 text-[15px] leading-relaxed">Basco Sports sells internationally. Regional consumer laws differ, so our policies include market-specific sections (United States, European Union, United Kingdom, Norway, Canada, other markets) where the differences matter. Basco Sports is the seller of record; our verified legal business identity details are published here as they are confirmed, and while verification is in progress we say so instead of showing placeholder data.</p>

      <ul className="mt-8 divide-y divide-stone-200 border-y border-stone-200">
        {links.map(([href, title, desc]) => (
          <li key={href}>
            <Link href={href} className="flex items-baseline justify-between gap-4 py-4 hover:bg-stone-50 px-2">
              <span className="font-medium">{title}</span>
              <span className="text-[13px] text-obsidian/50 text-right">{desc}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
