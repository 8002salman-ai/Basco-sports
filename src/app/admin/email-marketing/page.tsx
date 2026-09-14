import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { EmailMarketingView } from '../_panels/MarketingViews';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminEmailMarketingPage() {
  return (
    <AdminPanelGuard>
      <EmailMarketingView />
    </AdminPanelGuard>
  );
}
