import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { ReviewsPanel } from '../_panels/ReviewsPanel';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default function AdminReviewsPage() {
  return (
    <AdminPanelGuard>
      <ReviewsPanel />
    </AdminPanelGuard>
  );
}
