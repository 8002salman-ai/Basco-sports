import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { HermesPanel } from '../_panels/HermesPanel';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminHermesPage() {
  return (
    <AdminPanelGuard>
      <HermesPanel />
    </AdminPanelGuard>
  );
}
