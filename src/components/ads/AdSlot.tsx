"use client";
import { useEffect, useRef, useState } from "react";
import { useConsent } from "@/components/consent/ConsentContext";

interface AdSlotProps {
  slotIdEnvKey: 'NEXT_PUBLIC_ADSENSE_SLOT_HEADER' | 'NEXT_PUBLIC_ADSENSE_SLOT_FOOTER' | 'NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR' | 'NEXT_PUBLIC_ADSENSE_SLOT_PRODUCT';
  className?: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  style?: React.CSSProperties;
  label?: string;
}

const CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

function isAdSenseClientValid(id: string | undefined): boolean {
  if (!id) return false;
  if (id.includes('XXXX') || id === 'ca-pub-XXXXXXXXXXXXXXXX') return false;
  return id.startsWith('ca-pub-') && id.length > 15;
}

function getSlotId(key: AdSlotProps['slotIdEnvKey']): string | null {
  const val = process.env[key];
  if (!val) return null;
  if (val.includes('XXXX')) return null;
  return val.trim();
}

export function AdSlot({ slotIdEnvKey, className, format = 'auto', style, label = 'Advertisement' }: AdSlotProps) {
  const { consent } = useConsent();
  const adRef = useRef<HTMLModElement>(null);
  const [status, setStatus] = useState<'idle' | 'no-consent' | 'not-configured' | 'loading' | 'loaded'>('idle');

  const slotId = getSlotId(slotIdEnvKey);
  const clientConfigured = isAdSenseClientValid(CLIENT_ID);
  const slotConfigured = !!slotId;

  useEffect(() => {
    if (!consent.hasConsented) {
      setStatus('idle');
      return;
    }
    if (!consent.advertising) {
      setStatus('no-consent');
      return;
    }
    if (!clientConfigured || !slotConfigured) {
      setStatus('not-configured');
      return;
    }

    setStatus('loading');

    // Load AdSense script once
    const existing = document.querySelector(`script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`) as HTMLScriptElement | null;
    if (!existing) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT_ID}`;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    // Push ad
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      setStatus('loaded');
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Basco] AdSense push failed (expected in dev without approval):', e);
      }
      setStatus('loaded'); // still mark loaded to avoid loop
    }
  }, [consent.advertising, consent.hasConsented, clientConfigured, slotConfigured, slotId]);

  // Privacy: never render real ad unless consent + configured
  if (!consent.hasConsented || !consent.advertising) {
    // Respectful: render nothing, not even placeholder in production
    if (process.env.NODE_ENV === 'development' && consent.hasConsented) {
      return (
        <div className={`rounded-xl border border-dashed border-stone-300 bg-stone-50 p-4 text-center text-[11px] text-obsidian/50 ${className || ''}`} style={style}>
          AdSlot {slotIdEnvKey} – advertising consent not given (no ad request)
        </div>
      );
    }
    return null;
  }

  if (!clientConfigured || !slotConfigured) {
    // In production, render nothing to avoid policy violation
    if (process.env.NODE_ENV === 'development') {
      return (
        <div className={`rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-center text-[11px] ${className || ''}`} style={style}>
          <div className="font-semibold text-amber-800">AdSlot not configured</div>
          <div className="text-amber-700/70 mt-1">Client: {clientConfigured ? '✓' : '✗ missing NEXT_PUBLIC_ADSENSE_CLIENT_ID'} | Slot {slotIdEnvKey}: {slotConfigured ? `✓ ${slotId}` : '✗ missing'}</div>
          <div className="mt-1 text-[10px] opacity-60">No ad request made – configure env in Vercel/Cloudflare Pages</div>
        </div>
      );
    }
    return null;
  }

  // Real ad render – only when consent + configured
  return (
    <div className={className} style={style} aria-label={label}>
      <ins
        ref={adRef as any}
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client={CLIENT_ID}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

// Helper for admin status (masked)
export function getAdSenseStatus() {
  const clientId = CLIENT_ID;
  return {
    clientConfigured: isAdSenseClientValid(clientId),
    clientMasked: clientId ? `${clientId.slice(0, 10)}...${clientId.slice(-4)}` : null,
    slots: {
      header: !!getSlotId('NEXT_PUBLIC_ADSENSE_SLOT_HEADER'),
      footer: !!getSlotId('NEXT_PUBLIC_ADSENSE_SLOT_FOOTER'),
      sidebar: !!getSlotId('NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR'),
      product: !!getSlotId('NEXT_PUBLIC_ADSENSE_SLOT_PRODUCT'),
    },
  };
}
