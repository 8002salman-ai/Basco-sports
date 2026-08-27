"use client";
import React, { useMemo, useState } from "react";
import { ChevronDown, Search, X, Check, MapPin, XCircle } from "lucide-react";
import { useMarket } from "./MarketContext";
import { supportedCountries, currencies, markets, DEFAULT_COUNTRY, DEFAULT_CURRENCY } from "@/config/markets";

export function MarketSuggestionBanner() {
  const { countryCode, currency, suggestion, acceptSuggestion, dismissSuggestion, hydrated } = useMarket();
  if (!hydrated || !suggestion) return null;
  const market = markets[suggestion];
  if (!market) return null;
  // "Keep" always refers to the USA / USD default the shopper started on.
  const defaultMarket = markets[DEFAULT_COUNTRY];
  return (
    <div role="status" className="bg-stone-100 border-b border-stone-200 text-[13px]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-5 lg:px-6 py-2 flex items-center gap-2.5 flex-wrap">
        <MapPin className="w-4 h-4 shrink-0" />
        <span className="min-w-0 truncate">Looks like you’re shopping from {market.countryName} {market.flagEmoji}</span>
        <button onClick={acceptSuggestion} className="h-7 px-3 rounded-full bg-obsidian text-white text-[12px] font-medium whitespace-nowrap">
          Switch to {market.countryName} / {market.currency}
        </button>
        <button onClick={dismissSuggestion} className="h-7 px-3 rounded-full border border-stone-300 text-[12px] whitespace-nowrap">
          Keep {defaultMarket.flagEmoji} {DEFAULT_COUNTRY} / {DEFAULT_CURRENCY}
        </button>
        <span className="hidden md:inline text-[11px] text-obsidian/50 whitespace-nowrap">You can change this anytime in the header.</span>
        <button onClick={dismissSuggestion} aria-label="Dismiss" className="ml-auto h-7 w-7 shrink-0 rounded-full hover:bg-stone-200 flex items-center justify-center"><XCircle className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

export function MarketSelector({ compact = false }: { compact?: boolean }) {
  const { countryCode, currency, setCountry, setCurrency, hydrated } = useMarket();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const market = markets[countryCode];

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return supportedCountries;
    return supportedCountries.filter(
      (m) => m.countryName.toLowerCase().includes(q) || m.countryCode.toLowerCase().includes(q) || m.currency.toLowerCase().includes(q),
    );
  }, [query]);

  if (!hydrated) return <div className="h-9 w-[110px]" aria-hidden />;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={compact
          ? "h-9 px-2.5 rounded-full bg-white/10 inline-flex items-center gap-1 text-[12px] font-medium whitespace-nowrap"
          : "h-9 px-2 sm:px-2.5 rounded-full border border-stone-200 hover:bg-stone-100 inline-flex items-center gap-1 sm:gap-1.5 text-[12px] sm:text-[13px] font-medium transition-colors whitespace-nowrap max-w-[46vw] sm:max-w-none"}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Ship to ${market?.countryName ?? ""}, currency ${currency}`}
      >
        <span aria-hidden>{market?.flagEmoji}</span>
        <span className="hidden md:inline">{market?.countryCode}</span>
        <span className="hidden xl:inline font-normal opacity-70">Ship to:</span>
        <span className="hidden xl:inline">{market?.countryName}</span>
        <span className="hidden md:inline opacity-40" aria-hidden>·</span>
        <span className="font-semibold">{currency}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Shipping country and currency">
          <div className="absolute inset-0 bg-obsidian/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-[6%] sm:bottom-auto w-full sm:w-[540px] max-h-[88dvh] sm:max-h-[82dvh] bg-white sm:rounded-[24px] rounded-t-[24px] shadow-lift flex flex-col overflow-hidden">
            <div className="sticky top-0 z-10 bg-white px-5 sm:px-6 pt-4 pb-3 border-b border-stone-100 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display font-bold text-[18px] sm:text-[20px] leading-none">Shipping & currency</h2>
                <p className="text-[12px] text-obsidian/60 mt-1 truncate">Choose where we deliver and how prices display.</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="h-9 w-9 shrink-0 rounded-full bg-stone-100 flex items-center justify-center"><X className="w-5 h-5" /></button>
            </div>

            <div className="px-5 sm:px-6 py-4 border-b border-stone-100">
              <label className="text-[11px] tracking-widest uppercase opacity-60">Currency</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.values(currencies).map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setCurrency(c.code)}
                    className={`h-9 px-3.5 rounded-full text-[13px] font-medium border transition-colors inline-flex items-center gap-1.5 ${currency === c.code ? "bg-obsidian text-white border-obsidian" : "border-stone-200 hover:bg-stone-100"}`}
                    aria-pressed={currency === c.code}
                  >
                    {c.code}{currency === c.code && <Check className="w-3.5 h-3.5" />}
                    {!c.checkoutSupported && <span className="text-[10px] opacity-60">(est.)</span>}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-obsidian/50">Prices outside USD are converted estimates. The confirmed total appears at checkout before payment.</p>
            </div>

            <div className="px-5 sm:px-6 py-4 border-b border-stone-100 relative">
              <Search className="absolute left-8 sm:left-9 top-1/2 -translate-y-[35%] w-4 h-4 text-obsidian/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search country…"
                className="w-full h-11 pl-10 pr-4 bg-stone-100 rounded-full text-[14px] focus:outline-none focus:ring-2 focus:ring-obsidian/10"
                aria-label="Search countries"
              />
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain p-2 pb-[max(8px,env(safe-area-inset-bottom))]" role="listbox" aria-label="Countries">
              {results.length === 0 && <p className="p-6 text-center text-[13px] text-obsidian/60">No countries match “{query}”.</p>}
              {results.map((m) => {
                const active = m.countryCode === countryCode;
                return (
                  <button
                    key={m.countryCode}
                    role="option"
                    aria-selected={active}
                    onClick={() => { setCountry(m.countryCode); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${active ? "bg-stone-100" : "hover:bg-stone-50"}`}
                  >
                    <span className="text-[20px]" aria-hidden>{m.flagEmoji}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[14px] font-medium">{m.countryName}</span>
                      <span className="block text-[11px] text-obsidian/50">
                        {m.checkoutEnabled ? "Checkout available" : "Browsing only – checkout opening soon"}
                      </span>
                    </span>
                    <span className="text-[12px] font-semibold text-obsidian/70">{m.currency}</span>
                    {active && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
