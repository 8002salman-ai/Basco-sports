import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { GiftDropView } from '../_panels/CommerceViews';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminGiftDropPage() {
  return (
    <AdminPanelGuard>
      <GiftDropView />
    </AdminPanelGuard>
  );
}
