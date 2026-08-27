'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

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

export function UserManagementPanel() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null);

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
      const patch: Record<string, any> = {
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
    if (!confirm(`Deactivate ${user.email}? They won't be able to log in.`)) return;
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
      await loadUsers();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const ownerCount = useMemo(() => users.filter(u => u.role === 'owner' && u.is_active).length, [users]);

  if (loading) return <div className="py-20 text-center text-[14px] text-obsidian/50">Loading admin users…</div>;

  if (accessDenied) {
    return (
      <div className="py-20 text-center">
        <div className="text-[48px]">🔒</div>
        <h1 className="mt-4 font-display text-[24px]">Access denied</h1>
        <p className="mt-2 text-[13px] text-obsidian/60">
          Only the <span className="font-semibold">👑 Owner</span> can manage team members.
          Your account role does not have permission to view this page.
        </p>
        <a href="/admin" className="mt-6 inline-flex h-10 px-5 rounded-full bg-obsidian text-white text-[13px] items-center">
          ← Back to overview
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-[28px] leading-none">Team Management</h1>
          <p className="mt-1.5 text-[13px] text-obsidian/60">
            Manage admin accounts. Owner has full access, Admin has limited access (catalog, orders, settings).
          </p>
        </div>
        <button
          onClick={() => { setShowAdd(!showAdd); setAddError(null); }}
          className="h-10 px-5 rounded-full bg-obsidian text-white text-[13px] font-semibold"
        >
          + Add user
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-[12px] bg-red-50 border border-red-200 p-3 text-[13px] text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">dismiss</button>
        </div>
      )}

      {/* Add User Form */}
      {showAdd && (
        <div className="mt-6 bg-white rounded-[16px] border p-6">
          <h3 className="font-semibold text-[15px]">Add Admin User</h3>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] opacity-60">Email</label>
              <input
                value={addEmail}
                onChange={e => setAddEmail(e.target.value)}
                type="email"
                required
                placeholder="user@example.com"
                className="mt-1 w-full h-10 px-4 rounded-[10px] border border-stone-200 text-[13px]"
              />
            </div>
            <div>
              <label className="text-[12px] opacity-60">Password</label>
              <input
                value={addPassword}
                onChange={e => setAddPassword(e.target.value)}
                type="password"
                required
                placeholder="Min 4 characters"
                className="mt-1 w-full h-10 px-4 rounded-[10px] border border-stone-200 text-[13px]"
              />
            </div>
            <div>
              <label className="text-[12px] opacity-60">Name</label>
              <input
                value={addName}
                onChange={e => setAddName(e.target.value)}
                placeholder="Display name"
                className="mt-1 w-full h-10 px-4 rounded-[10px] border border-stone-200 text-[13px]"
              />
            </div>
            <div>
              <label className="text-[12px] opacity-60">Role</label>
              <select
                value={addRole}
                onChange={e => setAddRole(e.target.value as AdminUserRole)}
                className="mt-1 w-full h-10 px-4 rounded-[10px] border border-stone-200 text-[13px]"
              >
                <option value="admin">Admin — limited access</option>
                <option value="owner">Owner — full access</option>
              </select>
            </div>
          </div>
          {addError && (
            <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-[13px] text-red-700">{addError}</div>
          )}
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleAdd}
              disabled={addLoading || !addEmail || !addPassword}
              className="h-10 px-5 rounded-full bg-obsidian text-white text-[13px] font-semibold disabled:opacity-50"
            >
              {addLoading ? 'Creating…' : 'Create user'}
            </button>
            <button
              onClick={() => { setShowAdd(false); setAddError(null); }}
              className="h-10 px-5 rounded-full border border-stone-200 text-[13px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="mt-6 bg-white rounded-[16px] border overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b bg-stone-50 text-[11px] tracking-wider uppercase text-obsidian/50">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold hidden md:table-cell">Created</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b last:border-0 hover:bg-stone-50/60">
                <td className="px-4 py-3 text-[13px] font-medium">{user.name}</td>
                <td className="px-4 py-3 text-[13px] text-obsidian/70">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full border text-[11px] ${
                    user.role === 'owner'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-violet-50 text-violet-700 border-violet-200'
                  }`}>
                    {user.role === 'owner' ? '👑 Owner' : '🔧 Admin'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {user.is_active ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px]">Active</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[11px]">Disabled</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[12px] text-obsidian/50 hidden md:table-cell">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setEditRole(user.role);
                        setEditActive(user.is_active);
                        setEditPassword('');
                      }}
                      className="px-3 py-1 rounded-full border border-stone-200 text-[11px] hover:bg-stone-50"
                    >
                      Edit
                    </button>
                    {user.is_active && user.email !== '8002salman@gmail.com' && (
                      <button
                        onClick={() => handleDeactivate(user)}
                        className="px-3 py-1 rounded-full border border-red-200 text-[11px] text-red-600 hover:bg-red-50"
                      >
                        Disable
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Permission Guide */}
      <div className="mt-6 bg-white rounded-[16px] border p-6">
        <h3 className="font-semibold text-[15px]">Permission Guide</h3>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="font-semibold text-amber-800">👑 Owner</div>
            <ul className="mt-2 space-y-1 text-amber-700 text-[12px]">
              <li>• Full catalog access (view, edit, delete, upload)</li>
              <li>• Full orders management</li>
              <li>• User management (add, edit, block)</li>
              <li>• Team management (add, edit, remove users)</li>
              <li>• Integrations (view, edit)</li>
              <li>• Settings (view, edit)</li>
              <li>• Hermes Intel (view, edit)</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-violet-50 border border-violet-200">
            <div className="font-semibold text-violet-800">🔧 Admin</div>
            <ul className="mt-2 space-y-1 text-violet-700 text-[12px]">
              <li>• Catalog (view, edit — no delete)</li>
              <li>• Orders (view, update status)</li>
              <li>• Users (view only)</li>
              <li>• Settings (view only)</li>
              <li>• Integrations (view only)</li>
              <li>• Hermes Intel (view only)</li>
              <li>• ❌ Cannot manage team</li>
              <li>• ❌ Cannot delete products</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] p-6 max-w-md w-full">
            <h3 className="font-display text-[20px]">Edit: {editingUser.name}</h3>
            <p className="mt-1 text-[13px] text-obsidian/60">{editingUser.email}</p>
            
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-[12px] opacity-60">New Password (leave blank to keep current)</label>
                <input
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  className="mt-1 w-full h-10 px-4 rounded-[10px] border border-stone-200 text-[13px]"
                />
              </div>
              <div>
                <label className="text-[12px] opacity-60">Role</label>
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value as AdminUserRole)}
                  disabled={editingUser.email === '8002salman@gmail.com'}
                  className="mt-1 w-full h-10 px-4 rounded-[10px] border border-stone-200 text-[13px]"
                >
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
                {editingUser.email === '8002salman@gmail.com' && (
                  <p className="mt-1 text-[11px] text-obsidian/50">Owner account cannot be changed</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[12px] opacity-60">Active</label>
                <button
                  onClick={() => setEditActive(!editActive)}
                  className={`w-10 h-6 rounded-full transition-colors ${editActive ? 'bg-emerald-500' : 'bg-stone-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${editActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleEdit}
                disabled={editLoading}
                className="h-10 px-5 rounded-full bg-obsidian text-white text-[13px] font-semibold disabled:opacity-50"
              >
                {editLoading ? 'Saving…' : 'Save changes'}
              </button>
              <button
                onClick={() => { setEditingUser(null); setEditPassword(''); }}
                className="h-10 px-5 rounded-full border border-stone-200 text-[13px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
