import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { HermesIntelView } from '../_panels/AiIntelViews';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminHermesIntelPage() {
  return (
    <AdminPanelGuard>
      <HermesIntelView />
    </AdminPanelGuard>
  );
}
