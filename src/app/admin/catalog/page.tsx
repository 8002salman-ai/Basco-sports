import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { CatalogPanel } from '../_panels/CatalogPanel';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminCatalogPage() {
  return (
    <AdminPanelGuard>
      <CatalogPanel />
    </AdminPanelGuard>
  );
}
