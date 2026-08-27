'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * Announcement bar – breakpoint-based priority (never squeeze-and-clip):
 *   xs  (<sm)   : primary shipping message only
 *   sm–lg       : primary + tracked-delivery message
 *   lg–xl       : full message + Track Order + Shipping
 *   xl+         : full message + Contact + Track Order + Shipping + demo badge
 * Heights stay 32px at every width; text is segmented so we HIDE lower-priority
 * segments instead of truncating mid-word.
 */
const DEFAULT_ANNOUNCEMENT = 'Worldwide shipping • Tracked international delivery • Duties & taxes shown before payment';

export function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState(DEFAULT_ANNOUNCEMENT);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return;
    fetch(`${url}/rest/v1/store_settings?key=eq.basco-store&select=announcement&limit=1`, { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } })
      .then((response) => response.ok ? response.json() : [])
      .then((rows: Array<{ announcement?: string | null }>) => { const value = rows[0]?.announcement?.trim(); if (value) setAnnouncement(value); })
      .catch(() => undefined);
  }, []);

  const segments = announcement.split('•').map((s) => s.trim()).filter(Boolean);
  const primary = segments[0] ?? announcement;
  const primaryPlus = segments.slice(0, 2).join('  •  ');
  const full = segments.join('  •  ');

  const Dot = () => <span className="w-1.5 h-1.5 bg-lime rounded-full animate-pulse shrink-0" aria-hidden />;

  return (
    <div className="bg-obsidian text-white text-[12px] tracking-wide">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-5 lg:px-6 h-8 flex items-center justify-between gap-3 min-w-0">
        {/* Priority 1: primary shipping/value message (all widths) */}
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <span className="sm:hidden inline-flex items-center gap-2 whitespace-nowrap min-w-0 overflow-hidden">
            <Dot />{primary}
          </span>
          <span className="hidden sm:inline-flex lg:hidden items-center gap-2 whitespace-nowrap min-w-0 overflow-hidden">
            <Dot />{primaryPlus}
          </span>
          <span className="hidden lg:inline-flex items-center gap-2 whitespace-nowrap">
            <Dot />{full}
          </span>
        </div>

        {/* Priority 2–3: utility links only when real width exists */}
        <div className="hidden lg:flex items-center gap-4 text-white/70 whitespace-nowrap shrink-0">
          <Link href="/contact" className="hidden xl:inline hover:text-white transition-colors">Need help? Contact us</Link>
          <span className="hidden xl:inline w-px h-3 bg-white/20" aria-hidden />
          <Link href="/track" className="hover:text-white transition-colors">Track Order</Link>
          <span className="w-px h-3 bg-white/20" aria-hidden />
          <Link href="/shipping" className="hover:text-white transition-colors">Shipping</Link>
        </div>

        {/* Demo transparency badge: hidden on the narrowest screens (also in footer/checkout), sm+ */}
        <div className="hidden sm:flex items-center text-[11px] shrink-0">
          <span className="bg-white/10 px-2 py-0.5 rounded-full whitespace-nowrap">DEMO STORE • No real payments</span>
        </div>
      </div>
    </div>
  );
}
