import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Accessibility" };

const UPDATED = "August 27, 2026";

export default function AccessibilityPage() {
  return (
    <main className="max-w-[860px] mx-auto px-6 py-16">
      <p className="text-xs uppercase tracking-widest opacity-60">Accessibility</p>
      <h1 className="mt-3 text-4xl font-display">Accessibility statement</h1>
      <p className="mt-2 text-sm opacity-60">Effective {UPDATED} • Last updated {UPDATED}</p>

      <section className="mt-10 space-y-4 text-[15px] leading-relaxed">
        <p>Basco Sports wants every shopper to be able to use this store. We target <strong>WCAG 2.2 level AA</strong> where reasonably possible and build accessibility into components rather than relying on overlays.</p>

        <h2 className="font-semibold text-lg pt-2">What we do</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Semantic HTML, landmark regions and skip navigation where present</li>
          <li>Keyboard-operable menus, cart drawer, market selector and cookie banner with visible focus</li>
          <li>Labelled form fields and announced form errors</li>
          <li>Descriptive alt text for meaningful product imagery</li>
          <li>Contrast-checked colour system and support for browser zoom and reflow</li>
        </ul>

        <h2 className="font-semibold text-lg pt-2">Known limitations</h2>
        <p>We are continuing work on: full screen-reader testing of the country/currency selector and cart flows, focus trapping in all modals, and reduced-motion variants for animated elements. This statement will be updated as issues are fixed.</p>

        <h2 className="font-semibold text-lg pt-2">Tell us about a barrier</h2>
        <p>If you encounter an accessibility barrier, contact us via the <Link className="underline" href="/contact">contact page</Link> and describe the page and the problem. We use these reports to prioritise fixes.</p>
      </section>
    </main>
  );
}
