import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { ListingTaskView } from '../_panels/AiStudioViews';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminListingTaskPage() {
  return (
    <AdminPanelGuard>
      <ListingTaskView />
    </AdminPanelGuard>
  );
}
