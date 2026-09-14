import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { MarketingGenView } from '../_panels/MarketingViews';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminMarketingPage() {
  return (
    <AdminPanelGuard>
      <MarketingGenView />
    </AdminPanelGuard>
  );
}
