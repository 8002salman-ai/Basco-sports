import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { verifySessionToken, ADMIN_SESSION_COOKIE, type AdminSessionPayload } from '@/lib/admin-auth';
import { AdminShell, type AdminSessionInfo } from '@/components/admin/AdminShell';

export const metadata: Metadata = {
  title: 'Admin – Basco Sports',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session: AdminSessionPayload | null = token ? await verifySessionToken(token) : null;

  const info: AdminSessionInfo | null = session
    ? { name: session.name, email: session.email, role: session.role }
    : null;

  return <AdminShell session={info}>{children}</AdminShell>;
}
