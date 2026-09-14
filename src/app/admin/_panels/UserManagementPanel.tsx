'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, ShieldCheck, Wrench, LockSimple, PencilSimple, Prohibit, WarningCircle } from '@phosphor-icons/react';
import {
  Badge, Button, Card, Field, INPUT_CLS, Modal, Notice, PageHeader, SELECT_CLS,
  Spinner, StatCard, StatGrid, Toggle,
} from '@/components/admin/ui';
import { DataTable, type Column } from '@/components/admin/table';
import Link from 'next/link';

type AdminUserRole = 'owner' | 'admin';

interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  role: AdminUserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** The founding owner account can never be demoted or disabled from the panel. */
const PROTECTED_EMAIL = '8002salman@gmail.com';

export function UserManagementPanel() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null);
  const [deactivating, setDeactivating] = useState<AdminUserRow | null>(null);

  // Add form
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addName, setAddName] = useState('');
  const [addRole, setAddRole] = useState<AdminUserRole>('admin');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit form
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<AdminUserRole>('admin');
  const [editActive, setEditActive] = useState(true);
  const [editLoading, setEditLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/admin-users');
      if (res.status === 401) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.ok) {
        setUsers(data.data);
      } else {
        setError(data.error || 'Failed to load users');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleAdd = async () => {
    setAddLoading(true);
    setAddError(null);
    try {
      const res = await fetch('/api/admin/admin-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: addEmail.trim(),
          password: addPassword,
          name: addName.trim() || addEmail.trim(),
          role: addRole,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setAddError(data.error);
        return;
      }
      setShowAdd(false);
      setAddEmail('');
      setAddPassword('');
      setAddName('');
      setAddRole('admin');
      await loadUsers();
    } catch (e) {
      setAddError((e as Error).message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingUser) return;
    setEditLoading(true);
    try {
      const patch: Record<string, unknown> = {
        id: editingUser.id,
        role: editRole,
        is_active: editActive,
      };
      if (editPassword) patch.password = editPassword;

      const res = await fetch('/api/admin/admin-users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error);
        return;
      }
      setEditingUser(null);
      setEditPassword('');
      await loadUsers();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeactivate = async (user: AdminUserRow) => {
    try {
      const res = await fetch('/api/admin/admin-users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error);
        return;
      }
      setDeactivating(null);
      await loadUsers();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const counts = useMemo(
    () => ({
      owners: users.filter((u) => u.role === 'owner' && u.is_active).length,
      admins: users.filter((u) => u.role === 'admin' && u.is_active).length,
      disabled: users.filter((u) => !u.is_active).length,
    }),
    [users]
  );

  if (loading) return <Spinner label="Loading admin users…" />;

  if (accessDenied) {
    return (
      <Card bodyClass="p-12 text-center">
        <LockSimple size={36} weight="bold" className="text-gray-300 mx-auto" />
        <h1 className="mt-4 text-xl font-bold text-gray-900">Access denied</h1>
        <p className="mt-2 text-[13px] text-gray-500">
          Only an <strong>Owner</strong> can manage team members. Your account role does not have permission to view this page.
        </p>
        <Link href="/admin" className="mt-6 inline-flex"><Button>Back to dashboard</Button></Link>
      </Card>
    );
  }

  const columns: Column<AdminUserRow>[] = [
    { key: 'name', header: 'Name', cell: (u) => <span className="font-medium text-gray-900">{u.name}</span>, sortValue: (u) => u.name },
    { key: 'email', header: 'Email', cell: (u) => <span className="text-gray-600">{u.email}</span>, sortValue: (u) => u.email },
    {
      key: 'role',
      header: 'Role',
      cell: (u) => (
        <Badge tone={u.role === 'owner' ? 'amber' : 'violet'}>
          <span className="inline-flex items-center gap-1">
            {u.role === 'owner' ? <ShieldCheck size={11} weight="fill" /> : <Wrench size={11} />}
            {u.role}
          </span>
        </Badge>
      ),
      sortValue: (u) => u.role,
    },
    { key: 'status', header: 'Status', cell: (u) => <Badge tone={u.is_active ? 'green' : 'red'}>{u.is_active ? 'active' : 'disabled'}</Badge>, sortValue: (u) => (u.is_active ? 1 : 0) },
    { key: 'created', header: 'Created', cell: (u) => <span className="text-gray-500">{new Date(u.created_at).toLocaleDateString('en-GB')}</span>, sortValue: (u) => u.created_at },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Team Management"
        subtitle="Owner accounts have full access; Admin accounts are limited to catalogue, orders and read-only settings."
        actions={<Button onClick={() => { setShowAdd(!showAdd); setAddError(null); }}><Plus size={14} weight="bold" /> Add user</Button>}
      />

      <StatGrid cols={3}>
        <StatCard label="Owners" value={counts.owners} hint="full access" icon={<ShieldCheck size={15} weight="bold" />} tone="amber" />
        <StatCard label="Admins" value={counts.admins} hint="limited access" icon={<Wrench size={15} weight="bold" />} tone="violet" />
        <StatCard label="Disabled" value={counts.disabled} hint="cannot sign in" icon={<Prohibit size={15} weight="bold" />} tone="rose" />
      </StatGrid>

      {error && (
        <Notice tone="red">
          <span className="inline-flex items-start gap-1.5">
            <WarningCircle size={13} weight="fill" className="mt-px" />
            {error}
          </span>
          <button onClick={() => setError(null)} className="ml-2 underline font-semibold">Dismiss</button>
        </Notice>
      )}

      {showAdd && (
        <Card title="Add admin user">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Email" required>
              <input value={addEmail} onChange={(e) => setAddEmail(e.target.value)} type="email" placeholder="user@example.com" className={INPUT_CLS} />
            </Field>
            <Field label="Password" required hint="Minimum 4 characters.">
              <input value={addPassword} onChange={(e) => setAddPassword(e.target.value)} type="password" placeholder="••••••••" className={INPUT_CLS} />
            </Field>
            <Field label="Name">
              <input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Display name" className={INPUT_CLS} />
            </Field>
            <Field label="Role">
              <select value={addRole} onChange={(e) => setAddRole(e.target.value as AdminUserRole)} className={`${SELECT_CLS} w-full`}>
                <option value="admin">Admin — limited access</option>
                <option value="owner">Owner — full access</option>
              </select>
            </Field>
          </div>
          {addError && <div className="mt-3"><Notice tone="red">{addError}</Notice></div>}
          <div className="mt-4 flex gap-2">
            <Button onClick={handleAdd} disabled={addLoading || !addEmail || !addPassword}>{addLoading ? 'Creating…' : 'Create user'}</Button>
            <Button variant="secondary" onClick={() => { setShowAdd(false); setAddError(null); }}>Cancel</Button>
          </div>
        </Card>
      )}

      <Card bodyClass="p-4">
        <DataTable
          rows={users}
          columns={columns}
          perPage={10}
          empty={{ title: 'No admin users yet', hint: 'Add a teammate to give them console access.', icon: <ShieldCheck size={16} /> }}
          rowActions={(u) => (
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => { setEditingUser(u); setEditRole(u.role); setEditActive(u.is_active); setEditPassword(''); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                aria-label={`Edit ${u.name}`}
                title="Edit"
              >
                <PencilSimple size={14} />
              </button>
              {u.is_active && u.email !== PROTECTED_EMAIL && (
                <button
                  type="button"
                  onClick={() => setDeactivating(u)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                  aria-label={`Disable ${u.name}`}
                  title="Disable"
                >
                  <Prohibit size={14} />
                </button>
              )}
            </div>
          )}
        />
      </Card>

      <div className="grid sm:grid-cols-2 gap-3">
        <Card title={<span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} weight="fill" className="text-amber-500" /> Owner</span>} bodyClass="p-4">
          <ul className="space-y-1.5 text-[12px] text-gray-700">
            {[
              'Full catalog access — view, edit, delete, upload',
              'Full orders management',
              'Customer user management',
              'Team management (this screen)',
              'Integrations and settings (view, edit)',
              'AI Intelligence (view, edit)',
            ].map((t) => <li key={t} className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span>{t}</li>)}
          </ul>
        </Card>
        <Card title={<span className="inline-flex items-center gap-1.5"><Wrench size={14} className="text-violet-500" /> Admin</span>} bodyClass="p-4">
          <ul className="space-y-1.5 text-[12px] text-gray-700">
            {[
              'Catalog — view, edit (no delete)',
              'Orders — view, update status',
              'Users — view only',
              'Settings and integrations — view only',
              'AI Intelligence — view only',
              'Cannot manage team members',
            ].map((t) => <li key={t} className="flex items-start gap-2"><span className="text-gray-400 mt-0.5">•</span>{t}</li>)}
            <li className="flex items-start gap-2 text-rose-600"><Prohibit size={13} className="mt-0.5" /> Cannot delete products</li>
          </ul>
        </Card>
      </div>

      <Modal open={!!editingUser} onClose={() => { setEditingUser(null); setEditPassword(''); }} title={editingUser ? `Edit ${editingUser.name}` : 'Edit user'}>
        {editingUser && (
          <div className="space-y-4">
            <p className="text-[12px] text-gray-500">{editingUser.email}</p>
            <Field label="New password" hint="Leave blank to keep the current password.">
              <input value={editPassword} onChange={(e) => setEditPassword(e.target.value)} type="password" placeholder="••••••••" className={INPUT_CLS} />
            </Field>
            <Field label="Role" hint={editingUser.email === PROTECTED_EMAIL ? 'The founding owner account cannot be changed.' : undefined}>
              <select value={editRole} onChange={(e) => setEditRole(e.target.value as AdminUserRole)} disabled={editingUser.email === PROTECTED_EMAIL} className={`${SELECT_CLS} w-full disabled:opacity-60`}>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </Field>
            <Toggle on={editActive} onChange={setEditActive} label={editActive ? 'Active' : 'Disabled'} />
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" onClick={() => { setEditingUser(null); setEditPassword(''); }}>Cancel</Button>
              <Button onClick={handleEdit} disabled={editLoading}>{editLoading ? 'Saving…' : 'Save changes'}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!deactivating} onClose={() => setDeactivating(null)} title="Disable admin user">
        <p className="text-[13px] text-gray-600">
          Disable <strong>{deactivating?.name}</strong> ({deactivating?.email})? They will keep their account but cannot sign in to the console.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeactivating(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => deactivating && handleDeactivate(deactivating)}>Disable user</Button>
        </div>
      </Modal>
    </div>
  );
}
