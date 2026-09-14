'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FloppyDisk, GearSix } from '@phosphor-icons/react';
import { getDb } from '@/lib/admin/db';
import { StoreSettings } from '@/lib/admin/types';
import { Button, Card, Field, INPUT_CLS, Notice, PageHeader, SELECT_CLS, Spinner } from '@/components/admin/ui';


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

  if (loading) return <Spinner label="Loading settings…" />;

  return (
    <div className="space-y-4 max-w-3xl">
      <PageHeader title="Settings" subtitle="Store profile and storefront defaults" />

      {error && <Notice tone="red">{error}</Notice>}
      {savedMsg && <Notice tone="green">{savedMsg}</Notice>}

      <Card title={<span className="flex items-center gap-2"><GearSix size={15} weight="bold" /> Store profile</span>} bodyClass="p-4 space-y-4">
        <Field label="Store name">
          <input value={settings.storeName} onChange={(e) => setSettings({ ...settings, storeName: e.target.value })} className={INPUT_CLS} />
        </Field>
        <Field label="Support email">
          <input value={settings.supportEmail} onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })} className={INPUT_CLS} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Currency">
            <input value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value.toUpperCase() })} className={INPUT_CLS} />
          </Field>
          <Field label="Payment provider" hint="The storefront stays in demo mode until real keys exist.">
            <select value={settings.paymentProvider} onChange={(e) => setSettings({ ...settings, paymentProvider: e.target.value })} className={`${SELECT_CLS} w-full`}>
              <option value="demo">Demo</option>
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
            </select>
          </Field>
        </div>
        <Field label="Announcement" hint="Shown in the storefront announcement bar.">
          <input value={settings.announcement || ''} onChange={(e) => setSettings({ ...settings, announcement: e.target.value })} placeholder="e.g. Free shipping over $150" className={INPUT_CLS} />
        </Field>
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}><FloppyDisk size={14} weight="bold" /> {saving ? 'Saving…' : 'Save settings'}</Button>
        </div>
      </Card>
    </div>
  );
}
