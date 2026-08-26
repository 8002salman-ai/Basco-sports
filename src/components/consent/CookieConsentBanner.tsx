"use client";
import { useConsent } from "./ConsentContext";
import Link from "next/link";
import { useEffect, useState } from "react";

export function CookieConsentBanner() {
  const { consent, acceptAll, rejectAll, setOpenPreferences } = useConsent();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show banner if user has not consented yet, after a short delay
    if (!consent.hasConsented) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [consent.hasConsented]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[70] p-4 lg:p-6 pointer-events-none">
      <div className="max-w-[960px] mx-auto bg-obsidian text-white rounded-[20px] shadow-lift border border-white/10 p-6 lg:p-7 pointer-events-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <h3 className="font-display text-[18px] font-semibold">Cookie preferences</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-white/70">
              We use necessary cookies to make the store work. With your consent, we also use analytics (Google Analytics) and advertising (AdSense) cookies.
              You can change your choices anytime in <Link href="/privacy" className="underline">Privacy</Link> or via preferences.
              No advertising cookies are set until you opt-in.
            </p>
            <div className="mt-3 flex gap-2 text-[11px] text-white/50">
              <span className="px-2.5 py-1 rounded-full bg-white/10">Necessary: always on</span>
              <span className="px-2.5 py-1 rounded-full bg-white/10">Analytics: off until consent</span>
              <span className="px-2.5 py-1 rounded-full bg-white/10">Ads: off until consent</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:w-[220px] shrink-0">
            <button onClick={acceptAll} className="h-11 rounded-full bg-lime text-obsidian font-semibold text-[13px] hover:bg-lime-300 transition-colors">Accept all</button>
            <button onClick={rejectAll} className="h-11 rounded-full bg-white/10 border border-white/15 text-white font-medium text-[13px] hover:bg-white/15">Reject non-essential</button>
            <button onClick={() => setOpenPreferences(true)} className="h-11 rounded-full bg-transparent border border-white/15 text-white/80 text-[13px] hover:bg-white/10">Manage preferences</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CookiePreferencesModal() {
  const { consent, setConsent, acceptAll, rejectAll, resetConsent, openPreferences, setOpenPreferences } = useConsent();

  if (!openPreferences) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end lg:items-center justify-center p-4">
      <div className="absolute inset-0 bg-obsidian/50 backdrop-blur-sm" onClick={() => setOpenPreferences(false)} />
      <div className="relative w-full max-w-[640px] bg-white rounded-[24px] shadow-lift border border-stone-200 overflow-hidden">
        <div className="p-6 lg:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-[24px] font-semibold">Cookie preferences</h2>
              <p className="mt-2 text-[13px] text-obsidian/60 max-w-[480px]">Choose which cookies you allow. Necessary cookies are required for cart, wishlist, and checkout demo. Analytics and advertising require your explicit opt-in per GDPR.</p>
            </div>
            <button onClick={() => setOpenPreferences(false)} className="h-9 w-9 rounded-full bg-stone-100 flex items-center justify-center">✕</button>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50 border">
              <div>
                <div className="font-medium text-[14px]">Necessary</div>
                <div className="text-[12px] text-obsidian/60">Cart, wishlist, consent storage, admin session. Always active.</div>
              </div>
              <span className="px-3 py-1 rounded-full bg-obsidian text-white text-[11px] font-bold">ALWAYS ON</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white border">
              <div className="flex-1 pr-4">
                <div className="font-medium text-[14px]">Analytics</div>
                <div className="text-[12px] text-obsidian/60">Google Analytics 4 – page views, events, only if GA ID configured and you opt-in. No data sent until consent.</div>
                <div className="mt-2 text-[11px] text-obsidian/50">Requires: NEXT_PUBLIC_GA_MEASUREMENT_ID + consent</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={consent.analytics} onChange={e => setConsent({ analytics: e.target.checked })} className="sr-only peer" />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-obsidian"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white border">
              <div className="flex-1 pr-4">
                <div className="font-medium text-[14px]">Advertising</div>
                <div className="text-[12px] text-obsidian/60">Google AdSense – ad slots only render if client ID + slot ID configured and you opt-in. Otherwise no ad request is made.</div>
                <div className="mt-2 text-[11px] text-obsidian/50">Requires: NEXT_PUBLIC_ADSENSE_CLIENT_ID + slot ID + consent</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={consent.advertising} onChange={e => setConsent({ advertising: e.target.checked })} className="sr-only peer" />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-obsidian"></div>
              </label>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={acceptAll} className="h-11 px-6 rounded-full bg-obsidian text-white text-[13px] font-semibold">Accept all</button>
            <button onClick={rejectAll} className="h-11 px-6 rounded-full bg-stone-100 text-obsidian text-[13px] font-medium">Reject non-essential</button>
            <button onClick={resetConsent} className="h-11 px-6 rounded-full border border-stone-200 text-[13px]">Reset</button>
            <button onClick={() => setOpenPreferences(false)} className="ml-auto h-11 px-6 rounded-full bg-lime text-obsidian text-[13px] font-semibold">Save preferences</button>
          </div>

          <div className="mt-6 p-3 rounded-xl bg-stone-50 border text-[11px] text-obsidian/60">
            Consent is stored locally in <code>basco-consent-v1</code>. No cookies are set for analytics/ads until you opt-in and until respective IDs are configured in deployment env. See Privacy page.
          </div>
        </div>
      </div>
    </div>
  );
}
