"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
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
      setSuccess(`Logged in as ${data.role}!`);
      setTimeout(() => {
        router.push('/admin');
        router.refresh();
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Network error');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[480px] mx-auto py-12">
      <div className="bg-white rounded-[24px] border border-stone-200 p-8">
        <div className="w-10 h-10 rounded-xl bg-obsidian text-white flex items-center justify-center font-black">B</div>
        <h1 className="mt-6 font-display text-[28px] leading-none">Admin Login</h1>
        <p className="mt-3 text-[13px] text-obsidian/60">
          Sign in with your admin account credentials.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-[12px] opacity-60">Email address</label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              type="email"
              placeholder="admin@example.com"
              className="mt-1 w-full h-11 px-4 rounded-full border border-stone-200 focus:outline-none focus:ring-2 focus:ring-lime-300"
            />
          </div>
          <div>
            <label className="text-[12px] opacity-60">Password</label>
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              type="password"
              placeholder="••••••••"
              className="mt-1 w-full h-11 px-4 rounded-full border border-stone-200 focus:outline-none focus:ring-2 focus:ring-lime-300"
            />
          </div>
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[13px] text-red-700">{error}</div>
          )}
          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[13px] text-emerald-700">{success}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-obsidian text-white font-semibold disabled:opacity-50 hover:bg-obsidian/90 transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 flex gap-3 text-[12px]">
          <Link href="/admin" className="underline">← Back to admin</Link>
          <Link href="/" className="underline ml-auto">Storefront</Link>
        </div>
      </div>
    </div>
  );
}
