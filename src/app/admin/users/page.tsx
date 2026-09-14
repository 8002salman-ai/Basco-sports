import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { UsersView } from '../_panels/CommerceViews';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminUsersPage() {
  return (
    <AdminPanelGuard>
      <UsersView />
    </AdminPanelGuard>
  );
}
