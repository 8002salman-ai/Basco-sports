"use client";
export const dynamic = 'force-dynamic';
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  { q: "Is this a real store? Will I be charged?", a: "No – Basco Sports is currently in demo mode. Checkout UI is fully functional but no real payment is collected. Payment adapter is documented in src/lib/payment-adapter.ts. See README 'Payments later'." },
  { q: "What is your shipping policy?", a: "Free standard shipping over $100 (2-4 days, tracked). $9.50 under $100. Express 1-2 days $18. International coming soon. See Shipping & Returns page." },
  { q: "How do returns work?", a: "30-day free returns with prepaid label. Items must be unused with tags. Worn shoes can be returned if defective – we offer repair first." },
  { q: "How does coupon work?", a: "Demo coupons: BASCO10 (10% off $100+), WELCOME15 (15% off $75+), TRAIN20 (20% off $150+). Applied client-side, persisted in localStorage." },
  { q: "Are products real?", a: "Product data is seeded mock data with plausible specs, inspired by real categories but original Basco naming. Images are from Unsplash with permissive license." },
  { q: "How do cart and wishlist persist?", a: "Via localStorage keys basco-cart-v1 and basco-wishlist-v1. Cleared when you clear browser storage. No backend DB yet." },
  { q: "How to add Stripe later?", a: "See README and src/lib/payment-adapter.ts. Add env vars STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, implement StripePaymentProvider, create API route /api/checkout." },
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <div className="text-[11px] tracking-widest uppercase opacity-50">Support</div>
      <h1 className="mt-3 font-display text-[40px] leading-[0.9]">Frequently asked questions</h1>
      <div className="mt-10 bg-white rounded-[24px] border divide-y">
        {faqs.map((f,i)=>(
          <div key={i}>
            <button onClick={()=>setOpen(open===i?null:i)} className="w-full flex items-center justify-between p-6 text-left">
              <span className="font-medium text-[15px]">{f.q}</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform", open===i && "rotate-180")} />
            </button>
            {open===i && <div className="px-6 pb-6 text-[14px] text-obsidian/70 leading-relaxed">{f.a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
