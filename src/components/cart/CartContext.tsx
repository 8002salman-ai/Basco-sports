"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { CartItem } from "@/lib/types";
import { products } from "@/data/products";

interface CartContextType {
  items: CartItem[];
  wishlist: string[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, size?: string, color?: string) => void;
  updateQty: (productId: string, size: string | undefined, color: string | undefined, qty: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  cartCount: number;
  subtotal: number;
  coupon: string | null;
  discount: number;
  applyCoupon: (code: string) => { ok: boolean; message: string; discount: number };
  removeCoupon: () => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "basco-cart-v1";
const WISHLIST_KEY = "basco-wishlist-v1";
const COUPON_KEY = "basco-coupon-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [coupon, setCoupon] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
      const w = localStorage.getItem(WISHLIST_KEY);
      if (w) setWishlist(JSON.parse(w));
      const c = localStorage.getItem(COUPON_KEY);
      if (c) {
        const parsed = JSON.parse(c);
        setCoupon(parsed.code);
        setDiscount(parsed.discount);
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (coupon) localStorage.setItem(COUPON_KEY, JSON.stringify({ code: coupon, discount }));
    else localStorage.removeItem(COUPON_KEY);
  }, [coupon, discount, hydrated]);

  const addToCart = (item: CartItem) => {
    setItems(prev => {
      const idx = prev.findIndex(p => p.productId === item.productId && p.size === item.size && p.color === item.color && p.variantIndex === item.variantIndex);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + item.quantity };
        return copy;
      }
      return [...prev, item];
    });
    setCartOpen(true);
  };

  const removeFromCart = (productId: string, size?: string, color?: string) => {
    setItems(prev => prev.filter(p => !(p.productId === productId && p.size === size && p.color === color)));
  };

  const updateQty = (productId: string, size: string | undefined, color: string | undefined, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId, size, color);
      return;
    }
    setItems(prev => prev.map(p => (p.productId === productId && p.size === size && p.color === color ? { ...p, quantity: qty } : p)));
  };

  const clearCart = () => setItems([]);

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  };

  const isWishlisted = (productId: string) => wishlist.includes(productId);

  const cartCount = items.reduce((s, i) => s + i.quantity, 0);

  const subtotal = items.reduce((sum, it) => {
    const prod = products.find(p => p.id === it.productId);
    return sum + (prod ? prod.price * it.quantity : 0);
  }, 0);

  const applyCoupon = (code: string) => {
    const upper = code.trim().toUpperCase();
    // demo coupons
    const map: Record<string, number> = { BASCO10: 10, WELCOME15: 15, TRAIN20: 20 };
    if (!map[upper]) return { ok: false, message: "Invalid coupon code.", discount: 0 };
    // check min subtotal for demo
    const mins: Record<string, number> = { BASCO10: 100, WELCOME15: 75, TRAIN20: 150 };
    if (subtotal < (mins[upper] || 0)) return { ok: false, message: `Minimum $${mins[upper]} required for this coupon.`, discount: 0 };
    setCoupon(upper);
    setDiscount(map[upper]);
    return { ok: true, message: `${map[upper]}% discount applied!`, discount: map[upper] };
  };

  const removeCoupon = () => {
    setCoupon(null);
    setDiscount(0);
  };

  return (
    <CartContext.Provider value={{ items, wishlist, addToCart, removeFromCart, updateQty, clearCart, toggleWishlist, isWishlisted, cartCount, subtotal, coupon, discount, applyCoupon, removeCoupon, cartOpen, setCartOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
