"use client";
import { useEffect } from "react";
import { useConsent } from "@/components/consent/ConsentContext";

// Client env is available via NEXT_PUBLIC_*
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

function isGaIdValid(id: string | undefined): boolean {
  if (!id) return false;
  if (id.includes('XXXX') || id === 'G-XXXXXXXXXX') return false;
  return id.startsWith('G-') && id.length >= 10;
}

export function GoogleAnalytics() {
  const { consent } = useConsent();

  useEffect(() => {
    if (!isGaIdValid(GA_ID)) return;
    if (!consent.analytics) return;
    if (!consent.hasConsented) return;

    // Prevent double injection
    if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${GA_ID}"]`)) return;

    // Load gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    // Initialize dataLayer
    const inline = document.createElement('script');
    inline.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_ID}', { anonymize_ip: true, send_page_view: true });
    `;
    document.head.appendChild(inline);

    // Optional: log for dev
    if (process.env.NODE_ENV === 'development') {
      console.log('[Basco] GA loaded:', GA_ID);
    }
  }, [consent.analytics, consent.hasConsented]);

  // Also track page views on consent change (SPA navigation handled by gtag auto)
  return null;
}

// Server-side helper to check if GA is configured (no secret exposure)
export function getGaStatus() {
  return {
    configured: isGaIdValid(GA_ID),
    measurementIdMasked: GA_ID ? `${GA_ID.slice(0, 4)}...${GA_ID.slice(-3)}` : null,
  };
}
