import { AdminPanelGuard, adminRuntime } from '@/lib/admin/guard';
import { SettingsPanel } from '../_panels/SettingsPanel';

export const dynamic = adminRuntime.dynamic;
export const runtime = adminRuntime.runtime;

export default async function AdminSettingsPage() {
  return (
    <AdminPanelGuard>
      <SettingsPanel />
    </AdminPanelGuard>
  );
}
