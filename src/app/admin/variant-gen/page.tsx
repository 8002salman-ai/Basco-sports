import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { VariantGenView } from '../_panels/AiStudioViews';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminVariantGenPage() {
  return (
    <AdminPanelGuard>
      <VariantGenView />
    </AdminPanelGuard>
  );
}
