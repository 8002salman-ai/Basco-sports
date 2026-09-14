import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { BlogsView } from '../_panels/ContentView';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminBlogsPage() {
  return (
    <AdminPanelGuard>
      <BlogsView />
    </AdminPanelGuard>
  );
}
