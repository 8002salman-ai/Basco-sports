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
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Network error');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[480px] mx-auto py-12">
      <div className="bg-white rounded-[24px] border border-stone-200 p-8">
        <div className="w-10 h-10 rounded-xl bg-obsidian text-white flex items-center justify-center font-black">B</div>
        <h1 className="mt-6 font-display text-[28px] leading-none">Admin login</h1>
        <p className="mt-3 text-[13px] text-obsidian/60">
          Requires server env: <code>ADMIN_EMAIL</code>, <code>ADMIN_PASSWORD_HASH</code> (scrypt format <code>scrypt$N$r$p$salt$dk</code>), <code>ADMIN_SESSION_SECRET</code>.
          No credentials are hardcoded. If env not set, this page returns 503 and admin shows dev-only mock.
        </p>

        <div className="mt-6 p-4 rounded-xl bg-stone-50 border text-[12px] leading-relaxed">
          <div className="font-semibold">Security notes – scrypt-only</div>
          <ul className="mt-2 list-disc pl-5 space-y-1 opacity-70">
            <li>Never use email as password, never hardcode secrets.</li>
            <li>Password hash must be scrypt: <code>scrypt$16384$8$1$saltBase64$dkBase64</code> using Node crypto.scrypt, random 16-byte salt, 64-byte derived key, N=16384,r=8,p=1. SHA-256 and bcrypt are rejected.</li>
            <li>Session cookie is httpOnly, HMAC SHA256 signed with ADMIN_SESSION_SECRET, 8h expiry, Secure in production.</li>
            <li>See .env.example and README Admin Hardening for local generation command (no network, no secret logging).</li>
          </ul>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-[12px] opacity-60">Admin email (env ADMIN_EMAIL)</label>
            <input value={email} onChange={e => setEmail(e.target.value)} required type="email" placeholder="admin@example.com" className="mt-1 w-full h-11 px-4 rounded-full border border-stone-200" />
          </div>
          <div>
            <label className="text-[12px] opacity-60">Password (verified against ADMIN_PASSWORD_HASH)</label>
            <input value={password} onChange={e => setPassword(e.target.value)} required type="password" placeholder="••••••••" className="mt-1 w-full h-11 px-4 rounded-full border border-stone-200" />
          </div>
          {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[13px] text-red-700">{error}</div>}
          <button type="submit" disabled={loading} className="w-full h-12 rounded-full bg-obsidian text-white font-semibold disabled:opacity-50">
            {loading ? 'Authenticating…' : 'Log in – server verified'}
          </button>
          <div className="text-[11px] text-center opacity-60">No secret values are displayed in UI. Check server logs for 503 if env not configured.</div>
        </form>

        <div className="mt-6 flex gap-3 text-[12px]">
          <Link href="/admin" className="underline">← Back to admin</Link>
          <Link href="/" className="underline ml-auto">Storefront</Link>
        </div>
      </div>
    </div>
  );
}
