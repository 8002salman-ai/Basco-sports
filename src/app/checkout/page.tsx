"use client";
export const dynamic = 'force-dynamic';
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/cart/CartContext";
import { products } from "@/data/products";
import { formatPrice } from "@/lib/utils";
import { paymentProvider } from "@/lib/payment-adapter";
import { Lock, ShieldCheck, CreditCard, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutPage() {
  const { items, subtotal, coupon, discount, clearCart } = useCart();
  const [step, setStep] = useState<"form" | "processing" | "success">("form");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");

  const shipping = subtotal > 100 || subtotal===0 ? 0 : 9.5;
  const discountAmt = coupon ? (subtotal*discount)/100 : 0;
  const tax = (subtotal - discountAmt)*0.08;
  const total = subtotal - discountAmt + shipping + tax;

  const handleDemoPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!email.includes("@")) { setFormError("Please enter a valid email."); return; }
    if (items.length===0) { setFormError("Cart is empty."); return; }
    setStep("processing");
    try {
      const intent = await paymentProvider.createIntent({ amountCents: Math.round(total*100), currency: "usd", orderId: `demo_order_${Date.now()}`, customerEmail: email, metadata: { coupon: coupon||"none" } });
      console.log("Demo payment intent:", intent);
      await new Promise(r=>setTimeout(r, 1200));
      setStep("success");
      clearCart();
    } catch (err:any) {
      setFormError(err.message || "Demo payment failed");
      setStep("form");
    }
  };

  if (step==="success") {
    return (
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-lime mx-auto flex items-center justify-center"><ShieldCheck className="w-10 h-10" /></div>
        <h1 className="mt-6 font-display text-[36px] leading-none">Demo order confirmed!</h1>
        <p className="mt-4 text-obsidian/70">This was a demo checkout – no real payment was taken. In production, this would create a Stripe PaymentIntent, send confirmation email, and update inventory.</p>
        <div className="mt-8 p-6 rounded-[20px] bg-white border text-left text-[13px] leading-relaxed">
          <div className="font-semibold">What happens next in live mode:</div>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-obsidian/70">
            <li>Stripe PaymentIntent confirmed with clientSecret</li>
            <li>Webhook at /api/webhooks/stripe updates order status</li>
            <li>Confirmation email via Resend / SendGrid</li>
            <li>Inventory decremented, order saved to DB (e.g., Supabase)</li>
          </ul>
          <div className="mt-4 text-[11px] p-3 rounded-xl bg-lime/30 border border-lime">Payment adapter location: src/lib/payment-adapter.ts – replace DemoPaymentProvider with StripePaymentProvider when keys are ready. See README “Payments later”.</div>
        </div>
        <Link href="/shop" className="mt-8 inline-flex h-12 px-8 rounded-full bg-obsidian text-white font-semibold items-center">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-9 w-9 rounded-full bg-obsidian text-white flex items-center justify-center"><Lock className="w-4 h-4" /></div>
        <div>
          <h1 className="font-display text-[28px] leading-none">Checkout</h1>
          <div className="text-[12px] text-obsidian/60">Demo mode – no real charges • Secure UI</div>
        </div>
        <div className="ml-auto hidden lg:flex items-center gap-2 text-[12px] px-3 py-1.5 rounded-full bg-lime font-bold">DEMO PAYMENT • NO REAL CHARGE</div>
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8">
        <form onSubmit={handleDemoPay} className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-[16px] p-4 flex gap-3 text-[13px]">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
            <div><span className="font-semibold">Payments are in demo mode.</span> No card is charged. UI is production-ready. To go live, add Stripe keys as documented in README and src/lib/payment-adapter.ts. Never hardcode secrets.</div>
          </div>

          <div className="bg-white rounded-[24px] border border-stone-200 p-6 lg:p-8">
            <h3 className="font-semibold flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-obsidian text-white text-[12px] flex items-center justify-center">1</span> Contact & shipping</h3>
            <div className="mt-6 grid gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="text-[12px] opacity-60">Email*</label><input value={email} onChange={e=>setEmail(e.target.value)} required type="email" placeholder="you@example.com" className="mt-1 w-full h-11 px-4 rounded-full border border-stone-200 focus:outline-none focus:ring-2 focus:ring-obsidian/10" /></div>
                <div><label className="text-[12px] opacity-60">Phone</label><input placeholder="+1 (___) ___-____" className="mt-1 w-full h-11 px-4 rounded-full border border-stone-200 focus:outline-none focus:ring-2 focus:ring-obsidian/10" /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="text-[12px] opacity-60">First name</label><input placeholder="Alex" className="mt-1 w-full h-11 px-4 rounded-full border border-stone-200" /></div>
                <div><label className="text-[12px] opacity-60">Last name</label><input placeholder="Morgan" className="mt-1 w-full h-11 px-4 rounded-full border border-stone-200" /></div>
              </div>
              <div><label className="text-[12px] opacity-60">Address</label><input placeholder="123 Basco Street" className="mt-1 w-full h-11 px-4 rounded-full border border-stone-200" /></div>
              <div className="grid sm:grid-cols-3 gap-4">
                <input placeholder="City" className="h-11 px-4 rounded-full border border-stone-200" />
                <input placeholder="State / ZIP" className="h-11 px-4 rounded-full border border-stone-200" />
                <select className="h-11 px-4 rounded-full border border-stone-200 bg-white"><option>United States</option><option>United Kingdom</option><option>Pakistan</option></select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[24px] border border-stone-200 p-6 lg:p-8">
            <h3 className="font-semibold flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-obsidian text-white text-[12px] flex items-center justify-center">2</span> Shipping method</h3>
            <div className="mt-6 space-y-3">
              <label className="flex items-center justify-between p-4 rounded-xl border-2 border-obsidian bg-stone-50 cursor-pointer">
                <span className="flex items-center gap-3"><input type="radio" defaultChecked name="ship" /><Truck className="w-4 h-4" /> Standard (2-4 days)</span><span className="font-semibold">{shipping===0?"Free":formatPrice(shipping)}</span>
              </label>
              <label className="flex items-center justify-between p-4 rounded-xl border border-stone-200 cursor-pointer opacity-70">
                <span className="flex items-center gap-3"><input type="radio" name="ship" /> Express (1-2 days)</span><span className="font-semibold">$18.00</span>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-[24px] border border-stone-200 p-6 lg:p-8">
            <h3 className="font-semibold flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-obsidian text-white text-[12px] flex items-center justify-center">3</span> Payment (demo)</h3>
            <div className="mt-2 text-[12px] text-obsidian/60">No real card processing. Fields are UI only – adapter ready for Stripe.</div>
            <div className="mt-6 grid gap-4">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-stone-50 border"><CreditCard className="w-4 h-4" /><span className="text-[13px] font-medium">Card • Demo – use any test values</span><span className="ml-auto text-[11px] px-2 py-1 rounded-full bg-lime font-bold">DEMO</span></div>
              <input placeholder="Card number – 4242 4242 4242 4242 (demo)" className="h-11 px-4 rounded-full border border-stone-200" />
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="MM / YY" className="h-11 px-4 rounded-full border border-stone-200" />
                <input placeholder="CVC" className="h-11 px-4 rounded-full border border-stone-200" />
              </div>
              <input placeholder="Name on card" className="h-11 px-4 rounded-full border border-stone-200" />
            </div>
            {formError && <div className="mt-4 p-3 rounded-xl bg-sale-light text-sale text-[13px]">{formError}</div>}
            <Button type="submit" size="lg" className="w-full mt-6" disabled={step==="processing"}>
              {step==="processing" ? "Processing demo payment..." : `Pay ${formatPrice(total)} – Demo, no charge`}
            </Button>
            <p className="mt-3 text-[11px] text-center text-obsidian/50">By placing a demo order you agree to Terms & Privacy. No real money moves.</p>
          </div>
        </form>

        <div className="bg-white rounded-[24px] border border-stone-200 p-6 lg:p-8 h-fit lg:sticky lg:top-[100px]">
          <h3 className="font-semibold">Order summary • {items.length} items</h3>
          <div className="mt-6 space-y-4 max-h-[320px] overflow-auto pr-2">
            {items.map(it=>{
              const prod = products.find(p=>p.id===it.productId)!;
              return (
                <div key={`${it.productId}-${it.size}-${it.color}`} className="flex gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0"><Image src={prod.images[0]} alt="" fill className="object-cover" /><span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-obsidian text-white text-[11px] flex items-center justify-center">{it.quantity}</span></div>
                  <div className="flex-1 min-w-0"><div className="text-[13px] font-medium leading-tight truncate">{prod.name}</div><div className="text-[11px] opacity-60">{it.color}{it.size?` • ${it.size}`:""}</div></div>
                  <div className="text-[13px] font-medium">{formatPrice(prod.price*it.quantity)}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 space-y-2 text-[14px] border-t pt-6">
            <div className="flex justify-between"><span className="opacity-60">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            {coupon && <div className="flex justify-between text-lime-600"><span>Discount {coupon}</span><span>-{formatPrice(discountAmt)}</span></div>}
            <div className="flex justify-between"><span className="opacity-60">Shipping</span><span>{shipping===0?"Free":formatPrice(shipping)}</span></div>
            <div className="flex justify-between"><span className="opacity-60">Tax</span><span>{formatPrice(tax)}</span></div>
            <div className="flex justify-between text-[18px] font-semibold pt-2 border-t"><span>Total</span><span>{formatPrice(total)}</span></div>
          </div>
          <div className="mt-6 p-3 rounded-xl bg-stone-50 border text-[11px] leading-relaxed">
            <div className="font-semibold">Payment adapter</div>
            <div className="mt-1 opacity-70">Interface: src/lib/payment-adapter.ts. Demo mode active. To go live: set NEXT_PUBLIC_BASCO_PAYMENT_MODE=live, add STRIPE_SECRET_KEY, implement StripePaymentProvider, create /api/checkout route. See README.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
