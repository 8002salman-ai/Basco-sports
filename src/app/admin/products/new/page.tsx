import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { ProductEditorView } from '../../_panels/ProductEditorView';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminNewProductPage() {
  return (
    <AdminPanelGuard>
      <ProductEditorView />
    </AdminPanelGuard>
  );
}
