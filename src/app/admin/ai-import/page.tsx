import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { AiImportView } from '../_panels/AiStudioViews';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminAiImportPage() {
  return (
    <AdminPanelGuard>
      <AiImportView />
    </AdminPanelGuard>
  );
}
