"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_COUNTRY, DEFAULT_CURRENCY, getMarket, markets, suggestCountryFromTimeZone } from "@/config/markets";

export interface MarketState {
  countryCode: string;
  currency: string;
  language: string; // architecture for future locales; English-only today
  setCountry: (code: string) => void;
  setCurrency: (code: string) => void;
  setLanguage: (code: string) => void;
  suggestion: string | null;           // suggested country code (timezone-only)
  dismissSuggestion: () => void;
  acceptSuggestion: () => void;
  hydrated: boolean;
}

const COUNTRY_KEY = "basco-country-v1";
const CURRENCY_KEY = "basco-currency-v1";
const LANGUAGE_KEY = "basco-language-v1";
const SUGGESTION_DISMISS_KEY = "basco-market-suggestion-dismissed-v1";

const MarketContext = createContext<MarketState | null>(null);

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY);
  const [currency, setCurrencyState] = useState(DEFAULT_CURRENCY);
  const [language, setLanguageState] = useState("en");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COUNTRY_KEY);
      if (saved && markets[saved]) {
        setCountryCode(saved);
        // Adopt the market's common currency unless the shopper picked one explicitly.
        if (!localStorage.getItem(CURRENCY_KEY)) setCurrencyState(markets[saved].currency);
      }
      const savedCur = localStorage.getItem(CURRENCY_KEY);
      if (savedCur) setCurrencyState(savedCur);
      const savedLang = localStorage.getItem(LANGUAGE_KEY);
      if (savedLang) setLanguageState(savedLang);

      // Suggest (never force) via browser timezone only – no IP service, no GPS, no tracking.
      const dismissed = localStorage.getItem(SUGGESTION_DISMISS_KEY) === "1";
      if (!saved && !dismissed) {
        try {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const guess = suggestCountryFromTimeZone(tz);
          if (guess && guess !== DEFAULT_COUNTRY && markets[guess]) setSuggestion(guess);
        } catch { /* timezone unavailable – skip silently */ }
      }
    } catch { /* storage blocked – defaults apply */ }
    setHydrated(true);
  }, []);

  const setCountry = useCallback((code: string) => {
    const market = markets[code];
    if (!market) return;
    setCountryCode(code);
    try { localStorage.setItem(COUNTRY_KEY, code); } catch {}
    // Suggest the market's common currency, but never clobber an explicit choice.
    setCurrencyState((prev) => {
      if (localStorage.getItem(CURRENCY_KEY)) return prev;
      return market.currency;
    });
    setSuggestion(null);
  }, []);

  const setCurrency = useCallback((code: string) => {
    setCurrencyState(code);
    try { localStorage.setItem(CURRENCY_KEY, code); } catch {}
  }, []);

  const setLanguage = useCallback((code: string) => {
    setLanguageState(code);
    try { localStorage.setItem(LANGUAGE_KEY, code); } catch {}
  }, []);

  const dismissSuggestion = useCallback(() => {
    setSuggestion(null);
    try { localStorage.setItem(SUGGESTION_DISMISS_KEY, "1"); } catch {}
  }, []);

  const acceptSuggestion = useCallback(() => {
    if (suggestion) setCountry(suggestion);
    setSuggestion(null);
  }, [suggestion, setCountry]);

  const value = useMemo<MarketState>(() => ({
    countryCode, currency, language,
    setCountry, setCurrency, setLanguage,
    suggestion, dismissSuggestion, acceptSuggestion,
    hydrated,
  }), [countryCode, currency, language, setCountry, setCurrency, setLanguage, suggestion, dismissSuggestion, acceptSuggestion, hydrated]);

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket(): MarketState {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error("useMarket must be used within MarketProvider");
  return ctx;
}

export function useMarketConfig() {
  const { countryCode } = useMarket();
  return getMarket(countryCode);
}
