import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { ReviewsView } from '../_panels/CommerceViews';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminReviewsPage() {
  return (
    <AdminPanelGuard>
      <ReviewsView />
    </AdminPanelGuard>
  );
}
