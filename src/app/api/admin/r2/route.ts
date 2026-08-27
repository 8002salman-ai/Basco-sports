import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerEnv, isAdminConfigured } from '@/lib/env';
import { verifySessionToken, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';
import { SupabaseAdapter } from '@/lib/admin/db';
import { r2Upload, r2Delete, r2List, r2ConfigFromSettings } from '@/lib/r2-client';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

/**
 * Server-side R2 proxy. Reads credentials from store_settings,
 * performs S3-compatible operations. Keys never reach the browser.
 */

async function getR2Config(req: NextRequest) {
  const serverEnv = getServerEnv();
  const configured = isAdminConfigured(serverEnv);
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const isAuthenticated = !!session || !configured;

  if (!isAuthenticated) return { error: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }) };

  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { error: NextResponse.json({ ok: false, error: 'DB not configured' }, { status: 503 }) };
  }

  const adapter = new SupabaseAdapter(process.env.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, serverEnv.SUPABASE_SERVICE_ROLE_KEY);
  const row = await adapter.findFirst('store_settings', 'key', 'basco-store') as Record<string, any>;
  if (!row) return { error: NextResponse.json({ ok: false, error: 'No store settings – configure R2 in Integrations first' }, { status: 503 }) };

  const config = r2ConfigFromSettings(row);
  if (!config) return { error: NextResponse.json({ ok: false, error: 'R2 not configured – fill all R2 fields in Integrations' }, { status: 503 }) };

  return { config };
}

// POST /api/admin/r2  { action: 'upload' | 'list' | 'delete', ... }
export async function POST(req: NextRequest) {
  const result = await getR2Config(req);
  if ('error' in result) return result.error;
  const { config } = result;

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }); }

  const { action } = body;

  try {
    switch (action) {
      case 'upload': {
        // body: { key, file (base64), contentType }
        const { key, file, contentType: ct } = body;
        if (!key || !file) return NextResponse.json({ ok: false, error: 'Missing key or file' }, { status: 400 });
        const binaryStr = atob(file);
        const ab = new ArrayBuffer(binaryStr.length);
        const view = new Uint8Array(ab);
        for (let i = 0; i < binaryStr.length; i++) view[i] = binaryStr.charCodeAt(i);
        const result = await r2Upload(config, key, ab, { contentType: ct });
        return NextResponse.json({ ok: true, data: result });
      }

      case 'uploadUrl': {
        // body: { key, url, contentType }
        const { key, url: srcUrl, contentType: ct } = body;
        if (!key || !srcUrl) return NextResponse.json({ ok: false, error: 'Missing key or url' }, { status: 400 });
        const resp = await fetch(srcUrl);
        if (!resp.ok) return NextResponse.json({ ok: false, error: `Failed to fetch source: ${resp.status}` }, { status: 400 });
        const ab = await resp.arrayBuffer();
        const result = await r2Upload(config, key, ab as ArrayBuffer, { contentType: ct || resp.headers.get('content-type') || undefined });
        return NextResponse.json({ ok: true, data: result });
      }

      case 'list': {
        const { prefix } = body;
        const items = await r2List(config, prefix);
        return NextResponse.json({ ok: true, data: items });
      }

      case 'delete': {
        const { key } = body;
        if (!key) return NextResponse.json({ ok: false, error: 'Missing key' }, { status: 400 });
        await r2Delete(config, key);
        return NextResponse.json({ ok: true, data: { deleted: key } });
      }

      default:
        return NextResponse.json({ ok: false, error: 'Unknown action. Use: upload, uploadUrl, list, delete' }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message || 'R2 operation failed' }, { status: 500 });
  }
}
