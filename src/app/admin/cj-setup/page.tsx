import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { CjSetupView } from '../_panels/SystemViews';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminCjSetupPage() {
  return (
    <AdminPanelGuard>
      <CjSetupView />
    </AdminPanelGuard>
  );
}
