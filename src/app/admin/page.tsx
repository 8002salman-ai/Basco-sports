import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { DashboardView } from './_panels/DashboardView';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminDashboardPage() {
  return (
    <AdminPanelGuard>
      <DashboardView />
    </AdminPanelGuard>
  );
}
