import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { ProductsView } from '../_panels/CatalogViews';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminProductsPage() {
  return (
    <AdminPanelGuard>
      <ProductsView />
    </AdminPanelGuard>
  );
}
