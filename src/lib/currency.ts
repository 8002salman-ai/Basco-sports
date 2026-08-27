/**
 * Basco Sports – Currency engine
 *
 * USD is the master currency. Product master prices live in USD only.
 * Local prices are DERIVED via a configured FX table + commercial rounding.
 *
 * This module never scrapes external FX sites. Rates come from
 * NEXT_PUBLIC_FX_RATES (JSON) or the built-in dated baseline, and every
 * non-USD amount rendered for shoppers is clearly an ESTIMATE until the
 * checkout provider confirms presentment currency.
 */
import { currencies, DEFAULT_CURRENCY } from '@/config/markets';

/** Baseline table – manually maintained, dated. Overrides via NEXT_PUBLIC_FX_RATES JSON. */
const BASELINE_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, NOK: 10.6, SEK: 10.4, DKK: 6.9, PLN: 3.95,
  CHF: 0.88, CAD: 1.36, AUD: 1.51, NZD: 1.63, AED: 3.67, QAR: 3.64,
  SAR: 3.75, KWD: 0.31, BHD: 0.38, OMR: 0.38, JPY: 148, SGD: 1.34, MYR: 4.7,
};
export const FX_BASELINE_DATE = '2026-08-27';

function parseEnvRates(): { rates: Record<string, number>; source: string } | null {
  const raw = process.env.NEXT_PUBLIC_FX_RATES;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    if (parsed && typeof parsed.USD === 'number' && parsed.USD === 1) {
      return { rates: parsed, source: 'env-configured' };
    }
  } catch {
    // fall through to baseline
  }
  return null;
}

const configured = parseEnvRates();

export function fxRates(): Record<string, number> {
  return configured?.rates ?? BASELINE_RATES;
}

export function fxSource(): string {
  return configured?.source ?? `baseline-${FX_BASELINE_DATE}`;
}

export function isNativeCurrency(currency: string): boolean {
  return currency === DEFAULT_CURRENCY;
}

/** Convert a USD master amount into the target currency at current configured rates. */
export function convertFromUSD(amountUSD: number, currency: string): number {
  const rate = fxRates()[currency];
  if (!rate || rate <= 0) return amountUSD;
  return amountUSD * rate;
}

/**
 * Commercial rounding: snap to the nearest configured price point for the
 * currency (e.g. NOK 950 not kr 946.7839…). Falls back to clean fraction
 * rounding when no point fits.
 */
export function roundCommercial(amount: number, currency: string): number {
  const cfg = currencies[currency];
  if (!cfg) return Math.round(amount * 100) / 100;
  const points = cfg.pricePoints.filter((p) => p > 0);
  const best = points.reduce<number | null>((acc, p) => {
    if (acc === null) return p;
    return Math.abs(p - amount) < Math.abs(acc - amount) ? p : acc;
  }, null);
  if (best === null) return Math.round(amount);
  // Accept a price point within 12% of the raw converted amount; otherwise round to clean fractions.
  if (Math.abs(best - amount) / amount <= 0.12) return best;
  const f = Math.pow(10, cfg.fractionDigits);
  return Math.round(amount * f) / f;
}

/**
 * Format for shoppers. Non-USD amounts produced by convertForDisplay are
 * rounded commercially first; never show raw exchange-rate decimals.
 */
export function formatMoney(amount: number, currency: string, locale?: string): string {
  const cfg = currencies[currency];
  const fractionDigits = cfg?.fractionDigits ?? 2;
  // Compact grouping for zero-decimal currencies (kr 950, ¥1,190)
  return new Intl.NumberFormat(locale ?? 'en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: fractionDigits === 0 ? 0 : Math.min(2, fractionDigits),
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

/** Display pipeline: USD master → convert → commercial rounding → format. */
export function convertForDisplay(amountUSD: number, currency: string, locale?: string): string {
  if (currency === DEFAULT_CURRENCY) return formatMoney(amountUSD, currency, locale);
  return formatMoney(roundCommercial(convertFromUSD(amountUSD, currency), currency), currency, locale);
}

export function currencyLabel(currency: string): string {
  return currencies[currency]?.symbol ?? currency;
}
