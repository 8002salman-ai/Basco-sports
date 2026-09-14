/**
 * Basco Sports – Marketing / SEO / traffic demo data + real local SEO analysis.
 *
 * `analyzeSeo` is genuine logic (no provider, no network): title/meta length
 * checks, keyword density, readability and image-ALT coverage. The rest of the
 * module is fixture data for the marketing screens.
 */
import { products as catalogProducts } from '@/data/products';
import type { SEOData, SEOScore } from '@/features/ai/types';
import { daysAgo } from './data';

export interface SeoPage {
  id: string;
  path: string;
  label: string;
  seo: SEOData;
  score: number;
  clicks30d: number;
  impressions30d: number;
}

function pageSeo(index: number): SEOData {
  const p = catalogProducts[index % catalogProducts.length];
  return {
    title: `${p.name} | Basco Sports`,
    metaDescription: `${p.description.slice(0, 130)}… Shop ${p.brand} at Basco Sports with tracked worldwide delivery.`,
    keywords: [p.category, p.brand.toLowerCase(), p.name.toLowerCase().split(' ')[0]],
    slug: p.slug,
    canonicalUrl: `https://bascosports.com/product/${p.slug}`,
    focusKeyword: `${p.category} gear`,
    secondaryKeywords: [`${p.brand} ${p.category}`, `buy ${p.category} online`],
    imageAlt: p.name,
    imageTitle: p.name,
    imageCaption: `${p.name} by ${p.brand}`,
  };
}

export const seoPages: SeoPage[] = [
  {
    id: 'seo-home',
    path: '/',
    label: 'Homepage',
    seo: {
      title: 'Basco Sports — Premium Performance Gear',
      metaDescription: 'Curated football, cricket, running and gym gear. Tracked worldwide delivery, duties shown before payment, honest reviews only.',
      keywords: ['sports gear', 'football boots', 'cricket equipment'],
      slug: '',
      canonicalUrl: 'https://bascosports.com/',
      focusKeyword: 'performance sports gear',
      secondaryKeywords: ['premium football boots', 'cricket kit online'],
      imageAlt: 'Basco Sports hero',
      imageTitle: 'Basco Sports',
      imageCaption: 'Basco Sports performance gear',
    },
    score: 88,
    clicks30d: 1840,
    impressions30d: 41200,
  },
  ...catalogProducts.slice(0, 8).map((p: (typeof catalogProducts)[number], i: number) => ({
    id: `seo-${p.id}`,
    path: `/product/${p.slug}`,
    label: p.name,
    seo: pageSeo(i),
    score: 58 + ((i * 7) % 38),
    clicks30d: 120 + ((i * 91) % 900),
    impressions30d: 3200 + ((i * 811) % 24000),
  })),
];

export interface SeoInput {
  title: string;
  metaDescription: string;
  focusKeyword: string;
  body: string;
  imageCount: number;
  imagesWithAlt: number;
}

/** Deterministic local SEO scoring — the same checks an AI pass would report. */
export function analyzeSeo(input: SeoInput): SEOScore {
  const issues: SEOScore['issues'] = [];
  const titleLength = input.title.trim().length;
  const metaLength = input.metaDescription.trim().length;
  const wordCount = input.body.trim() ? input.body.trim().split(/\s+/).length : 0;
  const keyword = input.focusKeyword.trim().toLowerCase();
  const keywordHits = keyword ? (input.body.toLowerCase().match(new RegExp(escapeRegExp(keyword), 'g')) || []).length : 0;
  const keywordDensity = wordCount ? Math.round((keywordHits / wordCount) * 1000) / 10 : 0;
  const sentences = input.body.split(/[.!?]+/).filter((s) => s.trim().length > 0).length || 1;
  const avgWordsPerSentence = wordCount / sentences;

  // Readability: ~15 words/sentence reads well for commerce copy.
  const readability = clamp(Math.round(100 - Math.abs(avgWordsPerSentence - 15) * 4));
  const titleScore = titleLength === 0 ? 0 : titleLength >= 45 && titleLength <= 60 ? 100 : clamp(100 - Math.abs(55 - titleLength) * 3);
  const metaScore = metaLength === 0 ? 0 : metaLength >= 120 && metaLength <= 158 ? 100 : clamp(100 - Math.abs(139 - metaLength) * 2);
  const densityScore = keywordDensity === 0 ? 0 : keywordDensity >= 0.5 && keywordDensity <= 2.5 ? 100 : keywordDensity < 0.5 ? clamp(keywordDensity * 160) : clamp(100 - (keywordDensity - 2.5) * 25);
  const missingAlt = Math.max(0, input.imageCount - input.imagesWithAlt);
  const altScore = input.imageCount === 0 ? 100 : clamp(100 - (missingAlt / input.imageCount) * 100);

  if (!titleLength) issues.push({ type: 'error', msg: 'Title tag is empty.' });
  else if (titleLength < 45) issues.push({ type: 'warning', msg: `Title is short (${titleLength} chars) — aim for 45–60.` });
  else if (titleLength > 60) issues.push({ type: 'warning', msg: `Title is ${titleLength} chars — Google truncates around 60.` });
  else issues.push({ type: 'good', msg: `Title length is ideal (${titleLength} chars).` });

  if (!metaLength) issues.push({ type: 'error', msg: 'Meta description is empty.' });
  else if (metaLength < 120) issues.push({ type: 'warning', msg: `Meta description is short (${metaLength} chars) — aim for 120–158.` });
  else if (metaLength > 158) issues.push({ type: 'warning', msg: `Meta description is ${metaLength} chars — it will be cut off.` });
  else issues.push({ type: 'good', msg: `Meta description length is ideal (${metaLength} chars).` });

  if (!keyword) issues.push({ type: 'error', msg: 'No focus keyword set.' });
  else if (keywordHits === 0) issues.push({ type: 'error', msg: `Focus keyword “${input.focusKeyword}” never appears in the body copy.` });
  else if (keywordDensity < 0.5) issues.push({ type: 'warning', msg: `Keyword density is low (${keywordDensity}%) — aim for 0.5–2.5%.` });
  else if (keywordDensity > 2.5) issues.push({ type: 'warning', msg: `Keyword density is high (${keywordDensity}%) — reads as stuffing.` });
  else issues.push({ type: 'good', msg: `Keyword density is healthy (${keywordDensity}%).` });

  if (missingAlt > 0) issues.push({ type: 'warning', msg: `${missingAlt} of ${input.imageCount} images are missing ALT text.` });
  else if (input.imageCount > 0) issues.push({ type: 'good', msg: `All ${input.imageCount} images have ALT text.` });

  const overall = clamp(Math.round(titleScore * 0.2 + metaScore * 0.2 + densityScore * 0.2 + readability * 0.2 + altScore * 0.2));
  return { overall, readability, keywordDensity, metaLength, titleLength, missingAlt, issues };
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function internalLinkSuggestions(index: number) {
  const p = catalogProducts[index % catalogProducts.length];
  return [
    { id: 'il-1', from: '/journal/how-to-choose-football-boots', to: `/product/${p.slug}`, anchor: p.name },
    { id: 'il-2', from: '/category/' + p.category, to: `/product/${p.slug}`, anchor: `${p.brand} ${p.category}` },
    { id: 'il-3', from: '/shop', to: `/category/${p.category}`, anchor: `${p.category} collection` },
  ];
}

// ---------------------------------------------------------------------------
// Marketing generator + traffic
// ---------------------------------------------------------------------------

export const googleAds = [
  { id: 'ga-1', headline: 'Premium Football Boots', description: 'Carbon plate, locked-in fit. Tracked worldwide delivery.', url: '/category/football' },
  { id: 'ga-2', headline: 'English Willow Bats', description: 'Grade 1 willow, hand-pressed. Built for long innings.', url: '/category/cricket' },
  { id: 'ga-3', headline: 'Strength Gear, No Hype', description: 'Leather belts and bare steel. Earns its rack space.', url: '/category/gym' },
];

export const metaAds = [
  { id: 'ma-1', headline: 'Built for the beautiful game', primary: 'Match-day boots tested on firm ground. Duties shown before you pay.', cta: 'Shop now', audience: 'Football players 18–34, UK/DE' },
  { id: 'ma-2', headline: 'Gear that earns its place', primary: 'Bare steel and full-grain leather — no plastic, no filler.', cta: 'Shop gym', audience: 'Gym & training 20–40' },
];

export const socialPosts = [
  { id: 'sp-1', platform: 'Instagram', copy: 'New season, same intent: gear built for the long run. 🔗 in bio.', hashtags: ['#BascoSports', '#Football'] },
  { id: 'sp-2', platform: 'X', copy: 'We do not invent ratings. Honest reviews only — always. 1/3', hashtags: ['#BuildInPublic'] },
  { id: 'sp-3', platform: 'LinkedIn', copy: 'How we source sports gear without publishing scraped supplier copy.', hashtags: ['#Ecommerce'] },
  { id: 'sp-4', platform: 'TikTok', copy: 'Script: 0–3s boot close-up, 3–8s stud pattern, 8–15s CTA.', hashtags: ['#FootballTok'] },
];

export const emailCampaigns = [
  { id: 'em-1', name: 'Welcome series — 15% off', subjectA: 'Welcome to Basco — here is 15% off', subjectB: 'Your 15% off is inside', sent: 1842, opens: 742, clicks: 188, status: 'sent' },
  { id: 'em-2', name: 'Back to training', subjectA: 'Training season starts now', subjectB: 'Kit up for training season', sent: 0, opens: 0, clicks: 0, status: 'draft' },
  { id: 'em-3', name: 'Cricket season launch', subjectA: 'Grade 1 willow, back in stock', subjectB: 'The willow you asked for', sent: 0, opens: 0, clicks: 0, status: 'scheduled' },
];

export const emailRouting = [
  { id: 'er-1', address: 'sales@bascosports.com', forwardsTo: 'orders@bascosports.com', verified: true },
  { id: 'er-2', address: 'support@bascosports.com', forwardsTo: 'ops@bascosports.com', verified: true },
  { id: 'er-3', address: 'press@bascosports.com', forwardsTo: 'owner@bascosports.com', verified: false },
];

export const emailProviderStatus = {
  connected: false,
  provider: 'Not linked',
  note: 'Demo only — Basco\u2019s own sending key is added in its environment later.',
};

export const trafficSources = [
  { id: 'ts-1', label: 'Organic search', value: 42, color: '#3b82f6' },
  { id: 'ts-2', label: 'Direct', value: 26, color: '#8b5cf6' },
  { id: 'ts-3', label: 'Social', value: 19, color: '#10b981' },
  { id: 'ts-4', label: 'Paid', value: 13, color: '#f59e0b' },
];

export const trafficTotals = {
  sessions30d: 48_210,
  users30d: 36_940,
  bounceRate: 38.4,
  avgSessionSeconds: 142,
  conversions30d: 214,
};

/** 30 days of sessions, deterministic. */
export const trafficSeries: { label: string; value: number }[] = Array.from({ length: 30 }, (_, i) => ({
  label: `${i + 1}`,
  value: 980 + ((i * 137) % 620) + (i % 7 === 0 ? 420 : 0),
}));

export const adsense = {
  configured: false,
  last30d: 0,
  rpm: 0,
  note: 'AdSense is not linked in this environment. Enable it with Basco\u2019s own publisher ID.',
};

export const marketDemand = [
  { id: 'md-1', market: 'United Kingdom', keyword: 'football boots', volume: 14_800, competition: 'High', cpc: 0.82 },
  { id: 'md-2', market: 'Germany', keyword: 'fussballschuhe', volume: 9_240, competition: 'Medium', cpc: 0.71 },
  { id: 'md-3', market: 'United States', keyword: 'cricket bat', volume: 6_100, competition: 'Low', cpc: 1.14 },
  { id: 'md-4', market: 'Norway', keyword: 'løpejakke', volume: 1_980, competition: 'Low', cpc: 0.66 },
];
