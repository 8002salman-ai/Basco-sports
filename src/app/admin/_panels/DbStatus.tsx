'use client';

import { useEffect, useState } from 'react';
import { getDbMode, type DbMode } from '@/lib/admin/db';

export function DbStatus() {
  const [mode, setMode] = useState<DbMode>('unconfigured');

  useEffect(() => {
    setMode(getDbMode());
  }, []);

  const cfg =
    mode === 'supabase'
      ? { label: 'Supabase connected', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
      : mode === 'local'
        ? { label: 'Local demo storage (localStorage)', cls: 'bg-amber-50 text-amber-700 border-amber-200' }
        : { label: 'Storage: unconfigured', cls: 'bg-stone-100 text-stone-500 border-stone-200' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${cfg.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
}
