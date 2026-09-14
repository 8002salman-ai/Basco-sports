import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { CrmView } from '../_panels/MarketingViews';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminCrmPage() {
  return (
    <AdminPanelGuard>
      <CrmView />
    </AdminPanelGuard>
  );
}
