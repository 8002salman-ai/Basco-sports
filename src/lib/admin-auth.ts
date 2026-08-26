/**
 * Basco Sports – Admin Authentication Helpers
 * Server-side only. Never import in client components.
 * Requires env-provided ADMIN_EMAIL, ADMIN_PASSWORD_HASH (scrypt), ADMIN_SESSION_SECRET.
 * Security: Only scrypt format is accepted. SHA-256 and bcrypt fallbacks have been removed.
 * Stored format: scrypt$N$r$p$saltBase64$derivedKeyBase64
 *   N: cost parameter (e.g., 16384), power of two
 *   r: block size (e.g., 8)
 *   p: parallelization (e.g., 1)
 *   saltBase64: random salt, base64 encoded (16+ bytes recommended)
 *   derivedKeyBase64: scrypt derived key, base64 encoded (64 bytes recommended)
 * Uses Node's built-in crypto.scrypt + timingSafeEqual – no external deps.
 */

import crypto from 'crypto';
import { getServerEnv, isAdminConfigured } from './env';

const SESSION_COOKIE = 'basco_admin_session';
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

// Recommended strong parameters
export const SCRYPT_RECOMMENDED = {
  N: 16384, // 2^14
  r: 8,
  p: 1,
  dkLen: 64,
  saltLen: 16,
};

export interface AdminSessionPayload {
  email: string;
  exp: number;
}

function getSecret(): string | null {
  const env = getServerEnv();
  return env.ADMIN_SESSION_SECRET;
}

export function getAdminConfigStatus() {
  const env = getServerEnv();
  return {
    configured: isAdminConfigured(env),
    hasEmail: !!env.ADMIN_EMAIL,
    hasPasswordHash: !!env.ADMIN_PASSWORD_HASH,
    hasSessionSecret: !!env.ADMIN_SESSION_SECRET,
    email: env.ADMIN_EMAIL,
  };
}

/**
 * Check if string matches scrypt$N$r$p$saltBase64$derivedKeyBase64
 */
export function isScryptHashFormat(hash: string): boolean {
  if (!hash) return false;
  // Format: scrypt$N$r$p$salt$dk  where salt and dk are base64
  const parts = hash.split('$');
  if (parts.length !== 6) return false;
  if (parts[0] !== 'scrypt') return false;
  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const saltB64 = parts[4];
  const dkB64 = parts[5];
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  if (N < 2 || (N & (N - 1)) !== 0) return false; // N must be power of two
  if (r <= 0 || p <= 0) return false;
  if (N > 1_000_000 || r > 32 || p > 8) return false; // sanity upper bounds to avoid DoS
  if (!saltB64 || !dkB64) return false;
  // Validate base64 decodable
  try {
    const salt = Buffer.from(saltB64, 'base64');
    const dk = Buffer.from(dkB64, 'base64');
    if (salt.length < 8) return false;
    if (dk.length < 32) return false;
  } catch {
    return false;
  }
  return true;
}

function parseScryptHash(hash: string): { N: number; r: number; p: number; salt: Buffer; dk: Buffer; dkLen: number } | null {
  if (!isScryptHashFormat(hash)) return null;
  const parts = hash.split('$');
  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = Buffer.from(parts[4], 'base64');
  const dk = Buffer.from(parts[5], 'base64');
  return { N, r, p, salt, dk, dkLen: dk.length };
}

/**
 * Verify password against scrypt hash – async, using crypto.scrypt
 */
export async function verifyPasswordScrypt(providedPassword: string, storedHash: string): Promise<{ ok: boolean; isScryptFormat: boolean }> {
  if (!storedHash || !providedPassword) {
    return { ok: false, isScryptFormat: false };
  }
  const parsed = parseScryptHash(storedHash);
  if (!parsed) {
    return { ok: false, isScryptFormat: false };
  }
  const { N, r, p, salt, dk, dkLen } = parsed;

  try {
    const derived = await new Promise<Buffer>((resolve, reject) => {
      crypto.scrypt(providedPassword, salt, dkLen, { N, r, p, maxmem: 32 * 1024 * 1024 }, (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey as Buffer);
      });
    });

    if (derived.length !== dk.length) {
      return { ok: false, isScryptFormat: true };
    }
    const ok = crypto.timingSafeEqual(derived, dk);
    return { ok, isScryptFormat: true };
  } catch {
    return { ok: false, isScryptFormat: true };
  }
}

/**
 * Sync version – uses scryptSync
 */
export function verifyPasswordScryptSync(providedPassword: string, storedHash: string): { ok: boolean; isScryptFormat: boolean } {
  if (!storedHash || !providedPassword) {
    return { ok: false, isScryptFormat: false };
  }
  const parsed = parseScryptHash(storedHash);
  if (!parsed) {
    return { ok: false, isScryptFormat: false };
  }
  const { N, r, p, salt, dk, dkLen } = parsed;
  try {
    const derived = crypto.scryptSync(providedPassword, salt, dkLen, { N, r, p, maxmem: 32 * 1024 * 1024 });
    if (derived.length !== dk.length) {
      return { ok: false, isScryptFormat: true };
    }
    return { ok: crypto.timingSafeEqual(derived, dk), isScryptFormat: true };
  } catch {
    return { ok: false, isScryptFormat: true };
  }
}

/**
 * Helper to generate a scrypt hash locally (for .env.example / README documentation)
 * Not used in auth flow, only for local generation.
 */
export function generateScryptHash(password: string, opts?: Partial<typeof SCRYPT_RECOMMENDED>): string {
  const N = opts?.N ?? SCRYPT_RECOMMENDED.N;
  const r = opts?.r ?? SCRYPT_RECOMMENDED.r;
  const p = opts?.p ?? SCRYPT_RECOMMENDED.p;
  const dkLen = opts?.dkLen ?? SCRYPT_RECOMMENDED.dkLen;
  const saltLen = opts?.saltLen ?? SCRYPT_RECOMMENDED.saltLen;
  const salt = crypto.randomBytes(saltLen);
  const dk = crypto.scryptSync(password, salt, dkLen, { N, r, p, maxmem: 32 * 1024 * 1024 });
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${dk.toString('base64')}`;
}

export function createSessionToken(email: string): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload: AdminSessionPayload = { email, exp };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

export function verifySessionToken(token: string): AdminSessionPayload | null {
  const secret = getSecret();
  if (!secret || !token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  try {
    const sigBuf = Buffer.from(signature);
    const expSigBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expSigBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expSigBuf)) return null;
  } catch {
    return null;
  }
  try {
    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadJson) as AdminSessionPayload;
    if (!payload.email || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    const env = getServerEnv();
    if (env.ADMIN_EMAIL && payload.email !== env.ADMIN_EMAIL) return null;
    return payload;
  } catch {
    return null;
  }
}

export const ADMIN_SESSION_COOKIE = SESSION_COOKIE;
export const ADMIN_SESSION_MAX_AGE = SESSION_MAX_AGE;
