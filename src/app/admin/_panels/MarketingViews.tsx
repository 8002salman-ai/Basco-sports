'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  MagnifyingGlass, Megaphone, TrendUp, PaperPlaneRight, Users as UsersIcon,
  CheckCircle, WarningCircle, Copy, Plus, ArrowUpRight, Funnel,
} from '@phosphor-icons/react';
import {
  Badge, Button, Card, DemoNotice, Drawer, EmptyState, Field, INPUT_CLS, KeyValue,
  Notice, PageHeader, ProgressBar, ScoreRing, SELECT_CLS, SectionTitle, StatCard, StatGrid,
  Tabs, TEXTAREA_CLS, Toolbar,
} from '@/components/admin/ui';
import { DataTable, type Column } from '@/components/admin/table';
import { BarChart, Donut } from '@/components/admin/charts';
import {
  adsense, analyzeSeo, emailCampaigns, emailProviderStatus, emailRouting,
  googleAds, internalLinkSuggestions, marketDemand, metaAds, seoPages, socialPosts,
  trafficSeries, trafficSources, trafficTotals,
} from '@/features/admin/demo/marketing';
import { crmLeads, formatDate, NEWSLETTER_SUBSCRIBERS, type DemoLead, type LeadStatus } from '@/features/admin/demo/data';
import { useAdminTable } from '@/hooks/use-admin-table';

// ---------------------------------------------------------------------------
// SEO Engine
// ---------------------------------------------------------------------------

const SEO_TABS = [
  { key: 'seo', label: 'SEO' },
  { key: 'schema', label: 'Schema' },
  { key: 'social', label: 'Social' },
  { key: 'content', label: 'Content' },
  { key: 'analysis', label: 'Analysis' },
  { key: 'preview', label: 'Preview' },
] as const;

export function SeoEngineView() {
  const [pageId, setPageId] = useState(seoPages[0].id);
  const [tab, setTab] = useState<(typeof SEO_TABS)[number]['key']>('seo');
  const [copied, setCopied] = useState<string | null>(null);

  const page = seoPages.find((p) => p.id === pageId) ?? seoPages[0];
  const [seo, setSeo] = useState(page.seo);

  const analysis = useMemo(
    () =>
      analyzeSeo({
        title: seo.title,
        metaDescription: seo.metaDescription,
        focusKeyword: seo.focusKeyword,
        body: `${seo.metaDescription} ${seo.secondaryKeywords.join(' ')} ${seo.focusKeyword} ${seo.focusKeyword}`,
        imageCount: 4,
        imagesWithAlt: 4,
      }),
    [seo]
  );

  const links = internalLinkSuggestions(seoPages.findIndex((p) => p.id === pageId));
  const jsonLd = `{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "${seo.title.split('|')[0].trim()}",
  "description": "${seo.metaDescription.slice(0, 90)}…",
  "brand": { "@type": "Brand", "name": "Basco Sports" },
  "url": "${seo.canonicalUrl}"
}`;

  const copy = (label: string, value: string) => {
    void navigator.clipboard?.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1600);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="SEO Engine"
        subtitle="Per-page SEO, structured data, social cards and a live analysis that runs locally."
        actions={
          <select className={SELECT_CLS} value={pageId} onChange={(e) => { const next = seoPages.find((p) => p.id === e.target.value)!; setPageId(next.id); setSeo(next.seo); }} aria-label="Choose page">
            {seoPages.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        }
      />
      <DemoNotice>The analysis below is computed from the fields on screen — real checks, no provider call.</DemoNotice>

      <div className="grid lg:grid-cols-[1fr_300px] gap-4 items-start">
        <Card bodyClass="p-0">
          <div className="px-3"><Tabs tabs={SEO_TABS.map((t) => ({ ...t }))} active={tab} onChange={(k) => setTab(k as typeof tab)} /></div>
          <div className="p-4 space-y-4">
            {tab === 'seo' && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field label="Title" hint={`${analysis.titleLength} characters — aim for 45–60.`}>
                    <input className={INPUT_CLS} value={seo.title} onChange={(e) => setSeo({ ...seo, title: e.target.value })} />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Meta description" hint={`${analysis.metaLength} characters — aim for 120–158.`}>
                    <textarea rows={3} className={TEXTAREA_CLS} value={seo.metaDescription} onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })} />
                  </Field>
                </div>
                <Field label="Focus keyword"><input className={INPUT_CLS} value={seo.focusKeyword} onChange={(e) => setSeo({ ...seo, focusKeyword: e.target.value })} /></Field>
                <Field label="Slug"><input className={INPUT_CLS} value={seo.slug} onChange={(e) => setSeo({ ...seo, slug: e.target.value })} /></Field>
                <Field label="Canonical URL"><input className={INPUT_CLS} value={seo.canonicalUrl} onChange={(e) => setSeo({ ...seo, canonicalUrl: e.target.value })} /></Field>
                <Field label="Keywords" hint="Comma separated."><input className={INPUT_CLS} value={seo.keywords.join(', ')} onChange={(e) => setSeo({ ...seo, keywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean) })} /></Field>
                <Field label="Image ALT"><input className={INPUT_CLS} value={seo.imageAlt} onChange={(e) => setSeo({ ...seo, imageAlt: e.target.value })} /></Field>
                <Field label="Image title"><input className={INPUT_CLS} value={seo.imageTitle} onChange={(e) => setSeo({ ...seo, imageTitle: e.target.value })} /></Field>
              </div>
            )}

            {tab === 'schema' && (
              <div>
                <SectionTitle>JSON-LD structured data</SectionTitle>
                <pre className="whitespace-pre-wrap rounded-xl bg-gray-50 border border-gray-100 p-3 text-[11px] text-gray-700 font-mono">{jsonLd}</pre>
                <Button variant="secondary" className="mt-3" onClick={() => copy('JSON-LD', jsonLd)}>
                  <Copy size={14} weight="bold" /> {copied === 'JSON-LD' ? 'Copied' : 'Copy JSON-LD'}
                </Button>
              </div>
            )}

            {tab === 'social' && (
              <div className="space-y-3">
                <Notice tone="blue">Social cards inherit the title and description above unless you override them per network.</Notice>
                {['Open Graph', 'Twitter / X', 'Pinterest'].map((net) => (
                  <div key={net} className="rounded-xl border border-gray-100 p-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{net}</div>
                    <div className="mt-1.5 text-[13px] text-blue-700 leading-snug">{seo.title}</div>
                    <div className="text-[12px] text-gray-600">{seo.metaDescription}</div>
                    <div className="text-[11px] text-gray-400 mt-1">bascosports.com{seo.canonicalUrl.replace('https://bascosports.com', '')}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'content' && (
              <div className="space-y-3">
                <SectionTitle>AI content fields</SectionTitle>
                {[
                  { label: 'Premium title', value: seo.title.replace('| Basco Sports', '— Basco Selected') },
                  { label: 'Short description', value: seo.metaDescription.slice(0, 120) },
                  { label: 'Care instructions', value: 'Wipe clean with a damp cloth; air dry away from direct heat.' },
                  { label: 'Warranty', value: 'Statutory guarantees apply in your market.' },
                ].map((f) => (
                  <div key={f.label} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{f.label}</span>
                      <button type="button" className="text-[11px] text-blue-600 hover:underline" onClick={() => copy(f.label, f.value)}>{copied === f.label ? 'Copied' : 'Copy'}</button>
                    </div>
                    <p className="mt-1.5 text-[12px] text-gray-700">{f.value}</p>
                  </div>
                ))}
              </div>
            )}

            {tab === 'analysis' && (
              <div className="space-y-4">
                <div className="flex items-start gap-5 flex-wrap">
                  <ScoreRing value={analysis.overall} label="Overall" size={84} />
                  <ScoreRing value={analysis.readability} label="Readability" size={66} />
                  <ScoreRing value={Math.min(100, analysis.keywordDensity * 40)} label="Density" size={66} />
                </div>
                <ul className="space-y-1.5">
                  {analysis.issues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px]">
                      <span className={issue.type === 'good' ? 'text-emerald-500' : issue.type === 'warning' ? 'text-amber-500' : 'text-rose-500'}>
                        {issue.type === 'good' ? <CheckCircle size={13} weight="fill" /> : <WarningCircle size={13} weight="fill" />}
                      </span>
                      <span className="text-gray-700">{issue.msg}</span>
                    </li>
                  ))}
                </ul>
                <div>
                  <SectionTitle>Internal link suggestions</SectionTitle>
                  <ul className="space-y-1.5">
                    {links.map((l) => (
                      <li key={l.id} className="text-[12px] text-gray-600">
                        <span className="font-mono text-[11px] text-gray-400">{l.from}</span> → <span className="text-blue-600">{l.to}</span> <span className="text-gray-400">(“{l.anchor}”)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {tab === 'preview' && (
              <div className="space-y-3">
                <SectionTitle>SERP preview</SectionTitle>
                <div className="rounded-xl border border-gray-100 p-3">
                  <div className="text-[12px] text-emerald-700">bascosports.com › {seo.slug || 'home'}</div>
                  <div className="text-[16px] text-blue-700 leading-snug mt-0.5">{seo.title}</div>
                  <div className="text-[12px] text-gray-600 mt-0.5">{seo.metaDescription}</div>
                </div>
                <SectionTitle>Social card preview</SectionTitle>
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="h-24 bg-gradient-to-br from-slate-800 to-slate-600" />
                  <div className="p-3">
                    <div className="text-[10px] uppercase tracking-wider text-gray-400">bascosports.com</div>
                    <div className="text-[13px] font-semibold text-gray-900 mt-0.5">{seo.title}</div>
                    <div className="text-[12px] text-gray-600">{seo.metaDescription}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4 lg:sticky lg:top-4">
          <Card title="Tracked pages" bodyClass="p-3">
            <div className="space-y-2">
              {seoPages.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setPageId(p.id); setSeo(p.seo); }}
                  className={`w-full text-left rounded-lg px-2.5 py-2 transition-colors ${p.id === pageId ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="text-[12px] font-medium text-gray-800 truncate">{p.label}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <ProgressBar value={p.score} className="flex-1" tone={p.score >= 80 ? 'emerald' : p.score >= 60 ? 'amber' : 'rose'} />
                    <span className="text-[10px] font-bold text-gray-500">{p.score}</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
          <Card title="Search performance" bodyClass="p-3">
            <KeyValue
              items={[
                { label: 'Clicks (30d)', value: page.clicks30d.toLocaleString('en-US') },
                { label: 'Impressions', value: page.impressions30d.toLocaleString('en-US') },
                { label: 'CTR', value: `${((page.clicks30d / page.impressions30d) * 100).toFixed(1)}%` },
              ]}
            />
            <p className="mt-2 text-[11px] text-gray-400">Demo figures — live search data needs Search Console access in Basco’s own environment.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Marketing generator
// ---------------------------------------------------------------------------

const GEN_TABS = ['google-ads', 'meta-ads', 'social', 'email', 'video'] as const;

export function MarketingGenView() {
  const [tab, setTab] = useState<(typeof GEN_TABS)[number]>('google-ads');
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (label: string, value: string) => {
    void navigator.clipboard?.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Marketing Gen" subtitle="Ad, social, email and video copy generators with live previews." />
      <DemoNotice>Drafts below are local samples. Wiring a provider turns generation on without changing this layout.</DemoNotice>

      <Card bodyClass="p-0">
        <div className="px-3">
          <Tabs
            tabs={[
              { key: 'google-ads', label: 'Google Ads' },
              { key: 'meta-ads', label: 'Meta Ads' },
              { key: 'social', label: 'Social posts' },
              { key: 'email', label: 'Email' },
              { key: 'video', label: 'Video & scripts' },
            ]}
            active={tab}
            onChange={(k) => setTab(k as typeof tab)}
          />
        </div>

        <div className="p-4 space-y-3">
          {tab === 'google-ads' && (
            <>
              <p className="text-[12px] text-gray-500">Headlines ≤ 30 characters, descriptions ≤ 90. Preview shows the desktop SERP layout.</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {googleAds.map((ad) => (
                  <div key={ad.id} className="rounded-xl border border-gray-100 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Headline</div>
                    <div className="text-[12px] text-gray-800">{ad.headline} <span className={`text-[10px] ${ad.headline.length > 30 ? 'text-rose-600' : 'text-gray-400'}`}>({ad.headline.length}/30)</span></div>
                    <div className="mt-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Description</div>
                    <div className="text-[12px] text-gray-700">{ad.description} <span className={`text-[10px] ${ad.description.length > 90 ? 'text-rose-600' : 'text-gray-400'}`}>({ad.description.length}/90)</span></div>
                    <div className="mt-3 rounded-lg bg-gray-50 p-2">
                      <div className="text-[10px] text-emerald-700">Sponsored</div>
                      <div className="text-[12px] text-blue-700">{ad.headline}</div>
                      <div className="text-[11px] text-gray-600">bascosports.com{ad.url}</div>
                    </div>
                    <Button variant="ghost" className="mt-2 h-8 px-2" onClick={() => copy(ad.id, `${ad.headline}\n${ad.description}`)}>
                      <Copy size={12} weight="bold" /> {copied === ad.id ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'meta-ads' && (
            <div className="grid sm:grid-cols-2 gap-3">
              {metaAds.map((ad) => (
                <div key={ad.id} className="rounded-xl border border-gray-100 p-3">
                  <div className="text-[13px] font-semibold text-gray-900">{ad.headline}</div>
                  <p className="mt-1 text-[12px] text-gray-600">{ad.primary}</p>
                  <div className="mt-3 rounded-lg border border-gray-100 overflow-hidden">
                    <div className="h-28 bg-gradient-to-br from-slate-800 to-slate-600" />
                    <div className="p-2.5">
                      <div className="text-[10px] uppercase tracking-wider text-gray-400">bascosports.com</div>
                      <div className="text-[12px] font-semibold text-gray-900">{ad.headline}</div>
                      <div className="text-[11px] text-gray-500">{ad.primary}</div>
                      <div className="mt-2 inline-flex h-7 px-3 rounded-md bg-gray-100 items-center text-[11px] font-semibold text-gray-700">{ad.cta}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-gray-400">Audience: {ad.audience}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'social' && (
            <div className="grid sm:grid-cols-2 gap-3">
              {socialPosts.map((p) => (
                <div key={p.id} className="rounded-xl border border-gray-100 p-3">
                  <div className="flex items-center justify-between">
                    <Badge tone="violet">{p.platform}</Badge>
                    <button type="button" className="text-[11px] text-blue-600 hover:underline" onClick={() => copy(p.id, `${p.copy} ${p.hashtags.join(' ')}`)}>{copied === p.id ? 'Copied' : 'Copy'}</button>
                  </div>
                  <p className="mt-2 text-[12px] text-gray-700">{p.copy}</p>
                  <div className="mt-2 flex flex-wrap gap-1">{p.hashtags.map((h) => <span key={h} className="text-[10px] text-blue-600">{h}</span>)}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'email' && (
            <div className="space-y-3">
              {emailCampaigns.map((c) => (
                <div key={c.id} className="rounded-xl border border-gray-100 p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold text-gray-900">{c.name}</span>
                    <Badge tone={c.status === 'sent' ? 'green' : c.status === 'scheduled' ? 'blue' : 'gray'}>{c.status}</Badge>
                  </div>
                  <div className="mt-2 grid sm:grid-cols-2 gap-2">
                    <div className="rounded-lg bg-gray-50 p-2"><div className="text-[10px] uppercase tracking-wider text-gray-400">Subject A</div><div className="text-[12px] text-gray-700">{c.subjectA}</div></div>
                    <div className="rounded-lg bg-gray-50 p-2"><div className="text-[10px] uppercase tracking-wider text-gray-400">Subject B</div><div className="text-[12px] text-gray-700">{c.subjectB}</div></div>
                  </div>
                  <div className="mt-2 flex gap-4 text-[11px] text-gray-500">
                    <span>{c.sent.toLocaleString('en-US')} sent</span>
                    <span>{c.opens} opens</span>
                    <span>{c.clicks} clicks</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'video' && (
            <div className="rounded-xl border border-gray-100 p-3">
              <SectionTitle>YouTube script</SectionTitle>
              <ol className="space-y-2 text-[12px] text-gray-700 list-decimal pl-5">
                <li>0–3s: boot close-up on grass, text “Built for the beautiful game”.</li>
                <li>3–8s: slow-motion studs biting into firm ground.</li>
                <li>8–15s: player changing direction, product name overlay.</li>
                <li>15–20s: logo and “Shop football” call to action.</li>
              </ol>
              <Notice tone="blue">Media Studio image/video generation stays off in this environment — it needs an image-capable provider key.</Notice>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Marketing & traffic
// ---------------------------------------------------------------------------

export function MarketingTrafficView() {
  return (
    <div className="space-y-4">
      <PageHeader title="Marketing & Traffic" subtitle="First-party traffic, acquisition mix and monetisation status." />
      <DemoNotice>Traffic figures are local demo data — first-party analytics needs the storefront’s own event pipeline wired up.</DemoNotice>

      <StatGrid>
        <StatCard label="Sessions · 30d" value={trafficTotals.sessions30d.toLocaleString('en-US')} delta="+8.2%" hint="vs previous 30 days" icon={<TrendUp size={15} weight="bold" />} tone="blue" />
        <StatCard label="Users · 30d" value={trafficTotals.users30d.toLocaleString('en-US')} hint="unique visitors" icon={<UsersIcon size={15} weight="bold" />} tone="violet" />
        <StatCard label="Bounce rate" value={`${trafficTotals.bounceRate}%`} hint={`avg session ${trafficTotals.avgSessionSeconds}s`} icon={<Funnel size={15} weight="bold" />} tone="amber" />
        <StatCard label="Conversions · 30d" value={trafficTotals.conversions30d} hint={`${((trafficTotals.conversions30d / trafficTotals.sessions30d) * 100).toFixed(2)}% of sessions`} icon={<CheckCircle size={15} weight="bold" />} tone="emerald" />
      </StatGrid>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" title="Sessions trend">
          <BarChart data={trafficSeries} height={170} />
        </Card>
        <Card title="Acquisition mix">
          <Donut segments={trafficSources} centerLabel="Sessions" centerValue={trafficTotals.sessions30d.toLocaleString('en-US')} />
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="AdSense earnings" actions={<Badge tone={adsense.configured ? 'green' : 'gray'}>{adsense.configured ? 'linked' : 'not linked'}</Badge>}>
          <div className="text-[22px] font-bold text-gray-900">${adsense.last30d.toFixed(2)}</div>
          <div className="text-[11px] text-gray-500">last 30 days · RPM ${adsense.rpm.toFixed(2)}</div>
          <div className="mt-3"><Notice tone="amber">{adsense.note}</Notice></div>
        </Card>

        <Card title="Market demand" bodyClass="p-0">
          <div className="divide-y divide-gray-50">
            {marketDemand.map((m) => (
              <div key={m.id} className="px-4 py-2.5 flex items-center gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium text-gray-800">{m.keyword}</div>
                  <div className="text-[11px] text-gray-400">{m.market}</div>
                </div>
                <span className="text-[11px] text-gray-600">{m.volume.toLocaleString('en-US')}</span>
                <Badge tone={m.competition === 'High' ? 'red' : m.competition === 'Medium' ? 'amber' : 'green'}>{m.competition}</Badge>
                <span className="text-[11px] text-gray-400">${m.cpc.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Email marketing
// ---------------------------------------------------------------------------

export function EmailMarketingView() {
  return (
    <div className="space-y-4">
      <PageHeader title="Email Marketing" subtitle="Sending setup, routing addresses and the written email playbook." />
      <DemoNotice>No email provider is linked in this environment — nothing on this screen sends mail.</DemoNotice>

      <StatGrid cols={3}>
        <StatCard label="Provider" value={emailProviderStatus.provider} hint={emailProviderStatus.connected ? 'connected' : 'not connected'} icon={<PaperPlaneRight size={15} weight="bold" />} tone="blue" />
        <StatCard label="Subscribers" value={NEWSLETTER_SUBSCRIBERS.toLocaleString('en-US')} hint="newsletter list" icon={<UsersIcon size={15} weight="bold" />} tone="violet" />
        <StatCard label="Campaigns" value={emailCampaigns.length} hint={`${emailCampaigns.filter((c) => c.status === 'sent').length} sent`} icon={<Megaphone size={15} weight="bold" />} tone="emerald" />
      </StatGrid>

      <Card title="Routing addresses" actions={<Button variant="secondary"><Plus size={14} weight="bold" /> Add address</Button>} bodyClass="p-0">
        <div className="divide-y divide-gray-50">
          {emailRouting.map((r) => (
            <div key={r.id} className="px-4 py-3 flex items-center gap-3 flex-wrap">
              <span className="font-mono text-[12px] text-gray-800">{r.address}</span>
              <span className="text-gray-300">→</span>
              <span className="text-[12px] text-gray-600">{r.forwardsTo}</span>
              <div className="flex-1" />
              <Badge tone={r.verified ? 'green' : 'amber'}>{r.verified ? 'verified' : 'pending'}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Email playbook">
        <ol className="space-y-2 text-[12px] text-gray-700 list-decimal pl-5">
          <li>Transactional mail (order confirmation, review requests) always sends — never gated on marketing consent.</li>
          <li>Marketing mail requires an explicit opt-in and honours a one-click unsubscribe.</li>
          <li>No invented scarcity, no fake countdowns, no purchased lists.</li>
          <li>Every campaign names the sender and the physical returns address.</li>
        </ol>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CRM
// ---------------------------------------------------------------------------

const LEAD_TONE: Record<LeadStatus, 'gray' | 'blue' | 'violet' | 'green' | 'red'> = {
  new: 'blue',
  contacted: 'violet',
  quoted: 'gray',
  won: 'green',
  lost: 'red',
};

export function CrmView() {
  const { rows, save: upsert } = useAdminTable<DemoLead>('leads', crmLeads);
  const [status, setStatus] = useState<'all' | LeadStatus>('all');
  const [open, setOpen] = useState<DemoLead | null>(null);
  const [note, setNote] = useState('');

  const shown = status === 'all' ? rows : rows.filter((l) => l.status === status);
  const current = open ? rows.find((l) => l.id === open.id) ?? open : null;

  const columns: Column<DemoLead>[] = [
    { key: 'name', header: 'Lead', cell: (l) => <div className="min-w-0"><div className="font-medium text-gray-900 truncate">{l.name}</div><div className="text-[10px] text-gray-400 truncate">{l.email}</div></div>, sortValue: (l) => l.name },
    { key: 'source', header: 'Source', cell: (l) => <Badge tone="blue">{l.source}</Badge>, sortValue: (l) => l.source },
    { key: 'interest', header: 'Interest', cell: (l) => <span className="text-gray-600 truncate block max-w-[200px]">{l.interest}</span>, sortValue: (l) => l.interest },
    { key: 'status', header: 'Status', cell: (l) => <Badge tone={LEAD_TONE[l.status]}>{l.status}</Badge>, sortValue: (l) => l.status },
    { key: 'created', header: 'Captured', cell: (l) => <span className="text-gray-500">{formatDate(l.createdAt)}</span>, sortValue: (l) => l.createdAt },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="CRM (Leads)" subtitle="Leads captured by storefront conversion tools — welcome popup, WhatsApp, chat and newsletter." />
      <DemoNotice>Lead intake is disabled in this environment; the pipeline, filters and lead drawer behave as they do live.</DemoNotice>

      <StatGrid cols={4}>
        {(['new', 'contacted', 'quoted', 'won'] as LeadStatus[]).map((s) => (
          <StatCard key={s} label={s} value={rows.filter((l) => l.status === s).length} hint="leads" icon={<UsersIcon size={15} weight="bold" />} tone={s === 'won' ? 'emerald' : s === 'new' ? 'blue' : 'violet'} />
        ))}
      </StatGrid>

      <Card>
        <Toolbar className="mb-3">
          <select className={SELECT_CLS} value={status} onChange={(e) => setStatus(e.target.value as 'all' | LeadStatus)} aria-label="Filter leads">
            {['all', 'new', 'contacted', 'quoted', 'won', 'lost'].map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>)}
          </select>
        </Toolbar>
        <DataTable
          rows={shown}
          columns={columns}
          perPage={10}
          onRowClick={(l) => { setOpen(l); setNote(l.note || ''); }}
          empty={{ title: 'No leads in this state', hint: 'Captured leads appear here automatically.', icon: <UsersIcon size={16} /> }}
          rowActions={(l) => (
            <button type="button" className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100" aria-label={`Open ${l.name}`} onClick={() => { setOpen(l); setNote(l.note || ''); }} title="Open lead">
              <ArrowUpRight size={14} />
            </button>
          )}
        />
      </Card>

      <Drawer
        open={!!current}
        onClose={() => setOpen(null)}
        title={current?.name ?? 'Lead'}
        footer={current && <Button onClick={() => { upsert({ ...current, note }); setOpen(null); }}>Save note</Button>}
      >
        {current && (
          <div className="space-y-4">
            <KeyValue
              items={[
                { label: 'Email', value: current.email },
                { label: 'Phone', value: current.phone || '—' },
                { label: 'Source', value: current.source },
                { label: 'Captured', value: formatDate(current.createdAt) },
              ]}
            />
            <Field label="Interest"><div className="text-[13px] text-gray-700">{current.interest}</div></Field>
            <Field label="Status">
              <select className={SELECT_CLS + ' w-full'} value={current.status} onChange={(e) => { const next = { ...current, status: e.target.value as LeadStatus }; upsert(next); setOpen(next); }}>
                {(['new', 'contacted', 'quoted', 'won', 'lost'] as LeadStatus[]).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Note"><textarea rows={4} className={TEXTAREA_CLS} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
            <Link href="/admin/email-marketing" className="text-[12px] text-blue-600 hover:underline inline-flex items-center gap-1">Email settings <ArrowUpRight size={12} weight="bold" /></Link>
          </div>
        )}
      </Drawer>
    </div>
  );
}
