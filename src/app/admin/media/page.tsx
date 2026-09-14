import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { MediaView } from '../_panels/ContentView';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminMediaPage() {
  return (
    <AdminPanelGuard>
      <MediaView />
    </AdminPanelGuard>
  );
}
