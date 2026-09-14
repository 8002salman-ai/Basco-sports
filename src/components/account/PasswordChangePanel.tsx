'use client';

import { useState } from 'react';

const INPUT_CLS =
  'w-full h-11 px-4 rounded-full border border-stone-300 text-[14px] placeholder:text-obsidian/30 focus:outline-none focus:ring-2 focus:ring-obsidian/20 focus:border-obsidian/40 transition-colors';

const FIELD_LABEL = 'text-[12px] font-medium text-obsidian/70 mb-1.5';

export default function PasswordChangePanel() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    if (!currentPassword || !newPassword) {
      setMessage('Please fill in both password fields.');
      setStatus('error');
      return;
    }
    if (newPassword.length < 8) {
      setMessage('New password must be at least 8 characters.');
      setStatus('error');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match.');
      setStatus('error');
      return;
    }
    if (currentPassword === newPassword) {
      setMessage('New password must be different from the current one.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus('success');
        setMessage('Password updated. Other signed-in devices have been signed out.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error — please try again.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-w-md">
      <div>
        <label htmlFor="current-password" className={FIELD_LABEL}>Current password</label>
        <input
          id="current-password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={INPUT_CLS}
          required
        />
      </div>

      <div>
        <label htmlFor="new-password" className={FIELD_LABEL}>New password</label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={INPUT_CLS}
          required
          minLength={8}
        />
      </div>

      <div>
        <label htmlFor="confirm-password" className={FIELD_LABEL}>Confirm new password</label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={INPUT_CLS}
          required
          minLength={8}
        />
      </div>

      {message && (
        <p
          className={`text-[13px] ${status === 'success' ? 'text-green-700' : 'text-sale'}`}
          role="alert"
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="h-11 px-6 rounded-full bg-obsidian text-white text-[14px] font-semibold hover:bg-obsidian-600 disabled:opacity-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-obsidian"
      >
        {status === 'loading' ? 'Updating…' : 'Update password'}
      </button>
    </form>
  );
}
