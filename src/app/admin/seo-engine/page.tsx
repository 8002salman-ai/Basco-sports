import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { SeoEngineView } from '../_panels/MarketingViews';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminSeoEnginePage() {
  return (
    <AdminPanelGuard>
      <SeoEngineView />
    </AdminPanelGuard>
  );
}
