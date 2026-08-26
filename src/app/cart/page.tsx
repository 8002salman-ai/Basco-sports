"use client";
export const dynamic = 'force-dynamic';
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import { products } from "@/data/products";
import { formatPrice } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingBag, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const { items, updateQty, removeFromCart, subtotal, coupon, discount, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");

  const shipping = subtotal > 100 || subtotal===0 ? 0 : 9.5;
  const discountAmt = coupon ? (subtotal*discount)/100 : 0;
  const tax = (subtotal - discountAmt)*0.08;
  const total = subtotal - discountAmt + shipping + tax;

  if (items.length===0) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-stone-100 mx-auto flex items-center justify-center"><ShoppingBag className="w-8 h-8 text-obsidian/30" /></div>
        <h1 className="mt-6 font-display text-[36px]">Your cart is empty</h1>
        <p className="mt-3 text-obsidian/60">Add gear to get started. Free shipping over $100.</p>
        <Link href="/shop" className="mt-8 inline-flex h-12 px-8 rounded-full bg-obsidian text-white font-semibold items-center">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <h1 className="font-display text-[32px] lg:text-[48px] leading-none">Cart ({items.length})</h1>
      <div className="mt-8 grid lg:grid-cols-[1.2fr_0.8fr] gap-8">
        <div className="space-y-4">
          {items.map(it=>{
            const prod = products.find(p=>p.id===it.productId)!;
            return (
              <div key={`${it.productId}-${it.size}-${it.color}`} className="flex gap-5 p-5 rounded-[20px] bg-white border border-stone-200">
                <div className="relative w-[120px] h-[120px] rounded-xl overflow-hidden bg-stone-100 shrink-0"><Image src={prod.images[0]} alt={prod.name} fill className="object-cover" /></div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[11px] tracking-widest uppercase opacity-50">{prod.brand}</div>
                      <Link href={`/product/${prod.slug}`} className="font-medium leading-tight hover:underline">{prod.name}</Link>
                      <div className="text-[13px] text-obsidian/60 mt-1">{it.color}{it.size?` • ${it.size}`:""}</div>
                    </div>
                    <button onClick={()=>removeFromCart(it.productId, it.size, it.color)} className="h-9 w-9 rounded-full bg-stone-100 flex items-center justify-center hover:bg-sale-light hover:text-sale"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-stone-100 rounded-full p-1">
                      <button onClick={()=>updateQty(it.productId, it.size, it.color, it.quantity-1)} className="h-8 w-8 rounded-full bg-white flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                      <span className="w-8 text-center font-medium">{it.quantity}</span>
                      <button onClick={()=>updateQty(it.productId, it.size, it.color, it.quantity+1)} className="h-8 w-8 rounded-full bg-white flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                    </div>
                    <div className="font-semibold">{formatPrice(prod.price*it.quantity)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-[24px] border border-stone-200 p-6 lg:p-8 h-fit lg:sticky lg:top-[124px]">
          <h3 className="font-semibold">Order summary</h3>
          <div className="mt-6 flex gap-2">
            <div className="flex-1 relative">
              <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian/30" />
              <input value={code} onChange={e=>setCode(e.target.value)} placeholder="Coupon code" className="w-full h-11 pl-10 pr-3 rounded-full border border-stone-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-obsidian/10" />
            </div>
            <Button variant="secondary" onClick={()=>{ const r=applyCoupon(code); setMsg(r.message); }}>Apply</Button>
          </div>
          {msg && <div className="mt-3 text-[12px] p-2 rounded-full bg-stone-100 px-3">{msg}</div>}
          {coupon && <div className="mt-3 p-3 rounded-xl bg-lime/30 border border-lime flex justify-between text-[13px]"><span>{coupon} – {discount}% off</span><button onClick={removeCoupon} className="underline">Remove</button></div>}

          <div className="mt-8 space-y-3 text-[14px]">
            <div className="flex justify-between"><span className="text-obsidian/60">Subtotal</span><span className="font-medium">{formatPrice(subtotal)}</span></div>
            {coupon && <div className="flex justify-between text-lime-600"><span>Discount</span><span>-{formatPrice(discountAmt)}</span></div>}
            <div className="flex justify-between"><span className="text-obsidian/60">Shipping</span><span>{shipping===0?"Free":formatPrice(shipping)}</span></div>
            <div className="flex justify-between"><span className="text-obsidian/60">Tax (est. 8%)</span><span>{formatPrice(tax)}</span></div>
            <div className="h-px bg-stone-200 my-3" />
            <div className="flex justify-between text-[20px] font-semibold"><span>Total</span><span>{formatPrice(total)}</span></div>
          </div>

          <Link href="/checkout" className="mt-8 h-12 rounded-full bg-obsidian text-white font-semibold flex items-center justify-center hover:bg-obsidian-700">Proceed to checkout</Link>
          <p className="mt-3 text-[11px] text-obsidian/50 text-center">Demo checkout – no real payment. Secure by design.</p>

          <div className="mt-8 p-4 rounded-xl bg-stone-50 border border-stone-100 text-[12px] leading-relaxed">
            <div className="font-semibold mb-1">Try demo coupons</div>
            <div>BASCO10 – 10% off $100+</div>
            <div>WELCOME15 – 15% off $75+</div>
            <div>TRAIN20 – 20% off $150+</div>
          </div>
        </div>
      </div>
    </div>
  );
}
