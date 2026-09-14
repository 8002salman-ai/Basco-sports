import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { MarketingTrafficView } from '../_panels/MarketingViews';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminMarketingTrafficPage() {
  return (
    <AdminPanelGuard>
      <MarketingTrafficView />
    </AdminPanelGuard>
  );
}
