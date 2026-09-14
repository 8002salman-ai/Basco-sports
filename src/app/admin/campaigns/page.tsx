import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { CampaignsView } from '../_panels/CommerceViews';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminCampaignsPage() {
  return (
    <AdminPanelGuard>
      <CampaignsView />
    </AdminPanelGuard>
  );
}
