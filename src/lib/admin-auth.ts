/**
 * Basco Sports – Admin Authentication Helpers
 * Server-side only. Never import in client components.
 * Supports multi-user DB-based auth (admin_users table) with roles.
 *
 * Password hash format (WebCrypto – works on Edge AND Node runtimes):
 *   pbkdf2$iterations$saltBase64$derivedKeyBase64
 *
 * Session cookies: HMAC-SHA256 signed payload (WebCrypto), httpOnly, 8h expiry.
 * No node:crypto / Buffer imports – this module bundles safely for the Edge Runtime.
 */

import { getServerEnv, isAdminConfigured } from './env';

const SESSION_COOKIE = 'basco_admin_session';
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

export const PBKDF2_RECOMMENDED = {
  iterations: 600_000,
  dkLen: 32,
  saltLen: 16,
};

export type AdminRole = 'owner' | 'admin';

export interface AdminSessionPayload {
  email: string;
  name: string;
  role: AdminRole;
  exp: number;
}

/** Permissions for each role */
export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  owner: [
    'catalog.view', 'catalog.edit', 'catalog.delete',
    'orders.view', 'orders.edit', 'orders.delete',
    'users.view', 'users.edit', 'users.block',
    'admin_users.view', 'admin_users.add', 'admin_users.edit', 'admin_users.delete',
    'integrations.view', 'integrations.edit',
    'settings.view', 'settings.edit',
    'hermes.view', 'hermes.edit',
  ],
  admin: [
    'catalog.view', 'catalog.edit',
    'orders.view', 'orders.edit',
    'users.view',
    'integrations.view',
    'settings.view',
    'hermes.view',
  ],
};

export function hasPermission(role: AdminRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

function getSecret(): string | null {
  const env = getServerEnv();
  return env.ADMIN_SESSION_SECRET;
}

export function getAdminConfigStatus() {
  const env = getServerEnv();
  return {
    configured: isAdminConfigured(env),
    hasSessionSecret: !!env.ADMIN_SESSION_SECRET,
    email: env.ADMIN_EMAIL,
  };
}

// ---------------------------------------------------------------------------
// Base64 helpers – no Buffer (Edge-safe)
// ---------------------------------------------------------------------------

export function bytesToB64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToB64Url(bytes: Uint8Array): string {
  return bytesToB64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64UrlToBytes(b64url: string): Uint8Array {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  return b64ToBytes(b64);
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// ---------------------------------------------------------------------------
// PBKDF2 (WebCrypto – Edge + Node)
// Format: pbkdf2$iterations$saltBase64$derivedKeyBase64
// ---------------------------------------------------------------------------

export function isPbkdf2HashFormat(hash: string): boolean {
  if (!hash) return false;
  const parts = hash.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const it = Number(parts[1]);
  if (!Number.isInteger(it) || it < 100_000 || it > 10_000_000) return false;
  try {
    const salt = b64ToBytes(parts[2]);
    const dk = b64ToBytes(parts[3]);
    if (salt.length < 8 || dk.length < 16) return false;
  } catch {
    return false;
  }
  return true;
}

export async function verifyPasswordPbkdf2(providedPassword: string, storedHash: string): Promise<{ ok: boolean; isFormat: boolean }> {
  if (!isPbkdf2HashFormat(storedHash)) return { ok: false, isFormat: false };
  const parts = storedHash.split('$');
  const iterations = Number(parts[1]);
  const salt = b64ToBytes(parts[2]);
  const dk = b64ToBytes(parts[3]);
  try {
    const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(providedPassword), 'PBKDF2', false, ['deriveBits']);
    const derived = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: salt.buffer as ArrayBuffer, iterations },
      keyMaterial,
      dk.length * 8
    );
    const ok = timingSafeEqualBytes(new Uint8Array(derived), dk);
    return { ok, isFormat: true };
  } catch {
    return { ok: false, isFormat: true };
  }
}

/**
 * Verify a password against the stored pbkdf2 hash.
 * hashFormatOk=false means the stored hash itself is invalid/unsupported.
 */
export async function verifyAdminPassword(providedPassword: string, storedHash: string): Promise<{ ok: boolean; hashFormatOk: boolean }> {
  if (isPbkdf2HashFormat(storedHash)) {
    const r = await verifyPasswordPbkdf2(providedPassword, storedHash);
    return { ok: r.ok, hashFormatOk: r.isFormat };
  }
  return { ok: false, hashFormatOk: false };
}

/**
 * Generate a pbkdf2 hash locally (WebCrypto – works everywhere).
 * pbkdf2$iterations$saltBase64$derivedKeyBase64
 */
export async function generatePbkdf2Hash(password: string, opts?: Partial<typeof PBKDF2_RECOMMENDED>): Promise<string> {
  const iterations = opts?.iterations ?? PBKDF2_RECOMMENDED.iterations;
  const dkLen = opts?.dkLen ?? PBKDF2_RECOMMENDED.dkLen;
  const saltLen = opts?.saltLen ?? PBKDF2_RECOMMENDED.saltLen;
  const salt = crypto.getRandomValues(new Uint8Array(saltLen));
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const dk = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt.buffer as ArrayBuffer, iterations }, keyMaterial, dkLen * 8);
  return `pbkdf2$${iterations}$${bytesToB64(salt)}$${bytesToB64(new Uint8Array(dk))}`;
}

// ---------------------------------------------------------------------------
// Session tokens – HMAC-SHA256 (WebCrypto, Edge + Node)
// ---------------------------------------------------------------------------

async function hmacSha256(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return bytesToB64Url(new Uint8Array(sig));
}

export async function createSessionToken(email: string, name: string, role: AdminRole): Promise<string | null> {
  const secret = getSecret();
  if (!secret) return null;
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload: AdminSessionPayload = { email, name, role, exp };
  const payloadB64 = bytesToB64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await hmacSha256(secret, payloadB64);
  return `${payloadB64}.${signature}`;
}

export async function verifySessionToken(token: string): Promise<AdminSessionPayload | null> {
  const secret = getSecret();
  if (!secret || !token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;
  try {
    const expectedSig = await hmacSha256(secret, payloadB64);
    if (!timingSafeEqualBytes(new TextEncoder().encode(signature), new TextEncoder().encode(expectedSig))) return null;
  } catch {
    return null;
  }
  try {
    const payloadJson = new TextDecoder().decode(b64UrlToBytes(payloadB64));
    const payload = JSON.parse(payloadJson) as AdminSessionPayload;
    if (!payload.email || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    // Legacy single-user check (fallback for old tokens without role)
    if (!payload.role) {
      const env = getServerEnv();
      if (env.ADMIN_EMAIL && payload.email !== env.ADMIN_EMAIL) return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export const ADMIN_SESSION_COOKIE = SESSION_COOKIE;
export const ADMIN_SESSION_MAX_AGE = SESSION_MAX_AGE;
