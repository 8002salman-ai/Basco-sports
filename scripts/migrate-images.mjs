/**
 * Migration script: Unsplash images → Cloudflare R2
 * Run: node scripts/migrate-images.mjs
 *
 * Reads .env.local for Supabase + R2 credentials.
 * Downloads each Unsplash image, uploads to R2, updates product record.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─── Load env vars from .env.local ──────────────────────────────────

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env.local');
  const lines = readFileSync(envPath, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    env[key] = value;
    process.env[key] = value;
  }
  return env;
}

// ─── HMAC-SHA256 (Node crypto) ─────────────────────────────────────

import { createHmac, createHash } from 'crypto';

function hmacSign(secret, message) {
  return createHmac('sha256', secret).update(message).digest('hex');
}

function sha256Hex(data) {
  return createHash('sha256').update(data).digest('hex');
}

function amzDate(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function dateStamp(date) {
  return amzDate(date).slice(0, 8);
}

// ─── S3 V4 Signing ─────────────────────────────────────────────────

async function signAndFetch(method, url, headers, body, config) {
  const u = new URL(url);
  const host = u.hostname;
  const region = 'auto';
  const date = new Date();
  const dateStr = amzDate(date);
  const ds = dateStamp(date);

  const payloadHash = body ? sha256Hex(body) : sha256Hex(Buffer.alloc(0));

  const signedHeaders = {
    'host': host,
    'x-amz-date': dateStr,
    'x-amz-content-sha256': payloadHash,
    ...headers,
  };

  const sortedHeaders = Object.keys(signedHeaders).sort();
  const canonicalHeaders = sortedHeaders.map(k => `${k}:${signedHeaders[k]}\n`).join('');
  const signedHeadersStr = sortedHeaders.join(';');

  const canonicalRequest = [
    method, u.pathname + u.search, '', canonicalHeaders, signedHeadersStr, payloadHash
  ].join('\n');

  const crHash = sha256Hex(Buffer.from(canonicalRequest));
  const credScope = `${ds}/${region}/s3/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${dateStr}\n${credScope}\n${crHash}`;

  const kDate = hmacSign(`AWS4${config.secretAccessKey}`, ds);
  const kRegion = hmacSign(kDate, region);
  const kService = hmacSign(kRegion, 's3');
  const kSigning = hmacSign(kService, 'aws4_request');
  const signature = hmacSign(kSigning, stringToSign);

  const authHeader = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credScope}, SignedHeaders=${signedHeadersStr}, Signature=${signature}`;

  const resp = await fetch(url, {
    method,
    headers: {
      ...signedHeaders,
      'Authorization': authHeader,
      ...(headers['content-type'] ? { 'Content-Type': headers['content-type'] } : {}),
    },
    body: body || undefined,
  });

  return resp;
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  const env = loadEnv();
  console.log('📦 Loaded env vars');

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const r2Endpoint = env.R2_ENDPOINT || '';
  const r2AccessKey = env.R2_ACCESS_KEY || '';
  const r2SecretKey = env.R2_SECRET_KEY || '';
  const r2Bucket = env.R2_BUCKET || 'basco-sports-images';

  // Try reading from store_settings if env vars not set
  if (!r2Endpoint || !r2AccessKey || !r2SecretKey) {
    console.log('⚠️  R2 env vars not found, trying store_settings from Supabase...');
    const settingsResp = await fetch(`${supabaseUrl}/rest/v1/store_settings?key=eq.basco-store&select=*`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    const settings = await settingsResp.json();
    if (settings?.[0]) {
      const s = settings[0];
      console.log('  Found R2 config in store_settings');
      var r2Config = {
        endpoint: s.cloudflareR2Endpoint,
        accessKeyId: s.cloudflareR2AccessKeyId,
        secretAccessKey: s.cloudflareR2SecretAccessKey,
        bucket: s.cloudflareR2BucketName || r2Bucket,
      };
    }
  } else {
    var r2Config = { endpoint: r2Endpoint, accessKeyId: r2AccessKey, secretAccessKey: r2SecretKey, bucket: r2Bucket };
  }

  if (!r2Config?.endpoint || !r2Config.accessKeyId || !r2Config.secretAccessKey) {
    console.error('❌ R2 credentials not found. Set R2_ENDPOINT/R2_ACCESS_KEY/R2_SECRET_KEY in .env.local or configure R2 in Integrations panel.');
    process.exit(1);
  }

  console.log(`☁️  R2 bucket: ${r2Config.bucket}`);

  // Fetch all products
  const prodResp = await fetch(`${supabaseUrl}/rest/v1/products?order=updatedAt.desc`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  const products = await prodResp.json();
  console.log(`📋 Found ${products.length} products`);

  // Filter to Unsplash images
  const toMigrate = products.filter(p => (p.images || []).some(url => url.includes('unsplash.com')));
  console.log(`🔄 ${toMigrate.length} products with Unsplash images to migrate`);

  let migrated = 0;
  let errors = 0;

  for (const product of toMigrate) {
    const images = product.images || [];
    const newImages = [];

    for (let i = 0; i < images.length; i++) {
      const url = images[i];
      if (!url.includes('unsplash.com')) {
        newImages.push(url);
        continue;
      }

      const slug = product.slug || product.id;
      const ext = 'jpg';
      const r2Key = `products/${slug}/image-${i}.${ext}`;

      try {
        process.stdout.write(`  ⬇️  Downloading ${product.name} image ${i + 1}...`);
        const imgResp = await fetch(url);
        if (!imgResp.ok) throw new Error(`HTTP ${imgResp.status}`);
        const buf = Buffer.from(await imgResp.arrayBuffer());

        process.stdout.write(` ⬆️  Uploading to R2...`);
        const host = new URL(r2Config.endpoint).hostname;
        const path = `/${encodeURIComponent(r2Config.bucket)}/${r2Key.split('/').map(encodeURIComponent).join('/')}`;
        const uploadUrl = `https://${host}${path}`;

        const uploadResp = await signAndFetch('PUT', uploadUrl, {
          'content-type': 'image/jpeg',
          'cache-control': 'public, max-age=31536000, immutable',
        }, buf, r2Config);

        if (!uploadResp.ok && uploadResp.status !== 200) {
          const errText = await uploadResp.text();
          throw new Error(`R2 upload failed: ${uploadResp.status} ${errText.slice(0, 200)}`);
        }

        const publicBase = r2Config.endpoint.replace('.r2.cloudflarestorage.com', '.r2.dev');
        const r2Url = `https://${r2Config.bucket}.${publicBase.replace('https://', '')}/${r2Key}`;
        newImages.push(r2Url);
        console.log(` ✅ ${r2Url.slice(0, 60)}...`);
        migrated++;
      } catch (err) {
        console.log(` ❌ ${err.message}`);
        newImages.push(url); // Keep original on failure
        errors++;
      }
    }

    // Update product in Supabase
    if (!newImages.every((url, i) => url === images[i])) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/products?id=eq.${product.id}`, {
          method: 'PATCH',
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            images: newImages,
            variants: [{ color: 'Default', colorHex: '#0B1220', images: newImages }],
            updatedAt: new Date().toISOString(),
          }),
        });
      } catch (err) {
        console.error(`  ❌ DB update failed for ${product.name}: ${err.message}`);
      }
    }
  }

  console.log(`\n✨ Migration complete!`);
  console.log(`   Migrated: ${migrated} images`);
  console.log(`   Errors: ${errors}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
