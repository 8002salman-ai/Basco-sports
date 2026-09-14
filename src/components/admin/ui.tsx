'use client';

import { ReactNode, useEffect } from 'react';
import { X, WarningCircle } from '@phosphor-icons/react';

/** Basco admin UI kit — ported from the Luxedge admin design language. */

export const CARD_CLS = 'bg-white rounded-xl border border-gray-100';

export function Card({ title, actions, children, className = '', bodyClass = 'p-4' }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <div className={`${CARD_CLS} ${className}`}>
      {(title || actions) && (
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-bold text-gray-900 leading-tight">{title}</h2>
          {actions}
        </div>
      )}
      <div className={bodyClass}>{children}</div>
    </div>
  );
}

export function SectionTitle({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <h3 className="font-bold text-[11px] uppercase tracking-wider text-gray-500 flex items-center gap-1.5 mb-2.5">
      {icon}
      {children}
    </h3>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export const INPUT_CLS =
  'w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-200';
export const TEXTAREA_CLS =
  'w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-200';
export const SELECT_CLS =
  'h-10 px-3 rounded-lg border border-gray-200 bg-white text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200';

export function Field({ label, hint, children, required }: { label: string; hint?: string; children: ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {hint && <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>}
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  type = 'button',
  title,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit';
  title?: string;
  className?: string;
}) {
  const styles: Record<string, string> = {
    primary: 'bg-[#1b1f27] text-white hover:bg-[#2b3140]',
    secondary: 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-600 hover:bg-gray-100',
    danger: 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title}
      className={`h-10 px-4 rounded-lg text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function IconButton({ children, onClick, label, tone = 'gray' }: { children: ReactNode; onClick?: () => void; label: string; tone?: 'gray' | 'red' }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label}
      className={`p-2 rounded-lg transition-colors ${tone === 'red' ? 'text-gray-400 hover:text-rose-600 hover:bg-rose-50' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}>
      {children}
    </button>
  );
}

const TONES: Record<string, string> = {
  gray: 'bg-gray-100 text-gray-600',
  green: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-rose-100 text-rose-700',
  blue: 'bg-blue-100 text-blue-700',
  violet: 'bg-violet-100 text-violet-700',
};

export function Badge({ children, tone = 'gray' }: { children: ReactNode; tone?: keyof typeof TONES }) {
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${TONES[tone] || TONES.gray}`}>{children}</span>;
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex items-center gap-2 text-[12px] text-gray-700"
      role="switch"
      aria-checked={on}
    >
      <span className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${on ? 'bg-blue-500' : 'bg-gray-300'}`}>
        <span className={`w-4 h-4 rounded-full bg-white transition-transform ${on ? 'translate-x-4' : ''}`} />
      </span>
      {label}
    </button>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400" aria-label="Close">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, children, footer, width = 'max-w-xl' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; width?: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/40" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className={`bg-white h-full w-full ${width} shadow-2xl flex flex-col`} onClick={(e) => e.stopPropagation()}>
        <header className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-sm text-gray-900">{title}</h3>
          <IconButton label="Close" onClick={onClose}><X size={15} weight="bold" /></IconButton>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <footer className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">{footer}</footer>}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, hint, action }: { icon?: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="py-12 text-center">
      {icon && <div className="mx-auto w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-3 text-gray-300">{icon}</div>}
      <p className="text-xs text-gray-500">{title}</p>
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
      {action && <div className="mt-3 flex justify-center">{action}</div>}
    </div>
  );
}

export function Notice({ tone = 'blue', children }: { tone?: 'blue' | 'green' | 'amber' | 'red'; children: ReactNode }) {
  const cls: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };
  return <div className={`rounded-xl border p-3 text-[12px] ${cls[tone]}`}>{children}</div>;
}

/** Banner used by every local-only screen so no one mistakes mock data for live data. */
export function DemoNotice({ children }: { children?: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800">
      <WarningCircle size={15} weight="fill" className="mt-px shrink-0" />
      <span>{children || 'Design preview — data is local demo data. Nothing is sent to a server: wire Basco\u2019s own keys later to make this live.'}</span>
    </div>
  );
}

/**
 * Where a screen's rows actually came from. Screens backed by a real table
 * render this so `useAdminTable`'s state is visible instead of assumed.
 */
export function DataNotice({ source, error }: { source: 'loading' | 'live' | 'local'; error: string | null }) {
  if (source === 'live') return null;
  if (source === 'loading') {
    return <p className="text-[12px] text-gray-500">Loading from the store database…</p>;
  }
  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800">
      <WarningCircle size={15} weight="fill" className="mt-px shrink-0" />
      <span>
        {error
          ? `The store database could not be read (${error}). These are Basco\u2019s seed rows and edits stay local.`
          : 'This table is empty, so these are Basco\u2019s seed rows and edits stay local.'}
      </span>
    </div>
  );
}

/** Toolbar row above a table: search + filters + actions. */
export function Toolbar({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex items-center gap-2 flex-wrap ${className}`}>{children}</div>;
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className = '' }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={`flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 h-10 ${className}`}>
      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-gray-400 shrink-0" aria-hidden="true">
        <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="bg-transparent text-[13px] outline-none w-full min-w-[8rem] placeholder:text-gray-400"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label="Clear search" className="text-gray-300 hover:text-gray-500">
          <X size={13} weight="bold" />
        </button>
      )}
    </div>
  );
}

export function Tabs({
  tabs,
  active,
  onChange,
  className = '',
}: {
  tabs: { key: string; label: string; badge?: ReactNode; required?: boolean }[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-0.5 overflow-x-auto scrollbar-none border-b border-gray-100 ${className}`} role="tablist">
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.key)}
            className={`relative px-3.5 py-2.5 text-[12px] font-semibold whitespace-nowrap transition-colors ${on ? 'text-gray-900' : 'text-gray-500 hover:text-gray-800'}`}
          >
            {t.label}
            {t.required && <span className="text-rose-500 ml-0.5" title="Required">*</span>}
            {t.badge != null && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-bold">{t.badge}</span>}
            {on && <span className="absolute inset-x-1.5 -bottom-px h-[2px] rounded-full" style={{ background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)' }} />}
          </button>
        );
      })}
    </div>
  );
}

const STAT_TONES: Record<string, string> = {
  blue: 'linear-gradient(135deg,#3b82f6,#22d3ee)',
  violet: 'linear-gradient(135deg,#8b5cf6,#a855f7)',
  emerald: 'linear-gradient(135deg,#10b981,#14b8a6)',
  amber: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
  rose: 'linear-gradient(135deg,#ec4899,#f43f5e)',
  slate: 'linear-gradient(135deg,#94a3b8,#64748b)',
};

export function StatCard({
  label,
  value,
  hint,
  delta,
  icon,
  tone = 'blue',
  onClick,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  delta?: string;
  icon?: ReactNode;
  tone?: keyof typeof STAT_TONES;
  onClick?: () => void;
}) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={`text-left bg-white rounded-xl border border-gray-100 p-4 ${onClick ? 'hover:border-gray-200 hover:shadow-sm transition-all' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</span>
        {icon && (
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0" style={{ background: STAT_TONES[tone] }}>
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2 text-[22px] font-bold text-gray-900 tracking-tight leading-none">{value}</div>
      {(hint || delta) && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-gray-500">
          {delta && <span className="font-semibold text-emerald-600">{delta}</span>}
          {hint}
        </div>
      )}
    </Wrapper>
  );
}

export function StatGrid({ children, cols = 4 }: { children: ReactNode; cols?: 2 | 3 | 4 | 5 }) {
  const map: Record<number, string> = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
  };
  return <div className={`grid gap-3 ${map[cols]}`}>{children}</div>;
}

export function ProgressBar({ value, tone = 'blue', className = '' }: { value: number; tone?: 'blue' | 'emerald' | 'amber' | 'rose' | 'violet'; className?: string }) {
  const bar: Record<string, string> = {
    blue: 'linear-gradient(90deg,#3b82f6,#22d3ee)',
    emerald: 'linear-gradient(90deg,#10b981,#14b8a6)',
    amber: 'linear-gradient(90deg,#f59e0b,#fbbf24)',
    rose: 'linear-gradient(90deg,#f43f5e,#fb923c)',
    violet: 'linear-gradient(90deg,#8b5cf6,#a855f7)',
  };
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-1.5 w-full rounded-full bg-gray-100 overflow-hidden ${className}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: bar[tone] }} />
    </div>
  );
}

export function KeyValue({ items, cols = 2 }: { items: { label: string; value: ReactNode }[]; cols?: 2 | 3 | 4 }) {
  const map: Record<number, string> = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' };
  return (
    <dl className={`grid grid-cols-1 ${map[cols]} gap-3`}>
      {items.map((it) => (
        <div key={it.label} className="min-w-0">
          <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{it.label}</dt>
          <dd className="text-[13px] text-gray-800 mt-0.5 break-words">{it.value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="py-16 flex flex-col items-center gap-2 text-[12px] text-gray-400">
      <span className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-blue-500 animate-spin" />
      {label}
    </div>
  );
}

export function Pagination({ page, pages, total, onPage, perPage }: { page: number; pages: number; total: number; onPage: (p: number) => void; perPage?: number }) {
  if (pages <= 1) return <div className="text-[11px] text-gray-400">{total} row{total === 1 ? '' : 's'}</div>;
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <span className="text-[11px] text-gray-400">
        Page {page + 1} of {pages}
        {perPage ? ` · ${total} rows` : ''}
      </span>
      <div className="flex items-center gap-1.5">
        <Button variant="secondary" className="h-8 px-3" disabled={page === 0} onClick={() => onPage(page - 1)}>Prev</Button>
        <Button variant="secondary" className="h-8 px-3" disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}

export function ScoreRing({ value, size = 64, label }: { value: number; size?: number; label?: string }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const stroke = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#f43f5e';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth="6" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={stroke} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(c * pct) / 100} ${c}`} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-gray-900">{pct}</span>
      </div>
      {label && <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</span>}
    </div>
  );
}
