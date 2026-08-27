/**
 * Cloudflare R2 client – minimal S3-compatible API using WebCrypto HMAC-SHA256.
 * Works on Edge runtime (no Node.js deps). All operations server-only.
 */

export interface R2Config {
  endpoint: string;     // https://<accountId>.r2.cloudflarestorage.com
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

// ─── HMAC-SHA256 helpers (WebCrypto) ──────────────────────────────────

async function hmacKey(secret: string, message: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return key;
}

async function hmacSign(secret: string, message: string): Promise<string> {
  const key = await hmacKey(secret, message);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return uint8ToHex(new Uint8Array(sig));
}

async function sha256Hex(data: ArrayBuffer | Uint8Array): Promise<string> {
  const src = data instanceof Uint8Array ? data : new Uint8Array(data);
  const copy = new ArrayBuffer(src.byteLength);
  new Uint8Array(copy).set(src);
  const hash = await crypto.subtle.digest('SHA-256', copy);
  return uint8ToHex(new Uint8Array(hash));
}

function uint8ToHex(buf: Uint8Array): string {
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── S3 V4 signing ───────────────────────────────────────────────────

function amzDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function dateStamp(date: Date): string {
  return amzDate(date).slice(0, 8);
}

function credentialString(date: Date): string {
  return `${dateStamp(date)}/auto/s3/aws4_request`;
}

function normalizeHeaders(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    out[k.toLowerCase().trim()] = v.trim();
  }
  return out;
}

function signedHeadersList(headers: Record<string, string>): string {
  return Object.keys(headers).sort().join(';');
}

async function buildCanonicalRequest(
  method: string,
  path: string,
  query: string,
  headers: Record<string, string>,
  payloadHash: string,
): Promise<string> {
  const signedHeaders = signedHeadersList(headers);
  const canonicalHeaders = Object.keys(headers).sort()
    .map(k => `${k}:${headers[k]}\n`).join('');
  return [method, path, query, canonicalHeaders, signedHeaders, payloadHash].join('\n');
}

async function buildStringToSign(
  date: Date,
  region: string,
  service: string,
  canonicalRequest: string,
): Promise<string> {
  const crHash = await sha256Hex(new TextEncoder().encode(canonicalRequest));
  const dateStr = amzDate(date);
  const credScope = `${dateStr}/${region}/${service}/aws4_request`;
  return `AWS4-HMAC-SHA256\n${dateStr}\n${credScope}\n${crHash}`;
}

async function computeSignature(
  secretKey: string,
  date: Date,
  region: string,
  service: string,
  stringToSign: string,
): Promise<string> {
  const kDate = await hmacSign(`AWS4${secretKey}`, dateStamp(date));
  const kRegion = await hmacSign(kDate, region);
  const kService = await hmacSign(kRegion, service);
  const kSigning = await hmacSign(kService, 'aws4_request');
  return hmacSign(kSigning, stringToSign);
}

// ─── High-level R2 operations ─────────────────────────────────────────

function parseEndpoint(endpoint: string): { host: string; region: string } {
  const url = new URL(endpoint);
  const accountId = url.hostname.split('.')[0];
  return { host: url.hostname, region: 'auto' };
}

function contentType(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml',
    avif: 'image/avif',
  };
  return map[ext] || 'application/octet-stream';
}

/**
 * Upload a file to R2.
 * Returns the public URL path (e.g. /products/image.jpg).
 */
export async function r2Upload(
  config: R2Config,
  key: string,
  body: ArrayBuffer,
  opts?: { contentType?: string; cacheControl?: string },
): Promise<{ key: string; url: string }> {
  const { host, region } = parseEndpoint(config.endpoint);
  const date = new Date();
  const method = 'PUT';
  const path = `/${encodeURIComponent(config.bucket)}/${key.split('/').map(encodeURIComponent).join('/')}`;
  const ct = opts?.contentType || contentType(key);
  const cacheControl = opts?.cacheControl || 'public, max-age=31536000, immutable';
  const payloadHash = await sha256Hex(body);

  const headers: Record<string, string> = {
    'host': host,
    'x-amz-date': amzDate(date),
    'x-amz-content-sha256': payloadHash,
    'content-type': ct,
    'cache-control': cacheControl,
  };

  const canonicalReq = await buildCanonicalRequest(method, path, '', headers, payloadHash);
  const sts = await buildStringToSign(date, region, 's3', canonicalReq);
  const sig = await computeSignature(config.secretAccessKey, date, region, 's3', sts);
  const credScope = credentialString(date);
  const signedHeaders = signedHeadersList(headers);

  const authHeader = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credScope}, SignedHeaders=${signedHeaders}, Signature=${sig}`;

  const fetchBody = body;
  const resp = await fetch(`https://${host}${path}`, {
    method,
    headers: { ...headers, 'Authorization': authHeader },
    body: fetchBody,
  });

  if (!resp.ok && resp.status !== 200) {
    const err = await resp.text();
    throw new Error(`R2 upload failed (${resp.status}): ${err}`);
  }

  const publicBase = config.endpoint.replace('.r2.cloudflarestorage.com', '.r2.dev');
  const url = `https://${config.bucket}.${publicBase.replace('https://', '')}/${key}`;
  return { key, url };
}

/**
 * Delete a file from R2.
 */
export async function r2Delete(config: R2Config, key: string): Promise<void> {
  const { host, region } = parseEndpoint(config.endpoint);
  const date = new Date();
  const method = 'DELETE';
  const path = `/${encodeURIComponent(config.bucket)}/${key.split('/').map(encodeURIComponent).join('/')}`;
  const emptyHash = await sha256Hex(new ArrayBuffer(0));

  const headers: Record<string, string> = {
    'host': host,
    'x-amz-date': amzDate(date),
    'x-amz-content-sha256': emptyHash,
  };

  const canonicalReq = await buildCanonicalRequest(method, path, '', headers, emptyHash);
  const sts = await buildStringToSign(date, region, 's3', canonicalReq);
  const sig = await computeSignature(config.secretAccessKey, date, region, 's3', sts);
  const credScope = credentialString(date);
  const signedHeaders = signedHeadersList(headers);
  const authHeader = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credScope}, SignedHeaders=${signedHeaders}, Signature=${sig}`;

  const resp = await fetch(`https://${host}${path}`, {
    method,
    headers: { ...headers, 'Authorization': authHeader },
  });

  if (!resp.ok && resp.status !== 204) {
    const err = await resp.text();
    throw new Error(`R2 delete failed (${resp.status}): ${err}`);
  }
}

/**
 * List objects in R2 bucket with a prefix.
 */
export async function r2List(
  config: R2Config,
  prefix?: string,
  maxKeys = 100,
): Promise<{ key: string; size: number; lastModified: string }[]> {
  const { host, region } = parseEndpoint(config.endpoint);
  const date = new Date();
  const method = 'GET';
  const query = `list-type=2&prefix=${encodeURIComponent(prefix || '')}&max-keys=${maxKeys}`;
  const path = `/${encodeURIComponent(config.bucket)}`;
  const emptyHash = await sha256Hex(new ArrayBuffer(0));

  const headers: Record<string, string> = {
    'host': host,
    'x-amz-date': amzDate(date),
    'x-amz-content-sha256': emptyHash,
  };

  const canonicalReq = await buildCanonicalRequest(method, path, query, headers, emptyHash);
  const sts = await buildStringToSign(date, region, 's3', canonicalReq);
  const sig = await computeSignature(config.secretAccessKey, date, region, 's3', sts);
  const credScope = credentialString(date);
  const signedHeaders = signedHeadersList(headers);
  const authHeader = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credScope}, SignedHeaders=${signedHeaders}, Signature=${sig}`;

  const resp = await fetch(`https://${host}${path}?${query}`, {
    method,
    headers: { ...headers, 'Authorization': authHeader },
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`R2 list failed (${resp.status}): ${err}`);
  }

  const xml = await resp.text();
  const contents = xml.match(/<Contents>([\s\S]*?)<\/Contents>/g) || [];
  return contents.map(c => {
    const key = c.match(/<Key>(.*?)<\/Key>/)?.[1] || '';
    const size = parseInt(c.match(/<Size>(.*?)<\/Size>/)?.[1] || '0');
    const lastModified = c.match(/<LastModified>(.*?)<\/LastModified>/)?.[1] || '';
    return { key, size, lastModified };
  });
}

/**
 * Generate a presigned GET URL (temporary public access, 1 hour).
 */
export async function r2PresignGet(
  config: R2Config,
  key: string,
  expiresIn = 3600,
): Promise<string> {
  const { host, region } = parseEndpoint(config.endpoint);
  const date = new Date();
  const method = 'GET';
  const path = `/${encodeURIComponent(config.bucket)}/${key.split('/').map(encodeURIComponent).join('/')}`;
  const expires = Math.floor(date.getTime() / 1000) + expiresIn;

  const canonicalQueryString = `X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=${encodeURIComponent(config.accessKeyId + '/' + dateStamp(date) + '/auto/s3/aws4_request')}&X-Amz-Date=${amzDate(date)}&X-Amz-Expires=${expires}&X-Amz-SignedHeaders=host`;

  const canonicalReq = await buildCanonicalRequest(method, path, canonicalQueryString, { host }, 'UNSIGNED-PAYLOAD');
  const sts = await buildStringToSign(date, region, 's3', canonicalReq);
  const sig = await computeSignature(config.secretAccessKey, date, region, 's3', sts);

  return `https://${host}${path}?${canonicalQueryString}&X-Amz-Signature=${sig}`;
}

/**
 * Build R2 config from store_settings row.
 */
export function r2ConfigFromSettings(s: Record<string, any>): R2Config | null {
  const endpoint = s.cloudflareR2Endpoint;
  const accessKeyId = s.cloudflareR2AccessKeyId;
  const secretAccessKey = s.cloudflareR2SecretAccessKey;
  const bucket = s.cloudflareR2BucketName;
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) return null;
  return { endpoint, accessKeyId, secretAccessKey, bucket };
}
