"use client";
import { useMarket } from "@/components/market/MarketContext";
import { quoteShipping, shippingUnavailableMessage } from "@/lib/shipping";
import { taxSummaryFor } from "@/lib/tax";
import { convertForDisplay } from "@/lib/currency";
import { MapPin, Truck } from "lucide-react";

export function ProductMarketPanel({ priceUSD }: { priceUSD: number }) {
  const { countryCode, currency } = useMarket();
  const quotes = quoteShipping(countryCode, priceUSD);
  const tax = taxSummaryFor(countryCode, priceUSD);

  return (
    <section aria-label="Delivery information" className="mt-6 rounded-2xl border border-stone-200 p-5 text-[13px]">
      <div className="flex items-center gap-2 font-medium"><MapPin className="w-4 h-4" /> Delivery to {countryCode}</div>
      {quotes.length === 0 ? (
        <p className="mt-3 text-obsidian/70">{shippingUnavailableMessage(countryCode)}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {quotes.map((q) => (
            <li key={q.id} className="flex items-start gap-2">
              <Truck className="w-4 h-4 mt-0.5 shrink-0 opacity-60" />
              <span>
                <span className="block font-medium">{q.label} — {q.priceUSD === 0 ? "Free" : convertForDisplay(q.priceUSD, currency)}</span>
                <span className="block opacity-70">{q.description} {q.estimateText}.</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {tax.dutiesDisclosure && <p className="mt-3 text-obsidian/60 leading-relaxed">{tax.dutiesDisclosure}</p>}
      <p className="mt-3 text-[11px] text-obsidian/50">Fulfilled by Basco Sports • Tracked international delivery • Final amounts are confirmed at checkout before payment.</p>
    </section>
  );
}
