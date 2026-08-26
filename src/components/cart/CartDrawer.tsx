"use client";
import Link from "next/link";
import Image from "next/image";
import { X, Minus, Plus, ShoppingBag, Ticket } from "lucide-react";
import { useCart } from "./CartContext";
import { products } from "@/data/products";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function CartDrawer() {
  const { items, cartOpen, setCartOpen, updateQty, removeFromCart, subtotal, coupon, discount, applyCoupon, removeCoupon } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState("");

  const shipping = subtotal > 100 || subtotal === 0 ? 0 : 9.5;
  const discountAmount = coupon ? (subtotal * discount) / 100 : 0;
  const tax = (subtotal - discountAmount) * 0.08;
  const total = subtotal - discountAmount + shipping + tax;

  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-obsidian/30 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
      <div className="absolute right-0 top-0 h-full w-full max-w-[480px] bg-white shadow-lift flex flex-col">
        <div className="h-[64px] px-6 flex items-center justify-between border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-obsidian text-white flex items-center justify-center"><ShoppingBag className="w-4 h-4" /></div>
            <div>
              <div className="font-semibold leading-none">Cart</div>
              <div className="text-[12px] text-obsidian/60">{items.length} {items.length === 1 ? "item" : "items"}</div>
            </div>
          </div>
          <button onClick={() => setCartOpen(false)} className="h-9 w-9 rounded-full bg-stone-100 flex items-center justify-center"><X className="w-5 h-5" /></button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-4"><ShoppingBag className="w-8 h-8 text-obsidian/30" /></div>
            <h3 className="font-display text-[22px]">Your cart is empty</h3>
            <p className="text-[14px] text-obsidian/60 mt-2 max-w-[280px]">Add some gear – trending products are waiting. Free shipping over $100.</p>
            <Link href="/shop" onClick={() => setCartOpen(false)} className="mt-6 h-11 px-6 rounded-full bg-obsidian text-white text-[14px] font-medium flex items-center justify-center">Continue shopping</Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {items.map((it) => {
                const prod = products.find(p => p.id === it.productId);
                if (!prod) return null;
                return (
                  <div key={`${it.productId}-${it.size}-${it.color}`} className="flex gap-4 p-3 rounded-2xl bg-stone-50 border border-stone-100">
                    <div className="relative w-[88px] h-[88px] rounded-xl overflow-hidden bg-white shrink-0">
                      <Image src={prod.images[0]} alt={prod.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${prod.slug}`} onClick={() => setCartOpen(false)} className="font-medium text-[14px] leading-tight line-clamp-2 hover:underline">{prod.name}</Link>
                      <div className="text-[12px] text-obsidian/60 mt-1">{it.color}{it.size ? ` • ${it.size}` : ""}</div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 bg-white rounded-full border p-1">
                          <button onClick={() => updateQty(it.productId, it.size, it.color, it.quantity - 1)} className="h-6 w-6 rounded-full bg-stone-100 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                          <span className="w-6 text-center text-[13px] font-medium">{it.quantity}</span>
                          <button onClick={() => updateQty(it.productId, it.size, it.color, it.quantity + 1)} className="h-6 w-6 rounded-full bg-stone-100 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-[14px]">{formatPrice(prod.price * it.quantity)}</div>
                          <button onClick={() => removeFromCart(it.productId, it.size, it.color)} className="text-[11px] text-obsidian/50 hover:text-sale underline">Remove</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="pt-2">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian/30" />
                    <input value={couponInput} onChange={e => setCouponInput(e.target.value)} placeholder="Coupon code (try BASCO10)" className="w-full h-11 pl-10 pr-3 rounded-full bg-white border border-stone-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-obsidian/10" />
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const res = applyCoupon(couponInput);
                      setCouponMsg(res.message);
                    }}
                    className="shrink-0"
                  >
                    Apply
                  </Button>
                </div>
                {couponMsg && <div className="mt-2 text-[12px] px-3 py-2 rounded-full bg-stone-100">{couponMsg}</div>}
                {coupon && (
                  <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-lime/30 border border-lime">
                    <span className="text-[13px] font-medium">Code {coupon} – {discount}% off</span>
                    <button onClick={removeCoupon} className="text-[12px] underline">Remove</button>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-stone-200 p-6 space-y-3 bg-stone-50">
              <div className="space-y-2 text-[14px]">
                <div className="flex justify-between"><span className="text-obsidian/60">Subtotal</span><span className="font-medium">{formatPrice(subtotal)}</span></div>
                {coupon && <div className="flex justify-between text-lime-400"><span>Discount ({discount}%)</span><span>-{formatPrice(discountAmount)}</span></div>}
                <div className="flex justify-between"><span className="text-obsidian/60">Shipping</span><span className="font-medium">{shipping === 0 ? "Free" : formatPrice(shipping)}</span></div>
                <div className="flex justify-between"><span className="text-obsidian/60">Tax (est.)</span><span className="font-medium">{formatPrice(tax)}</span></div>
                <div className="h-px bg-stone-200 my-2" />
                <div className="flex justify-between text-[18px] font-semibold"><span>Total</span><span>{formatPrice(total)}</span></div>
              </div>
              <p className="text-[11px] text-obsidian/50">Demo checkout – no real payment will be taken. Shipping calculated at next step.</p>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/cart" onClick={() => setCartOpen(false)} className="h-12 rounded-full border border-obsidian/15 flex items-center justify-center text-[14px] font-medium hover:bg-white transition-colors">View cart</Link>
                <Link href="/checkout" onClick={() => setCartOpen(false)} className="h-12 rounded-full bg-obsidian text-white flex items-center justify-center text-[14px] font-semibold hover:bg-obsidian-700 transition-colors">Checkout</Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
