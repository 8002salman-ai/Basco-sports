/**
 * Basco Sports – AI Studio demo data + local generators.
 *
 * The AI screens in the design clone never call a provider: `buildLocalExtraction`
 * and the variant math below are deterministic local equivalents so the wizards
 * are genuinely explorable with no keys and no network. Swapping in
 * `@/features/ai/client` later is what makes them live.
 */
import { products as catalogProducts } from '@/data/products';
import type { AIExtractedProduct, AIExtractedVariant, ImportHistoryEntry } from '@/features/ai/types';
import { daysAgo } from './data';

export type Confidence = 'insufficient_data' | 'possible' | 'promising' | 'strong';

export const CONFIDENCE_TONE: Record<Confidence, 'gray' | 'amber' | 'blue' | 'green'> = {
  insufficient_data: 'gray',
  possible: 'amber',
  promising: 'blue',
  strong: 'green',
};

export const importHistory: ImportHistoryEntry[] = [
  { id: 'imp-1', source: 'aliexpress.com/item/1005006123', sourceType: 'url', date: daysAgo(1), provider: 'OpenRouter', model: 'minimax/minimax-m3:free', productTitle: 'Carbon FG football boot', status: 'success', importTime: 18.4 },
  { id: 'imp-2', source: 'cjdropshipping.com/product/7781', sourceType: 'url', date: daysAgo(2), provider: 'Gemini', model: 'gemini-3.5-flash', productTitle: 'English willow cricket bat', status: 'partial', importTime: 24.9 },
  { id: 'imp-3', source: 'amazon.co.uk/dp/B0C…', sourceType: 'url', date: daysAgo(4), provider: 'OpenRouter', model: 'nvidia/nemotron-3-super-120b-a12b:free', productTitle: 'Resistance band set', status: 'success', importTime: 21.1 },
  { id: 'imp-4', source: 'pasted supplier description', sourceType: 'text', date: daysAgo(6), provider: 'DeepSeek', model: 'deepseek-v4-flash', productTitle: '(no evidence — shipping unknown)', status: 'failed', importTime: 9.7 },
  { id: 'imp-5', source: '1688.com/offer/6612', sourceType: 'html', date: daysAgo(8), provider: 'OpenRouter', model: 'minimax/minimax-m3:free', productTitle: 'Composite basketball, size 7', status: 'success', importTime: 26.3 },
];

/** Deterministic stand-in for the server-side AI extraction step. */
export function buildLocalExtraction(source: string, seedIndex = 0): AIExtractedProduct {
  const product = catalogProducts[seedIndex % catalogProducts.length];
  const slug = product.slug;
  return {
    title: product.name,
    luxuryTitle: `${product.name} — ${product.brand} Selected`,
    seoTitle: `${product.name} | Basco Sports`,
    slug,
    brand: product.brand,
    manufacturer: `${product.brand} Manufacturing`,
    category: product.category,
    subcategory: 'Performance gear',
    collection: 'Basco Lab',
    shortDescription: product.description.slice(0, 140),
    longDescription: product.description,
    features: product.features,
    benefits: ['Tested on pitch and track', 'Craft-first materials', 'Backed by statutory guarantees'],
    specifications: product.specifications,
    packageIncludes: ['1 × product', 'Care card'],
    weight: product.specifications.Weight || '—',
    dimensions: '—',
    origin: 'Imported',
    materials: ['Engineered composite'],
    colors: product.variants.map((v) => v.color),
    sizes: product.variants.flatMap((v) => v.sizes || []).slice(0, 8),
    sku: `BS-${product.id.toUpperCase()}`,
    barcode: '',
    hsCode: '9506.62',
    stock: product.stock,
    costPrice: Math.round(product.price * 0.48 * 100) / 100,
    sellingPrice: product.price,
    comparePrice: product.compareAtPrice || 0,
    shippingWeight: '—',
    tags: [product.category, 'performance'],
    seoKeywords: [product.category, product.name.toLowerCase()],
    metaTitle: `${product.name} | Basco Sports`,
    metaDescription: product.description.slice(0, 155),
    focusKeyword: product.category,
    images: product.images,
    faqs: [
      { q: 'Is this suitable for match use?', a: 'Yes — built for competitive use in its sport.' },
      { q: 'What is the returns window?', a: '30 days, per your local consumer law.' },
    ],
    warranty: 'Statutory guarantees apply',
    careInstructions: product.compliance?.careInstructions || 'Wipe clean, air dry.',
    safetyNotes: 'No safety-critical components.',
    confidence: { title: 0.94, pricing: 0.81, shipping: 0.42, images: 0.88 },
    supplierPlatform: 'CJ',
    supplierUrl: source.startsWith('http') ? source : `https://cjdropshipping.com/search?q=${encodeURIComponent(product.name)}`,
    supplierItemId: `CJ-${product.id.toUpperCase()}`,
    shippingToUsa: 'unknown',
    deliveryRangeUsa: '9–16 days',
    usStockEvidence: 'No US warehouse evidence found',
    ordersCount: '—',
    ratingValue: '—',
    reviewCount: '—',
    batteryElectrical: 'none',
    riskFlags: ['Shipping cost unknown', 'No US stock evidence'],
    evidence: {
      title: 'VERIFIED',
      pricing: 'VERIFIED',
      shipping: 'UNKNOWN',
      images: 'VERIFIED',
      origin: 'INFERRED',
    },
    variants: buildVariantMatrix(product.variants[0]?.sizes || ['S', 'M', 'L'], product.variants.map((v) => v.color)).variants,
    ownerNotes: '',
  };
}

/** Real local combinatorics — the same matrix the AI would have produced. */
export function buildVariantMatrix(sizes: string[], colors: string[]): { variants: AIExtractedVariant[]; duplicates: number } {
  const seen = new Set<string>();
  let duplicates = 0;
  const variants: AIExtractedVariant[] = [];
  for (const color of colors) {
    for (const size of sizes) {
      const key = `${color}|${size}`;
      if (seen.has(key)) {
        duplicates += 1;
        continue;
      }
      seen.add(key);
      variants.push({ attributes: { Color: color, Size: size }, sku: `BS-${slugify(color)}-${slugify(size)}`, price: 0 });
    }
  }
  return { variants, duplicates };
}

function slugify(value: string): string {
  return value.toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 12).toUpperCase();
}

// ---------------------------------------------------------------------------
// Product Scout
// ---------------------------------------------------------------------------

export interface ScoutCandidate {
  id: string;
  title: string;
  supplier: string;
  supplierPrice: number;
  shippingCost: number;
  shippingDays: string;
  availability: string;
  rating: string;
  orders: string;
  origin: string;
  sport: string;
  confidence: Confidence;
  state: 'candidate' | 'shortlisted' | 'approved' | 'published' | 'rejected';
  evidence: { label: string; value: string }[];
}

const SUPPLIERS = ['CJ Dropshipping', 'AliExpress', '1688', 'Made-in-China'];

export const scoutCandidates: ScoutCandidate[] = Array.from({ length: 12 }, (_, i) => {
  const p = catalogProducts[(i * 4) % catalogProducts.length];
  const supplierPrice = Math.round(p.price * (0.35 + (i % 4) * 0.05) * 100) / 100;
  const shippingCost = [0, 2.4, 4.1, 6.8][i % 4];
  const confidence: Confidence = ['strong', 'promising', 'possible', 'insufficient_data'][i % 4] as Confidence;
  return {
    id: `scout-${5000 + i}`,
    title: p.name,
    supplier: SUPPLIERS[i % SUPPLIERS.length],
    supplierPrice,
    shippingCost,
    shippingDays: `${8 + (i % 5)}–${14 + (i % 6)} days`,
    availability: i % 5 === 0 ? 'Low stock' : 'In stock',
    rating: i % 3 === 0 ? '—' : (4 + (i % 10) / 10).toFixed(1),
    orders: i % 3 === 0 ? '—' : `${120 + i * 37}`,
    origin: ['CN', 'PK', 'VN', 'IN'][i % 4],
    sport: p.category,
    confidence,
    state: (['candidate', 'shortlisted', 'approved', 'published', 'rejected'] as const)[i % 5],
    evidence: [
      { label: 'Supplier price', value: `$${supplierPrice.toFixed(2)}` },
      { label: 'Shipping to US', value: shippingCost ? `$${shippingCost.toFixed(2)}` : 'Free' },
      { label: 'Margin at Basco price', value: `${Math.round(((p.price - supplierPrice - shippingCost) / p.price) * 100)}%` },
      { label: 'US stock evidence', value: i % 3 === 0 ? 'None found' : 'Third-party warehouse' },
    ],
  };
});

export const scoutRunStats = {
  candidates: scoutCandidates.length,
  shortlisted: scoutCandidates.filter((c) => c.state === 'shortlisted').length,
  approved: scoutCandidates.filter((c) => c.state === 'approved').length,
  published: scoutCandidates.filter((c) => c.state === 'published').length,
  rejected: scoutCandidates.filter((c) => c.state === 'rejected').length,
  runsToday: 3,
  pointsUsed: 412,
  pointsBudget: 1000,
};

// ---------------------------------------------------------------------------
// Listing Task (batch import composer)
// ---------------------------------------------------------------------------

export const LISTING_SOURCES = ['AliExpress', 'Amazon', 'eBay', 'Shopify', 'CJ', 'Other'] as const;
export type ListingSource = (typeof LISTING_SOURCES)[number];

export const LISTING_CATEGORIES = ['football', 'cricket', 'basketball', 'running', 'gym', 'outdoor', 'accessories'] as const;
export const PRICING_MODES = ['Cost × multiplier', 'Fixed markup', 'Target margin %', 'Match competitor'] as const;

export interface ListingTask {
  id: string;
  createdAt: string;
  source: ListingSource;
  url: string;
  count: number;
  category: string;
  pricingMode: string;
  pricingValue: number;
  status: 'queued' | 'running' | 'completed' | 'failed';
  imported: number;
  failed: number;
  playbookApplied: boolean;
}

export const listingTasks: ListingTask[] = [
  { id: 'task-1', createdAt: daysAgo(0), source: 'CJ', url: 'https://cjdropshipping.com/list/sport?page=2', count: 40, category: 'running', pricingMode: 'Target margin %', pricingValue: 55, status: 'running', imported: 12, failed: 1, playbookApplied: true },
  { id: 'task-2', createdAt: daysAgo(1), source: 'AliExpress', url: 'https://aliexpress.com/category/football-boots', count: 25, category: 'football', pricingMode: 'Cost × multiplier', pricingValue: 2.4, status: 'completed', imported: 25, failed: 0, playbookApplied: true },
  { id: 'task-3', createdAt: daysAgo(3), source: 'Amazon', url: 'https://amazon.co.uk/b?node=streetwear', count: 15, category: 'accessories', pricingMode: 'Fixed markup', pricingValue: 18, status: 'completed', imported: 11, failed: 4, playbookApplied: true },
  { id: 'task-4', createdAt: daysAgo(6), source: 'eBay', url: 'https://ebay.com/str/vintagecricket', count: 10, category: 'cricket', pricingMode: 'Match competitor', pricingValue: 0, status: 'failed', imported: 0, failed: 10, playbookApplied: false },
];

/** Shared validation used by the composer — returns field-level errors. */
export function validateListingTask(input: { source: string; url: string; count: number; category: string; pricingValue: number }): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.source) errors.source = 'Choose a source platform.';
  if (!input.url.trim()) errors.url = 'A source URL is required.';
  else if (!/^https?:\/\//i.test(input.url.trim())) errors.url = 'URL must start with http:// or https://';
  if (!input.count || input.count < 1) errors.count = 'At least 1 product.';
  else if (input.count > 200) errors.count = 'Maximum 200 products per task.';
  if (!input.category) errors.category = 'Pick a Basco category.';
  if (input.pricingValue <= 0) errors.pricingValue = 'Pricing rule must be greater than 0.';
  return errors;
}

// ---------------------------------------------------------------------------
// Product research
// ---------------------------------------------------------------------------

export const researchTrends = [
  { id: 'tr-1', keyword: 'carbon fg football boots', demand: 92, competition: 41, trend: [40, 52, 61, 70, 78, 88, 92] },
  { id: 'tr-2', keyword: 'english willow grade 1 bat', demand: 74, competition: 33, trend: [30, 38, 44, 51, 60, 68, 74] },
  { id: 'tr-3', keyword: 'gym lifting belt leather', demand: 81, competition: 62, trend: [55, 58, 64, 69, 73, 78, 81] },
  { id: 'tr-4', keyword: '2 layer running jacket', demand: 66, competition: 58, trend: [44, 47, 52, 55, 59, 63, 66] },
  { id: 'tr-5', keyword: 'high top basketball shoes', demand: 58, competition: 71, trend: [60, 62, 61, 59, 58, 58, 58] },
];

export const researchSources = [
  { id: 'rs-1', label: 'Supplier catalogue', value: 38, color: '#3b82f6' },
  { id: 'rs-2', label: 'Hermes intelligence', value: 24, color: '#8b5cf6' },
  { id: 'rs-3', label: 'Search demand', value: 22, color: '#10b981' },
  { id: 'rs-4', label: 'Owner submissions', value: 16, color: '#f59e0b' },
];

// ---------------------------------------------------------------------------
// AI Control Center
// ---------------------------------------------------------------------------

export interface FeatureSwitch {
  id: string;
  label: string;
  description: string;
  provider: string;
  enabled: boolean;
  task: 'content' | 'research' | 'images' | 'seo' | 'listing';
}

export const aiFeatureSwitches: FeatureSwitch[] = [
  { id: 'feat-1', label: 'Product copy generation', description: 'Descriptions, features and FAQ drafts for the product editor.', provider: 'Primary', enabled: true, task: 'content' },
  { id: 'feat-2', label: 'AI Import extraction', description: 'Turns a supplier URL into a structured listing draft.', provider: 'Primary', enabled: true, task: 'listing' },
  { id: 'feat-3', label: 'Variant generation', description: 'Builds colour × size matrices (local math, no model call).', provider: 'Local', enabled: true, task: 'listing' },
  { id: 'feat-4', label: 'SEO analysis', description: 'Deterministic scoring — runs locally, no provider needed.', provider: 'Local', enabled: true, task: 'seo' },
  { id: 'feat-5', label: 'Product Scout research', description: 'Sourcing research with a points budget per run.', provider: 'Fallback', enabled: true, task: 'research' },
  { id: 'feat-6', label: 'Marketing generators', description: 'Ad, social and email copy drafts.', provider: 'Primary', enabled: true, task: 'content' },
  { id: 'feat-7', label: 'Media Studio image generation', description: 'Needs a provider key that supports image output.', provider: '—', enabled: false, task: 'images' },
  { id: 'feat-8', label: 'Second opinion on listings', description: 'A second provider reviews pricing and risk flags.', provider: 'Fallback', enabled: false, task: 'research' },
];

export const aiTaskRouting = [
  { id: 'route-1', task: 'Content & copy', primary: 'OpenRouter', fallback: 'Gemini', model: 'minimax/minimax-m3:free' },
  { id: 'route-2', task: 'Listing extraction', primary: 'Gemini', fallback: 'OpenRouter', model: 'gemini-3.5-flash' },
  { id: 'route-3', task: 'Research & scoring', primary: 'DeepSeek', fallback: 'OpenRouter', model: 'deepseek-v4-flash' },
  { id: 'route-4', task: 'Local deterministic', primary: 'No provider', fallback: '—', model: 'local math' },
];

export const ownerAttention = [
  { id: 'att-1', label: '4 scout candidates have unknown shipping cost', severity: 'amber' as const, hint: 'Blocked from auto-publish by the listing playbook.' },
  { id: 'att-2', label: '1 import failed: shipping evidence missing', severity: 'red' as const, hint: 'Review the source URL and retry, or reject it.' },
  { id: 'att-3', label: 'Media Studio is off — no image-capable provider linked', severity: 'blue' as const, hint: 'Link Basco\u2019s own provider key to enable image generation.' },
];

export const spendControl = {
  monthlyBudget: 40,
  spent: 12.4,
  freeFirst: true,
  secondOpinion: false,
  controlMode: 'Balanced' as 'Free-first' | 'Balanced' | 'Quality-first',
};

export const aiHubGenerators = [
  { id: 'gen-1', label: 'Product description', prompt: 'Write a 3-paragraph product description for a carbon FG football boot aimed at amateur players who play twice a week.', route: '/admin/ai-import' },
  { id: 'gen-2', label: 'Meta ad copy', prompt: 'Write 3 Meta ad headlines (max 40 chars) and 2 primary texts for a Basco season launch.', route: '/admin/marketing' },
  { id: 'gen-3', label: 'SEO title + meta', prompt: 'Optimise the SEO title and meta description for the Heritage Willow bat product page.', route: '/admin/seo-engine' },
  { id: 'gen-4', label: 'Variant matrix', prompt: 'Generate the colour × size matrix for the Aeroflow jacket (Obsidian, Stone × S–XL).', route: '/admin/variant-gen' },
];

// ---------------------------------------------------------------------------
// AI Intelligence (Hermes) — research only, never auto-publishes
// ---------------------------------------------------------------------------

export type IntelTab = 'products' | 'seo' | 'free-marketing' | 'free-listings' | 'market' | 'marketing' | 'ads' | 'catalog-qa';

export const INTEL_TABS: { key: IntelTab; label: string }[] = [
  { key: 'products', label: 'Products' },
  { key: 'seo', label: 'SEO' },
  { key: 'free-marketing', label: 'Free Marketing' },
  { key: 'free-listings', label: 'Free Listings' },
  { key: 'market', label: 'Market' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'ads', label: 'Ads' },
  { key: 'catalog-qa', label: 'Catalog QA' },
];

export interface IntelItem {
  id: string;
  tab: IntelTab;
  title: string;
  summary: string;
  confidence: Confidence;
  sources: string[];
  risks: string[];
  opportunity: string;
  state: 'new' | 'draft-created' | 'dismissed';
  createdAt: string;
}

export const intelItems: IntelItem[] = Array.from({ length: 14 }, (_, i) => {
  const p = catalogProducts[(i * 6) % catalogProducts.length];
  const tab = INTEL_TABS[i % INTEL_TABS.length].key;
  const confidence: Confidence = ['strong', 'promising', 'possible', 'insufficient_data'][i % 4] as Confidence;
  return {
    id: `intel-${6000 + i}`,
    tab,
    title: tab === 'seo' ? `Add internal links to “${p.name}”` : `Sourcing signal: ${p.name}`,
    summary:
      tab === 'seo'
        ? 'Two journal posts mention this product without linking to it. Internal links would pass authority to the product page.'
        : 'Supplier pricing moved 8% below Basco cost basis with stable shipping evidence over the last 14 days.',
    confidence,
    sources: [`https://cjdropshipping.com/product/bs-${p.id}`, 'Hermes weekly market job'],
    risks: confidence === 'insufficient_data' ? ['Shipping cost unknown', 'No US stock evidence'] : ['Competition rising on the focus keyword'],
    opportunity: tab === 'ads' ? 'Ads-ready once GTIN is present.' : `Est. +${6 + (i % 9)}% click-through on the current title.`,
    state: (['new', 'new', 'draft-created', 'dismissed'] as const)[i % 4],
    createdAt: daysAgo(i),
  };
});

export const catalogQaCounts = {
  active: catalogProducts.length - 9,
  draft: 4,
  blocked: 5,
  missingCost: 3,
  missingShipping: 6,
  unknownSource: 2,
  lowMargin: 4,
};
