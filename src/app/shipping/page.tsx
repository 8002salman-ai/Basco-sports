import Link from "next/link";
import type { Metadata } from "next";
import { shippingMethods } from "@/lib/shipping";
import { supportedCountries } from "@/config/markets";

export const metadata: Metadata = { title: "Shipping" };

const UPDATED = "August 27, 2026";

export default function ShippingPage() {
  return (
    <main className="max-w-[860px] mx-auto px-6 py-16">
      <p className="text-xs uppercase tracking-widest opacity-60">Shipping policy</p>
      <h1 className="mt-3 text-4xl font-display">International shipping</h1>
      <p className="mt-2 text-sm opacity-60">Effective {UPDATED} • Last updated {UPDATED}</p>

      <section className="mt-10 space-y-4 text-[15px] leading-relaxed">
        <h2 className="font-semibold text-lg">Where we deliver</h2>
        <p>Basco Sports ships internationally. The countries currently shown in our delivery selector are: {supportedCountries.map((m) => m.countryName).join(", ")}. Countries appear in the selector as we prepare them; checkout opens per market only after local delivery, tax and customs arrangements are complete. If your country is not listed, we do not deliver there yet.</p>

        <h2 className="font-semibold text-lg pt-4">How your order travels</h2>
        <p>Orders are fulfilled by Basco Sports with tracked international delivery. Because our fulfilment network is international, we use neutral wording such as “Tracked International Delivery” rather than advertising warehouse locations. Accurate dispatch and origin information is always declared on shipping and customs documentation, as required by law.</p>

        <h2 className="font-semibold text-lg pt-4">Processing and delivery estimates</h2>
        <p>Orders are prepared for dispatch within 1–4 business days depending on the item and destination, after order confirmation. Delivery estimates below are <strong>estimates in transit after dispatch</strong>, not guarantees. Actual delivery can be longer during customs processing, carrier delays or peak periods.</p>
        <ul className="list-disc pl-6 space-y-2">
          {shippingMethods.map((m) => (
            <li key={m.id}>
              <strong>{m.label}</strong> — {m.description} Estimated {m.transitDaysMin}–{m.transitDaysMax} business days in transit, where offered to your destination. Tracked.
            </li>
          ))}
        </ul>

        <h2 className="font-semibold text-lg pt-4">Duties, taxes and customs</h2>
        <p>Your cart and checkout show the duties and taxes treatment that applies to your delivery country before you pay. Depending on the market, import VAT/GST and duties are either included in your order total where our registrations allow collection, or payable on arrival. Where charges may apply on arrival, we say so clearly before checkout — we do not hide them in this policy only. Customs processing times are outside our control and can extend delivery estimates.</p>

        <h2 className="font-semibold text-lg pt-4">Tracking</h2>
        <p>Every shipment includes tracking. You receive tracking information by email once your order dispatches, and you can also use the <Link className="underline" href="/track">Track Order</Link> page.</p>

        <h2 className="font-semibold text-lg pt-4">Multiple parcels and carriers</h2>
        <p>Large or multi-item orders may arrive in more than one parcel and may travel with different carriers. This does not change your delivery estimate or the total you paid.</p>

        <h2 className="font-semibold text-lg pt-4">Address issues and failed delivery</h2>
        <p>Please double-check your address at checkout. If a carrier cannot deliver (for example, an incorrect address or an unclaimed parcel), it is returned or held according to the carrier’s process. We will contact you using the email on your order to resolve delivery problems; additional carrier re-delivery or return fees may apply where a failure results from an address error.</p>

        <h2 className="font-semibold text-lg pt-4">Restricted destinations and items</h2>
        <p>Some items cannot be shipped to some destinations due to customs or carrier restrictions. If an item in your cart is not available for your selected country, the product page and checkout will tell you before payment.</p>

        <h2 className="font-semibold text-lg pt-4">Business identity</h2>
        <p>Basco Sports is the seller of record. Our verified legal business name, registered address and support contact are published on the <Link className="underline" href="/legal">legal centre</Link> as each item is confirmed; where verification is still in progress, the legal centre says so rather than showing placeholder data.</p>
      </section>
    </main>
  );
}
