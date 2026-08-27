import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerEnv, isAdminConfigured } from '@/lib/env';
import { verifySessionToken, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';
import { SupabaseAdapter } from '@/lib/admin/db';
import { r2Upload, r2ConfigFromSettings } from '@/lib/r2-client';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

/**
 * One-shot migration: downloads Unsplash product images and re-uploads them to R2.
 * Updates product records in Supabase with the new R2 URLs.
 *
 * POST /api/admin/migrate-images  { dryRun?: boolean }
 *
 * Auth required (admin session).
 * Safe to re-run — skips products that already have R2 URLs.
 */

interface MigrationResult {
  productId: string;
  productName: string;
  oldUrl: string;
  newUrl: string | null;
  status: 'migrated' | 'skipped' | 'error';
  error?: string;
}

export async function POST(req: NextRequest) {
  const env = getServerEnv();
  const configured = isAdminConfigured(env);

  // Auth gate
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session && configured) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ ok: false, error: 'DB not configured' }, { status: 503 });
  }

  const adapter = new SupabaseAdapter(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    env.SUPABASE_SERVICE_ROLE_KEY,
  );

  // Get R2 config from store_settings
  const settings = await adapter.findFirst('store_settings', 'key', 'basco-store') as Record<string, any>;
  const r2Config = settings ? r2ConfigFromSettings(settings) : null;
  if (!r2Config) {
    return NextResponse.json({ ok: false, error: 'R2 not configured in Integrations' }, { status: 503 });
  }

  let body: { dryRun?: boolean } = {};
  try { body = await req.json(); } catch { /* ok */ }
  const dryRun = body.dryRun ?? false;

  // Fetch all products
  const allProducts = await adapter.list('products', { orderBy: 'updatedAt desc' }) as Record<string, any>[];

  // Filter to products with Unsplash URLs that haven't been migrated yet
  const toMigrate = allProducts.filter((p) => {
    const images = p.images || [];
    if (images.length === 0) return false;
    // Only migrate Unsplash URLs
    return images.some((url: string) => url.includes('unsplash.com'));
  });

  const results: MigrationResult[] = [];

  // Process up to 10 at a time (Edge function timeout limit)
  const batch = toMigrate.slice(0, 10);

  for (const product of batch) {
    const images = product.images || [];
    const newImages: string[] = [];
    let anyChanged = false;

    for (let i = 0; i < images.length; i++) {
      const url = images[i];
      if (!url.includes('unsplash.com')) {
        // Not an Unsplash URL — keep as-is
        newImages.push(url);
        continue;
      }

      if (dryRun) {
        newImages.push(`[WOULD MIGRATE] ${url.slice(0, 60)}...`);
        anyChanged = true;
        continue;
      }

      try {
        // Build R2 key from product slug + image index
        const slug = product.slug || product.id;
        const ext = url.includes('.png') ? 'png' : 'jpg';
        const r2Key = `products/${slug}/image-${i}.${ext}`;

        // Download from Unsplash
        const imgResp = await fetch(url);
        if (!imgResp.ok) throw new Error(`Download failed: ${imgResp.status}`);
        const imgBuffer = await imgResp.arrayBuffer();

        // Upload to R2
        const result = await r2Upload(r2Config, r2Key, imgBuffer, {
          contentType: imgResp.headers.get('content-type') || 'image/jpeg',
        });

        newImages.push(result.url);
        anyChanged = true;
      } catch (err) {
        // Keep original URL on failure
        newImages.push(url);
        results.push({
          productId: product.id,
          productName: product.name,
          oldUrl: url,
          newUrl: null,
          status: 'error',
          error: (err as Error).message,
        });
      }
    }

    // Update product if any images changed
    if (anyChanged && !dryRun) {
      try {
        await adapter.update('products', product.id, {
          images: newImages,
          variants: [{ color: 'Default', colorHex: '#0B1220', images: newImages }],
          updatedAt: new Date().toISOString(),
        } as any);
      } catch (err) {
        results.push({
          productId: product.id,
          productName: product.name,
          oldUrl: images[0] || '',
          newUrl: null,
          status: 'error',
          error: `DB update failed: ${(err as Error).message}`,
        });
        continue;
      }
    }

    results.push({
      productId: product.id,
      productName: product.name,
      oldUrl: images[0] || '',
      newUrl: anyChanged ? newImages[0] : null,
      status: anyChanged ? (dryRun ? 'skipped' : 'migrated') : 'skipped',
    });
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    totalProducts: allProducts.length,
    eligibleForMigration: toMigrate.length,
    processed: batch.length,
    remaining: toMigrate.length - batch.length,
    results,
  });
}
