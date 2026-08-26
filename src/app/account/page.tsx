"use client";
export const dynamic = 'force-dynamic';
import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/CartContext";
import { products } from "@/data/products";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";

export default function AccountPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const { wishlist } = useCart();
  const wishProducts = products.filter(p=>wishlist.includes(p.id));

  if (!loggedIn) {
    return (
      <div className="max-w-[480px] mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white rounded-[24px] border border-stone-200 p-8">
          <div className="w-10 h-10 rounded-xl bg-obsidian text-white flex items-center justify-center font-black">B</div>
          <h1 className="mt-6 font-display text-[28px] leading-none">Account • Demo login</h1>
          <p className="mt-3 text-[14px] text-obsidian/60">Demo authentication UI – no real auth. Enter any email to view dashboard placeholder. Real auth will be added when provider (Clerk/Auth.js/Supabase) is chosen. See README.</p>
          <form onSubmit={e=>{ e.preventDefault(); if(email.includes("@")) setLoggedIn(true); }} className="mt-8 space-y-4">
            <div><label className="text-[12px] opacity-60">Email</label><input value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com" className="mt-1 w-full h-11 px-4 rounded-full border border-stone-200" /></div>
            <div><label className="text-[12px] opacity-60">Password (demo – any)</label><input type="password" placeholder="••••••••" className="mt-1 w-full h-11 px-4 rounded-full border border-stone-200" /></div>
            <button type="submit" className="w-full h-12 rounded-full bg-obsidian text-white font-semibold">Continue – demo login</button>
            <div className="text-[11px] text-center opacity-60">Demo mode – no account is created. Adapter ready for real auth.</div>
          </form>
          <div className="mt-6 p-4 rounded-xl bg-stone-50 border text-[12px]"><div className="font-semibold">Future auth integration</div><div className="opacity-70 mt-1">Add env: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY or AUTH_SECRET. Implement middleware and server session check. See README “Auth later”.</div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[32px]">Hello, {email.split("@")[0]} • Demo account</h1>
        <button onClick={()=>setLoggedIn(false)} className="h-10 px-5 rounded-full border">Log out (demo)</button>
      </div>
      <div className="mt-8 grid lg:grid-cols-[260px_1fr] gap-8">
        <aside className="bg-white rounded-[20px] border p-4 h-fit">
          <nav className="space-y-1 text-[14px]">
            <div className="px-3 py-2 rounded-full bg-obsidian text-white">Overview</div>
            <Link href="/account" className="block px-3 py-2 rounded-full hover:bg-stone-100">Orders (0)</Link>
            <Link href="/account" className="block px-3 py-2 rounded-full hover:bg-stone-100">Addresses</Link>
            <Link href="/account" className="block px-3 py-2 rounded-full hover:bg-stone-100">Wishlist ({wishProducts.length})</Link>
            <Link href="/account" className="block px-3 py-2 rounded-full hover:bg-stone-100">Settings</Link>
          </nav>
        </aside>
        <div className="space-y-6">
          <div className="bg-white rounded-[20px] border p-6">
            <h3 className="font-semibold">Orders</h3>
            <p className="text-[14px] text-obsidian/60 mt-2">No orders yet – demo account. When live DB (Supabase/Postgres) is connected, orders from Stripe webhook will appear here.</p>
          </div>
          <div className="bg-white rounded-[20px] border p-6">
            <h3 className="font-semibold">Wishlist • {wishProducts.length}</h3>
            {wishProducts.length===0 ? <p className="text-[14px] text-obsidian/60 mt-2">No saved items. Heart products to save them – persists in localStorage.</p> :
              <div className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-4">
                {wishProducts.map(p=>(
                  <div key={p.id} className="flex gap-3 p-3 rounded-xl bg-stone-50 border">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white"><Image src={p.images[0]} alt="" fill className="object-cover" /></div>
                    <div><div className="text-[13px] font-medium leading-tight">{p.name}</div><div className="text-[12px] opacity-60">{formatPrice(p.price)}</div><Link href={`/product/${p.slug}`} className="text-[12px] underline">View</Link></div>
                  </div>
                ))}
              </div>
            }
          </div>
          <div className="bg-white rounded-[20px] border p-6">
            <h3 className="font-semibold">Addresses (demo placeholder)</h3>
            <p className="text-[14px] text-obsidian/60 mt-2">No saved addresses. Add address at checkout – will be stored when DB is integrated.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
