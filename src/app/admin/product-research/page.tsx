import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { ProductResearchView } from '../_panels/AiIntelViews';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminProductResearchPage() {
  return (
    <AdminPanelGuard>
      <ProductResearchView />
    </AdminPanelGuard>
  );
}
