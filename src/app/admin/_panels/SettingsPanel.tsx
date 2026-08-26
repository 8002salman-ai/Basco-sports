'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getDb } from '@/lib/admin/db';
import { StoreSettings } from '@/lib/admin/types';
import { DbStatus } from './DbStatus';

const DEFAULT_SETTINGS: StoreSettings = {
  key: 'basco-store',
  storeName: 'Basco Sports',
  supportEmail: 'support@basco-sports.com',
  currency: 'USD',
  announcement: '',
  paymentProvider: 'demo',
  updatedAt: '',
};

export function SettingsPanel() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const db = useMemo(() => getDb(), []);

  const load = useCallback(async () => {
    try {
      const existing = await db.findFirst<StoreSettings>('store_settings', 'key', 'basco-store');
      if (existing) setSettings(existing);
      setLoading(false);
    } catch (e) {
      setError((e as Error).message || 'Failed to load settings');
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const row: StoreSettings = { ...settings, updatedAt: new Date().toISOString() };
      const existing = await db.findFirst<StoreSettings>('store_settings', 'key', 'basco-store');
      if (existing) {
        await db.updateBy('store_settings', 'key', 'basco-store', row);
      } else {
        await db.insertRaw('store_settings', row);
      }
      setSavedMsg('Settings saved');
      window.setTimeout(() => setSavedMsg(null), 2500);
    } catch (e) {
      setError((e as Error).message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-[14px] text-obsidian/50">Loading settings…</div>;

  const inputCls =
    'w-full h-10 px-3 rounded-[10px] border border-stone-200 bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-lime-300';

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-[28px] leading-none">Settings</h1>
          <p className="mt-1.5 text-[13px] text-obsidian/60 flex items-center gap-2">
            <DbStatus /> Store profile
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-[12px] bg-red-50 border border-red-200 p-3 text-[13px] text-red-700">{error}</div>
      )}
      {savedMsg && (
        <div className="mt-4 rounded-[12px] bg-emerald-50 border border-emerald-200 p-3 text-[13px] text-emerald-700">
          {savedMsg}
        </div>
      )}

      <div className="mt-6 bg-white rounded-[16px] border p-6 space-y-4">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-obsidian/50">Store name</label>
          <input
            value={settings.storeName}
            onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
            className={`${inputCls} mt-1`}
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-obsidian/50">Support email</label>
          <input
            value={settings.supportEmail}
            onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
            className={`${inputCls} mt-1`}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-obsidian/50">Currency</label>
            <input
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value.toUpperCase() })}
              className={`${inputCls} mt-1`}
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-obsidian/50">Payment provider</label>
            <select
              value={settings.paymentProvider}
              onChange={(e) => setSettings({ ...settings, paymentProvider: e.target.value })}
              className={`${inputCls} mt-1`}
            >
              <option value="demo">Demo</option>
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-obsidian/50">
            Announcement (shown on storefront)
          </label>
          <input
            value={settings.announcement || ''}
            onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
            placeholder="e.g. Free shipping over $100"
            className={`${inputCls} mt-1`}
          />
        </div>
        <div className="pt-2 flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="h-10 px-6 rounded-full bg-obsidian text-white text-[13px] font-medium disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
