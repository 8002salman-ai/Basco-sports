'use client';

import { useEffect, useState } from 'react';
import { Cloud, Database, Eye, EyeSlash, FloppyDisk, CheckCircle, WarningCircle, ArrowsClockwise, ArrowUpRight } from '@phosphor-icons/react';
import { Badge, Button, Card, Field as FormField, INPUT_CLS, Notice, PageHeader, Spinner } from '@/components/admin/ui';

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

function CredentialField({ field, value, onChange }: { field: FieldDef; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <FormField label={field.label} hint={field.hint}>
      <div className="relative">
        <input
          type={field.secret && !show ? 'password' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={`${INPUT_CLS} font-mono pr-10`}
        />
        {field.secret && (
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide value' : 'Show value'} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
            {show ? <EyeSlash size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
      {field.secret && value.length > 0 && (
        <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle size={10} weight="fill" /> Saved ({mask(value, 6)})</p>
      )}
    </FormField>
  );
}

function CredentialSection({ icon: Icon, title, tone, fields, values, onChange }: {
  icon: typeof Cloud; title: string; tone: string; fields: FieldDef[]; values: Settings; onChange: (k: keyof Settings, v: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const filled = fields.filter((f) => values[f.key]).length;
  const state = filled === fields.length ? 'connected' : filled > 0 ? 'partial' : 'not configured';

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${tone}`}><Icon size={15} weight="bold" /></span>
          {title}
          <span className="text-[11px] font-normal text-gray-400">{filled}/{fields.length} configured</span>
        </span>
      }
      actions={
        <>
          <Badge tone={state === 'connected' ? 'green' : state === 'partial' ? 'amber' : 'gray'}>{state}</Badge>
          <Button variant="ghost" className="h-8 px-2" onClick={() => setCollapsed(!collapsed)}>{collapsed ? 'Expand' : 'Collapse'}</Button>
        </>
      }
      bodyClass={collapsed ? 'hidden' : 'p-4'}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((f) => (
          <CredentialField key={f.key} field={f} value={values[f.key] || ''} onChange={(v) => onChange(f.key, v)} />
        ))}
      </div>
    </Card>
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

  if (loading) return <Spinner label="Loading integrations…" />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Integrations"
        subtitle="API keys and credentials for the services this deployment talks to."
        actions={
          <>
            <Button variant="secondary" onClick={() => window.location.reload()}><ArrowsClockwise size={14} weight="bold" /> Refresh</Button>
            <Button onClick={() => void save()} disabled={saving}><FloppyDisk size={14} weight="bold" /> {saving ? 'Saving…' : 'Save all'}</Button>
          </>
        }
      />

      {error && <Notice tone="red"><span className="inline-flex items-center gap-1.5"><WarningCircle size={13} weight="fill" /> {error}</span></Notice>}
      {savedMsg && <Notice tone="green"><span className="inline-flex items-center gap-1.5"><CheckCircle size={13} weight="fill" /> {savedMsg}</span></Notice>}

      <Notice tone="amber">
        <strong>Security:</strong> credentials are stored in the database and served only through the authenticated admin API. Secret fields are masked — re-enter a value to update it, and never share these publicly.
      </Notice>

      <CredentialSection icon={Cloud} title="Cloudflare" tone="bg-orange-50 text-orange-600" fields={CF_FIELDS} values={settings} onChange={update} />
      <CredentialSection icon={Database} title="Supabase" tone="bg-emerald-50 text-emerald-600" fields={SB_FIELDS} values={settings} onChange={update} />

      <div className="grid sm:grid-cols-2 gap-3">
        {[
          { href: 'https://dash.cloudflare.com/profile/api-tokens', icon: Cloud, tone: 'text-orange-500', title: 'Create Cloudflare API token', hint: 'dash.cloudflare.com → My Profile → API Tokens' },
          { href: 'https://supabase.com/dashboard/project/_/settings/api', icon: Database, tone: 'text-emerald-500', title: 'Supabase API settings', hint: 'Dashboard → Settings → API keys' },
        ].map((l) => {
          const Icon = l.icon;
          return (
            <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl bg-white border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition-all">
              <Icon size={16} className={l.tone} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-gray-900">{l.title}</div>
                <div className="text-[11px] text-gray-500">{l.hint}</div>
              </div>
              <ArrowUpRight size={13} className="text-gray-300" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
