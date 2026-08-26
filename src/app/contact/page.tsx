"use client";
export const dynamic = 'force-dynamic';
import { useState } from "react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <div className="grid lg:grid-cols-2 gap-12">
        <div>
          <div className="text-[11px] tracking-widest uppercase opacity-50">Contact</div>
          <h1 className="mt-3 font-display text-[40px] lg:text-[56px] leading-[0.9]">We’re here to help you find the right gear.</h1>
          <p className="mt-6 text-obsidian/60 max-w-[480px]">Demo contact form – no email delivery is configured. Messages are validated client-side only. Integration point for Resend / SendGrid documented in README.</p>
          <div className="mt-10 space-y-4 text-[14px]">
            <div className="p-4 rounded-xl bg-white border"><div className="font-semibold">Email</div><div className="opacity-60">support@bascosports.demo</div></div>
            <div className="p-4 rounded-xl bg-white border"><div className="font-semibold">Phone (demo)</div><div className="opacity-60">+1 (800) BASCO-01 • Mon-Fri 9am-6pm GMT</div></div>
            <div className="p-4 rounded-xl bg-white border"><div className="font-semibold">London Showroom (by appointment)</div><div className="opacity-60">12 Basco Lane, E1 6PU, London</div></div>
          </div>
        </div>
        <div className="bg-white rounded-[24px] border p-6 lg:p-8 h-fit">
          {sent ? (
            <div className="py-12 text-center"><div className="w-12 h-12 rounded-full bg-lime mx-auto flex items-center justify-center font-bold">✓</div><h3 className="mt-4 font-display text-[22px]">Message received (demo)</h3><p className="mt-2 text-[14px] text-obsidian/60">In live mode this would send via Resend to support@bascosports.com and create a ticket.</p><button onClick={()=>setSent(false)} className="mt-6 h-10 px-6 rounded-full bg-obsidian text-white text-[13px]">Send another</button></div>
          ) : (
            <form onSubmit={e=>{ e.preventDefault(); const f=e.target as HTMLFormElement; const data=new FormData(f); const email=data.get("email") as string; if(!email.includes("@")){ alert("Enter valid email"); return;} setSent(true); }} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="text-[12px] opacity-60">Name</label><input name="name" required placeholder="Alex Morgan" className="mt-1 w-full h-11 px-4 rounded-full border border-stone-200" /></div>
                <div><label className="text-[12px] opacity-60">Email*</label><input name="email" required placeholder="you@example.com" className="mt-1 w-full h-11 px-4 rounded-full border border-stone-200" /></div>
              </div>
              <div><label className="text-[12px] opacity-60">Topic</label><select className="mt-1 w-full h-11 px-4 rounded-full border border-stone-200 bg-white"><option>Product advice</option><option>Order & shipping</option><option>Returns</option><option>Other</option></select></div>
              <div><label className="text-[12px] opacity-60">Message</label><textarea required rows={5} placeholder="How can we help?" className="mt-1 w-full p-4 rounded-[16px] border border-stone-200" /></div>
              <button type="submit" className="w-full h-12 rounded-full bg-obsidian text-white font-semibold">Send message – demo</button>
              <p className="text-[11px] text-center opacity-50">No external email service is called. See README for integration.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
