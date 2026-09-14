import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { ScoutView } from '../_panels/AiIntelViews';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminScoutPage() {
  return (
    <AdminPanelGuard>
      <ScoutView />
    </AdminPanelGuard>
  );
}
