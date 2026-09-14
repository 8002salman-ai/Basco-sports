import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { CategoriesView } from '../_panels/CatalogViews';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminCategoriesPage() {
  return (
    <AdminPanelGuard>
      <CategoriesView />
    </AdminPanelGuard>
  );
}
