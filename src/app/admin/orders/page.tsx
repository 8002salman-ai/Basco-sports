import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { OrdersPanel } from '../_panels/OrdersPanel';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminOrdersPage() {
  return (
    <AdminPanelGuard>
      <OrdersPanel />
    </AdminPanelGuard>
  );
}
