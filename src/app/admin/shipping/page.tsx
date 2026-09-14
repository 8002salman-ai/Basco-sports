import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { ShippingView } from '../_panels/SystemViews';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminShippingPage() {
  return (
    <AdminPanelGuard>
      <ShippingView />
    </AdminPanelGuard>
  );
}
