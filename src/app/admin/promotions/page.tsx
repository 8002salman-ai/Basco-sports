import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { PromotionsView } from '../_panels/CatalogViews';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminPromotionsPage() {
  return (
    <AdminPanelGuard>
      <PromotionsView />
    </AdminPanelGuard>
  );
}
