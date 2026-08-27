'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

  return <div className="bg-obsidian text-white text-[12px] tracking-wide"><div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between gap-4"><div className="flex items-center gap-6 overflow-hidden min-w-0"><span className="hidden md:inline-flex items-center gap-2 whitespace-nowrap max-w-[44vw] lg:max-w-[38vw] xl:max-w-none truncate"><span className="w-1.5 h-1.5 bg-lime rounded-full animate-pulse shrink-0" />{announcement}</span><span className="md:hidden truncate min-w-0">{announcement}</span></div><div className="hidden lg:flex items-center gap-5 text-white/70 whitespace-nowrap"><Link href="/contact" className="hover:text-white transition-colors">Need help? Contact us</Link><span className="w-px h-3 bg-white/20" /><Link href="/track" className="hover:text-white transition-colors">Track Order</Link><span className="w-px h-3 bg-white/20" /><Link href="/shipping" className="hover:text-white transition-colors">Shipping</Link></div><div className="flex items-center gap-2 text-[11px] shrink-0"><span className="bg-white/10 px-2 py-0.5 rounded-full whitespace-nowrap">DEMO STORE • No real payments</span></div></div></div>;
}
