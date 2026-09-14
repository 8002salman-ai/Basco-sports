import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { OrdersView } from '../_panels/CommerceViews';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminOrdersPage() {
  return (
    <AdminPanelGuard>
      <OrdersView />
    </AdminPanelGuard>
  );
}
