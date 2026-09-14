'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SignIn, WarningCircle } from '@phosphor-icons/react';
import { Button, Card, Field, INPUT_CLS, Notice } from '@/components/admin/ui';
import { BrandMark } from '@/components/layout/BrandLogo';

export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }
      setSuccess(`Logged in as ${data.role}. Redirecting…`);
      window.setTimeout(() => {
        router.push('/admin');
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[460px] mx-auto py-10">
      <Card bodyClass="p-6">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 bg-obsidian rounded-[10px] flex items-center justify-center">
            <BrandMark className="w-6 h-6 text-lime" />
          </span>
          <div className="leading-tight">
            <span className="block text-[13px] font-bold text-gray-900">Basco Sports</span>
            <span className="block text-[9px] uppercase tracking-[0.2em] text-gray-400 font-medium">Admin Console</span>
          </div>
        </div>

        <h1 className="mt-6 text-xl font-bold text-gray-900 tracking-tight">Sign in</h1>
        <p className="mt-1 text-[12px] text-gray-500">Use your admin account credentials. Sessions are httpOnly and signed.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Email address" required>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              autoComplete="username"
              placeholder="admin@example.com"
              className={INPUT_CLS}
            />
          </Field>
          <Field label="Password" required>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className={INPUT_CLS}
            />
          </Field>

          {error && (
            <Notice tone="red">
              <span className="inline-flex items-center gap-1.5"><WarningCircle size={13} weight="fill" /> {error}</span>
            </Notice>
          )}
          {success && <Notice tone="green">{success}</Notice>}

          <Button type="submit" disabled={loading} className="w-full h-11">
            <SignIn size={15} weight="bold" /> {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div className="mt-6 flex items-center gap-3 text-[12px]">
          <Link href="/admin" className="text-gray-500 hover:text-gray-800 underline underline-offset-4">Back to console</Link>
          <Link href="/" className="text-gray-500 hover:text-gray-800 underline underline-offset-4 ml-auto">Storefront</Link>
        </div>
      </Card>
    </div>
  );
}
