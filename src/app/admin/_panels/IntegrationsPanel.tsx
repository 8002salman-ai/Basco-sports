'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff, Save, Cloud, Database, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface Settings {
  cloudflareApiToken: string;
  cloudflareAccountId: string;
  cloudflareR2Endpoint: string;
  cloudflareR2AccessKeyId: string;
  cloudflareR2SecretAccessKey: string;
  cloudflareR2BucketName: string;
  cloudflarePagesProject: string;
  supabaseProjectRef: string;
  supabaseProjectUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  supabaseDbPassword: string;
}

const EMPTY: Settings = {
  cloudflareApiToken: '', cloudflareAccountId: '', cloudflareR2Endpoint: '',
  cloudflareR2AccessKeyId: '', cloudflareR2SecretAccessKey: '', cloudflareR2BucketName: '',
  cloudflarePagesProject: '', supabaseProjectRef: '', supabaseProjectUrl: '',
  supabaseAnonKey: '', supabaseServiceRoleKey: '', supabaseDbPassword: '',
};

interface FieldDef { key: keyof Settings; label: string; placeholder: string; secret?: boolean; hint?: string; }

const CF_FIELDS: FieldDef[] = [
  { key: 'cloudflareApiToken', label: 'API Token', placeholder: 'cfat_...', secret: true, hint: 'dash.cloudflare.com → My Profile → API Tokens' },
  { key: 'cloudflareAccountId', label: 'Account ID', placeholder: 'f542683e...', hint: 'Dashboard → any domain → sidebar → API' },
  { key: 'cloudflareR2Endpoint', label: 'R2 Endpoint', placeholder: 'https://...r2.cloudflarestorage.com', hint: 'R2 → Manage R2 API Tokens → S3 API endpoint' },
  { key: 'cloudflareR2AccessKeyId', label: 'R2 Access Key ID', placeholder: 'dd9af8fba...', secret: true },
  { key: 'cloudflareR2SecretAccessKey', label: 'R2 Secret Access Key', placeholder: '1cdbbc9cd...', secret: true },
  { key: 'cloudflareR2BucketName', label: 'R2 Bucket Name', placeholder: 'basco-sports-images' },
  { key: 'cloudflarePagesProject', label: 'Pages Project Name', placeholder: 'basco-sports' },
];

const SB_FIELDS: FieldDef[] = [
  { key: 'supabaseProjectRef', label: 'Project Ref', placeholder: 'ljzpwkzdudnyowzkzgtc', hint: 'Dashboard → Settings → General → Reference ID' },
  { key: 'supabaseProjectUrl', label: 'Project URL', placeholder: 'https://xxxxx.supabase.co', hint: 'Dashboard → Settings → API → Project URL' },
  { key: 'supabaseAnonKey', label: 'Anon / Publishable Key', placeholder: 'eyJhbGci...', secret: true, hint: 'Dashboard → Settings → API → anon public' },
  { key: 'supabaseServiceRoleKey', label: 'Service Role Key', placeholder: 'eyJhbGci...', secret: true, hint: 'Dashboard → Settings → API → service_role (secret!)' },
  { key: 'supabaseDbPassword', label: 'Database Password', placeholder: '••••••••', secret: true, hint: 'Dashboard → Settings → Database → Password' },
];

function mask(val: string, show = 4): string {
  if (!val) return '';
  if (val.length <= show * 2 + 3) return '••••••••';
  return `${val.slice(0, show)}••••${val.slice(-show)}`;
}

async function dbCall(action: string, table: string, payload?: Record<string, unknown>): Promise<unknown> {
  const res = await fetch('/api/admin/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, action, payload }),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok || !json.ok) throw new Error(json.error || `DB error: ${res.status}`);
  return json.data;
}

function Field({ field, value, onChange }: { field: FieldDef; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  const hasValue = value.length > 0;
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-obsidian/50 flex items-center gap-2">
        {field.label}
        {field.secret && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">SECRET</span>}
      </label>
      <div className="relative">
        <input
          type={field.secret && !show ? 'password' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full h-10 px-3 pr-10 rounded-[10px] border border-stone-200 bg-white text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-lime-300"
        />
        {field.secret && (
          <button type="button" onClick={() => setShow(!show)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-obsidian/40 hover:text-obsidian/70">
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
      {field.hint && <p className="text-[11px] text-obsidian/40">{field.hint}</p>}
      {hasValue && <p className="text-[10px] text-emerald-600 flex items-center gap-1"><Check size={10} /> Saved ({mask(value, 6)})</p>}
    </div>
  );
}

function Section({ icon: Icon, title, color, fields, values, onChange }: {
  icon: typeof Cloud; title: string; color: string; fields: FieldDef[]; values: Settings; onChange: (k: keyof Settings, v: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const filled = fields.filter((f) => values[f.key]).length;
  return (
    <div className="bg-white rounded-[20px] border overflow-hidden">
      <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-between p-5 hover:bg-stone-50/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}><Icon size={18} /></div>
          <div className="text-left">
            <h3 className="font-semibold text-[15px]">{title}</h3>
            <p className="text-[11px] text-obsidian/50 mt-0.5">{filled}/{fields.length} fields configured</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {filled === fields.length ? <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">Connected</span>
            : filled > 0 ? <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">Partial</span>
            : <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-500 text-[11px]">Not configured</span>}
          <span className="text-obsidian/30 text-[13px]">{collapsed ? '▼' : '▲'}</span>
        </div>
      </button>
      {!collapsed && (
        <div className="px-5 pb-5 border-t border-stone-100">
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((f) => <Field key={f.key} field={f} value={values[f.key] || ''} onChange={(v) => onChange(f.key, v)} />)}
          </div>
        </div>
      )}
    </div>
  );
}

export function IntegrationsPanel() {
  const [settings, setSettings] = useState<Settings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = (await dbCall('findFirst', 'store_settings', { column: 'key', value: 'basco-store' })) as Record<string, string> | null;
        if (!cancelled && data) {
          setSettings({
            cloudflareApiToken: data.cloudflareApiToken || '',
            cloudflareAccountId: data.cloudflareAccountId || '',
            cloudflareR2Endpoint: data.cloudflareR2Endpoint || '',
            cloudflareR2AccessKeyId: data.cloudflareR2AccessKeyId || '',
            cloudflareR2SecretAccessKey: data.cloudflareR2SecretAccessKey || '',
            cloudflareR2BucketName: data.cloudflareR2BucketName || '',
            cloudflarePagesProject: data.cloudflarePagesProject || '',
            supabaseProjectRef: data.supabaseProjectRef || '',
            supabaseProjectUrl: data.supabaseProjectUrl || '',
            supabaseAnonKey: data.supabaseAnonKey || '',
            supabaseServiceRoleKey: data.supabaseServiceRoleKey || '',
            supabaseDbPassword: data.supabaseDbPassword || '',
          });
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const update = (key: keyof Settings, val: string) => setSettings((p) => ({ ...p, [key]: val }));

  const save = async () => {
    setSaving(true); setError(null);
    try {
      const row = { key: 'basco-store', storeName: 'Basco Sports', supportEmail: 'support@basco-sports.com', currency: 'USD', paymentProvider: 'demo', announcement: '', updatedAt: new Date().toISOString(), ...settings };
      const existing = await dbCall('findFirst', 'store_settings', { column: 'key', value: 'basco-store' });
      if (existing) {
        await dbCall('updateBy', 'store_settings', { column: 'key', value: 'basco-store', patch: row });
      } else {
        await dbCall('insertRaw', 'store_settings', { row });
      }
      setSavedMsg('Integration credentials saved');
      window.setTimeout(() => setSavedMsg(null), 3000);
    } catch (e) {
      setError((e as Error).message || 'Save failed');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="py-20 text-center text-[14px] text-obsidian/50">Loading integrations…</div>;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-[28px] leading-none">Integrations</h1>
          <p className="mt-1.5 text-[13px] text-obsidian/60">Configure API keys and credentials for external services</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.location.reload()} className="h-10 px-4 rounded-full border bg-white text-[13px] flex items-center gap-2 hover:bg-stone-50">
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={() => void save()} disabled={saving} className="h-10 px-5 rounded-full bg-obsidian text-white text-[13px] font-medium flex items-center gap-2 disabled:opacity-50">
            <Save size={13} /> {saving ? 'Saving…' : 'Save all'}
          </button>
        </div>
      </div>

      {error && <div className="mt-4 rounded-[12px] bg-red-50 border border-red-200 p-3 text-[13px] text-red-700 flex items-center gap-2"><AlertCircle size={14} /> {error}</div>}
      {savedMsg && <div className="mt-4 rounded-[12px] bg-emerald-50 border border-emerald-200 p-3 text-[13px] text-emerald-700 flex items-center gap-2"><Check size={14} /> {savedMsg}</div>}

      <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
        <AlertCircle size={14} className="shrink-0 mt-0.5" />
        <div><span className="font-semibold">Security:</span> Credentials stored in your database, served only through the admin API. Never share publicly. Secret fields are masked — re-enter to update.</div>
      </div>

      <div className="mt-6 space-y-4">
        <Section icon={Cloud} title="Cloudflare" color="bg-orange-50 text-orange-600" fields={CF_FIELDS} values={settings} onChange={update} />
        <Section icon={Database} title="Supabase" color="bg-green-50 text-green-600" fields={SB_FIELDS} values={settings} onChange={update} />
      </div>

      <div className="mt-6 grid sm:grid-cols-2 gap-3">
        <a href="https://dash.cloudflare.com/profile/api-tokens" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-[14px] bg-white border hover:border-orange-300 transition-colors">
          <Cloud size={16} className="text-orange-500" />
          <div><div className="text-[13px] font-medium">Create Cloudflare API Token</div><div className="text-[11px] text-obsidian/50">dash.cloudflare.com → My Profile → API Tokens</div></div>
        </a>
        <a href="https://supabase.com/dashboard/project/_/settings/api" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-[14px] bg-white border hover:border-green-300 transition-colors">
          <Database size={16} className="text-green-500" />
          <div><div className="text-[13px] font-medium">Supabase API Settings</div><div className="text-[11px] text-obsidian/50">Dashboard → Settings → API keys</div></div>
        </a>
      </div>
    </div>
  );
}
