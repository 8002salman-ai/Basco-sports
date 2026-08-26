import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { UsersPanel } from '../_panels/UsersPanel';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminUsersPage() {
  return (
    <AdminPanelGuard>
      <UsersPanel />
    </AdminPanelGuard>
  );
}
