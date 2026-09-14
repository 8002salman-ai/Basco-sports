import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { PaymentsView } from '../_panels/SystemViews';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminPaymentsPage() {
  return (
    <AdminPanelGuard>
      <PaymentsView />
    </AdminPanelGuard>
  );
}
