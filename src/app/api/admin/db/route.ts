import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerEnv, isAdminConfigured } from '@/lib/env';
import { verifySessionToken, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';
import { SupabaseAdapter } from '@/lib/admin/db';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

interface DbRequest {
  table: string;
  action: 'list' | 'get' | 'findFirst' | 'insert' | 'insertRaw' | 'update' | 'updateBy' | 'remove';
  payload?: any;
}

const SAFE_TABLES = new Set(['products', 'orders', 'users', 'store_settings', 'admin_users', 'product_reviews']);

/**
 * Server-side admin DB proxy.
 * The client admin panels talk to this route (never to Supabase directly),
 * so the SUPABASE_SERVICE_ROLE_KEY stays server-only and RLS admin policies
 * are enforced through the signed-in role.
 */
export async function POST(req: NextRequest) {
  const serverEnv = getServerEnv();
  const configured = isAdminConfigured(serverEnv);

  // Auth gate: same as admin pages – session required when env is configured,
  // dev-mock allowed when it isn't (matches /admin behavior).
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const isAuthenticated = !!session || !configured;

  if (!isAuthenticated) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Admin DB proxy not configured – set SUPABASE_SERVICE_ROLE_KEY (server-only env) plus NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY in deployment env. See .env.example.',
      },
      { status: 503 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  if (!supabaseUrl) {
    return NextResponse.json(
      { ok: false, error: 'NEXT_PUBLIC_SUPABASE_URL is not set' },
      { status: 503 }
    );
  }

  let body: DbRequest;
  try {
    body = (await req.json()) as DbRequest;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body?.table || !SAFE_TABLES.has(body.table)) {
    return NextResponse.json({ ok: false, error: 'Unknown table' }, { status: 400 });
  }

  // Service-role key in both apikey + Bearer headers → bypasses RLS for admin CRUD.
  const adapter = new SupabaseAdapter(supabaseUrl, serverEnv.SUPABASE_SERVICE_ROLE_KEY, serverEnv.SUPABASE_SERVICE_ROLE_KEY);
  const { action, payload } = body;

  try {
    let data: unknown;
    switch (action) {
      case 'list':
        data = await adapter.list(body.table, payload?.opts);
        break;
      case 'get':
        data = await adapter.get(body.table, payload?.id);
        break;
      case 'findFirst':
        data = await adapter.findFirst(body.table, payload?.column, payload?.value);
        break;
      case 'insert':
        data = await adapter.insert(body.table, payload?.row);
        break;
      case 'insertRaw':
        data = await adapter.insertRaw(body.table, payload?.row);
        break;
      case 'update':
        data = await adapter.update(body.table, payload?.id, payload?.patch);
        break;
      case 'updateBy':
        data = await adapter.updateBy(body.table, payload?.column, payload?.value, payload?.patch);
        break;
      case 'remove':
        await adapter.remove(body.table, payload?.id);
        data = { removed: true };
        break;
      default:
        return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
    }
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message || 'DB operation failed' }, { status: 500 });
  }
}
