#!/usr/bin/env node
/**
 * Basco Sports – Launch gate (npm run launch-check)
 * Returns PASS or BLOCKED with reasons. Exit code 1 when blocked.
 * Live payment must stay disabled while this returns BLOCKED.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const blockers = [];
const warnings = [];

// 1. Business identity must be fully populated in src/config/business.ts
const businessSrc = readFileSync(join(root, "src/config/business.ts"), "utf8");
for (const field of ["legalBusinessName", "businessAddress", "supportEmail", "returnAddress"]) {
  if (businessSrc.includes(`${field}: null`)) blockers.push(`business.${field} is not verified (LAUNCH_BLOCKER)`);
}
if (businessSrc.includes("euResponsiblePerson") && /euResponsiblePerson[\s\S]{0,200}name: null/.test(businessSrc)) {
  blockers.push("EU Responsible Person details missing (blocks EU listings)");
}

// 2. No fabricated claims in the catalog
const productsSrc = readFileSync(join(root, "src/data/products.ts"), "utf8");
const forbidden = ["FIFA", "Flyknit", "ZoomX", "Cushlon", "Dri-FIT", "GORE", "GTX", "Vibram", "Polartec", "Pittards", "CoolMax", "Pertex", "Authentic", "blister-free"];
for (const term of forbidden) {
  if (new RegExp(term, "i").test(productsSrc)) blockers.push(`Forbidden claim "${term}" present in catalog`);
}
if (/rating: [1-9]/.test(productsSrc)) blockers.push("Seeded ratings present in catalog (must be 0 until reviews are real)");
if (/reviewCount: [1-9]/.test(productsSrc)) blockers.push("Seeded review counts present in catalog");
if (/compareAtPrice/.test(productsSrc)) blockers.push("compareAtPrice (reference pricing) present without genuine basis");

// 3. Seeded demo reviews must be empty
const reviewsEmpty = /export const reviews: Review\[\] = \[\s*\]/.test(productsSrc);
if (!reviewsEmpty) blockers.push("Seeded demo reviews present in src/data/products.ts");

// 4. Payment mode must still be demo unless an explicit commerce-live flag AND no blockers
const envLocal = existsSync(join(root, ".env.local")) ? readFileSync(join(root, ".env.local"), "utf8") : "";
if (/NEXT_PUBLIC_BASCO_PAYMENT_MODE\s*=\s*live/i.test(envLocal) || /PAYMENT_PROVIDER\s*=\s*stripe/i.test(envLocal)) {
  warnings.push("Payment config suggests live mode in .env.local – ensure COMMERCE_LIVE gate is enforced server-side before enabling.");
}
if (!/COMMERCE_LIVE\s*=\s*true/i.test(envLocal)) {
  warnings.push("COMMERCE_LIVE is not set to true – live payments remain disabled (expected until gate passes).");
}

// 5. Shipping methods must be carrier-verified before checkout opens
const shippingSrc = readFileSync(join(root, "src/lib/shipping.ts"), "utf8");
if (/verified: false/.test(shippingSrc)) warnings.push("Shipping methods are not carrier-verified (rates are planning defaults) – checkout must stay closed.");

// 6. Legal pages exist
for (const p of ["privacy", "terms", "cookies", "shipping", "returns", "warranty", "accessibility", "product-safety", "contact", "legal"]) {
  const candidates = [`src/app/${p}/page.tsx`, `src/app/${p}.tsx`];
  if (!candidates.some((c) => existsSync(join(root, c)))) blockers.push(`Missing legal page /${p}`);
}

console.log("LAUNCH GATE CHECK");
console.log("=================");
if (blockers.length) {
  console.log("\nBLOCKED – reasons:");
  for (const b of blockers) console.log("  ✗ " + b);
} else {
  console.log("\nPASS – no launch blockers found.");
}
if (warnings.length) {
  console.log("\nWarnings:");
  for (const w of warnings) console.log("  ! " + w);
}
process.exit(blockers.length ? 1 : 0);
