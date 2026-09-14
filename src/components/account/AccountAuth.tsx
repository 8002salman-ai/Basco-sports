'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrandMark } from '@/components/layout/BrandLogo';

type Mode = 'signin' | 'signup';

const LABEL_CLS = 'block text-[12px] font-medium text-obsidian/60';
const INPUT_CLS =
  'mt-1.5 w-full h-11 px-4 rounded-full border border-stone-200 bg-white text-[14px] placeholder:text-obsidian/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-obsidian';

export default function AccountAuth() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const isSignup = mode === 'signup';

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setError('');
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch(isSignup ? '/api/account/signup' : '/api/account/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isSignup ? { email, password, name, orderNumber } : { email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || 'Something went wrong. Try again.');
        setBusy(false);
        return;
      }
      // The session cookie is set; re-render the page as the signed-in customer.
      router.refresh();
    } catch {
      setError('Network error. Check your connection and try again.');
      setBusy(false);
    }
  }

  return (
    <main className="max-w-[480px] mx-auto px-4 sm:px-6 py-16">
      <div className="bg-white rounded-[24px] border border-stone-200 p-8">
        <span className="w-9 h-9 bg-obsidian rounded-[10px] flex items-center justify-center">
          <BrandMark className="w-6 h-6 text-lime" />
        </span>

        <h1 className="mt-6 font-display text-[28px] leading-none">
          {isSignup ? 'Create your account' : 'Sign in'}
        </h1>
        <p className="mt-3 text-[14px] text-obsidian/60">
          {isSignup
            ? 'Your order history, saved addresses and wishlist in one place.'
            : 'Welcome back — sign in to see your orders.'}
        </p>

        <div className="mt-6 flex gap-1 rounded-full bg-stone-100 p-1">
          {([['signin', 'Sign in'], ['signup', 'Create account']] as [Mode, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => switchMode(value)}
              className={`flex-1 h-9 rounded-full text-[13px] font-medium transition-colors ${
                mode === value ? 'bg-obsidian text-white' : 'text-obsidian/60 hover:text-obsidian'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {isSignup && (
            <div>
              <label htmlFor="account-name" className={LABEL_CLS}>
                Name
              </label>
              <input
                id="account-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Salman Bashir"
                className={INPUT_CLS}
              />
            </div>
          )}

          <div>
            <label htmlFor="account-email" className={LABEL_CLS}>
              Email
            </label>
            <input
              id="account-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              placeholder="you@example.com"
              className={INPUT_CLS}
            />
          </div>

          <div>
            <label htmlFor="account-password" className={LABEL_CLS}>
              Password
            </label>
            <input
              id="account-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              placeholder="••••••••"
              className={INPUT_CLS}
            />
            {isSignup && <p className="mt-1.5 text-[11px] text-obsidian/50">At least 8 characters.</p>}
          </div>

          {isSignup && (
            <div>
              <label htmlFor="account-order" className={LABEL_CLS}>
                Order number
              </label>
              <input
                id="account-order"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="BS-123456"
                className={INPUT_CLS}
              />
              <p className="mt-1.5 text-[11px] text-obsidian/50">
                It is in your order confirmation email — we ask so the account is confirmed to belong to you.{' '}
                <Link href="/track" className="underline underline-offset-4 hover:text-obsidian">
                  Look up an order
                </Link>
              </p>
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-xl bg-sale-light px-4 py-3 text-[13px] text-sale">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full h-12 rounded-full bg-obsidian text-white font-semibold text-[15px] hover:bg-obsidian-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-[11px] text-obsidian/50">
          Sessions are signed and httpOnly. Need help with an order? Contact support@basco-sports.com.
        </p>
      </div>
    </main>
  );
}
