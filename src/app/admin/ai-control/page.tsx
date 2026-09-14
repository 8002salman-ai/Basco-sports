import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { AiControlView } from '../_panels/AiIntelViews';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminAiControlPage() {
  return (
    <AdminPanelGuard>
      <AiControlView />
    </AdminPanelGuard>
  );
}
