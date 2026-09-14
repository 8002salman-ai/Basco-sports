import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { ListingPlaybookView } from '../../_panels/SystemViews';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminListingPlaybookPage() {
  return (
    <AdminPanelGuard>
      <ListingPlaybookView />
    </AdminPanelGuard>
  );
}
