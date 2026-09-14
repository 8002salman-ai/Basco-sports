"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Minus, Plus, ShoppingBag, Check } from "lucide-react";
import { Product } from "@/lib/types";
import { cn, discountPercent } from "@/lib/utils";
import { useCart } from "@/components/cart/CartContext";
import { convertForDisplay } from "@/lib/currency";
import { useMarket } from "@/components/market/MarketContext";

/**
 * Interactive purchase surface for the product page: gallery, color/size
 * pickers, quantity and add-to-cart. Client island inside the server page —
 * the page passes the serializable product; everything interactive lives here.
 */
export function ProductPurchasePanel({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, isWishlisted } = useCart();
  const { currency } = useMarket();

  const [variantIndex, setVariantIndex] = useState(product.defaultVariantIndex);
  const [size, setSize] = useState<string | undefined>(product.variants[variantIndex]?.sizes?.[0]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const variant = product.variants[variantIndex];
  const gallery = variant?.images?.length ? variant.images : product.images;
  const wish = isWishlisted(product.id);
  const disc = discountPercent(product.price, product.compareAtPrice) || null;
  const outOfStock = product.stock <= 0;

  const pickVariant = (i: number) => {
    setVariantIndex(i);
    setSize(product.variants[i]?.sizes?.[0]);
    setImageIndex(0);
    setAdded(false);
  };

  const add = () => {
    addToCart({ productId: product.id, variantIndex, color: variant.color, size, quantity: qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Gallery */}
      <div>
        <div className="relative aspect-[4/5] rounded-[20px] overflow-hidden bg-stone-100">
          <Image
            src={gallery[imageIndex] ?? product.images[0]}
            alt={`${product.name}${variant ? ` – ${variant.color}` : ""}`}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          {product.badges?.includes("NEW") && (
            <span className="absolute top-4 left-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold tracking-widest uppercase">New</span>
          )}
        </div>
        {gallery.length > 1 && (
          <div className="mt-3 flex gap-2">
            {gallery.map((src, i) => (
              <button
                key={src + i}
                onClick={() => setImageIndex(i)}
                aria-label={`View image ${i + 1}`}
                className={cn(
                  "relative h-16 w-16 rounded-xl overflow-hidden border-2 transition-colors",
                  i === imageIndex ? "border-obsidian" : "border-transparent hover:border-stone-300",
                )}
              >
                <Image src={src} alt="" fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Buy column */}
      <div className="flex flex-col">
        <div className="text-[11px] tracking-widest uppercase text-obsidian/50 font-medium">
          {product.brand} • {product.category}
        </div>
        <h1 className="mt-2 text-3xl lg:text-4xl font-display leading-tight">{product.name}</h1>
        <div className="mt-3 flex items-baseline gap-3">
          <span className="text-2xl font-semibold tabular-nums">{convertForDisplay(product.price, currency)}</span>
          {product.compareAtPrice && (
            <span className="text-[15px] text-obsidian/40 line-through tabular-nums">{convertForDisplay(product.compareAtPrice, currency)}</span>
          )}
          {disc && (
            <span className="rounded-full bg-sale/10 text-sale px-2 py-0.5 text-[12px] font-semibold">-{disc}%</span>
          )}
        </div>
        <p className="mt-4 text-[15px] leading-relaxed text-obsidian/75">{product.description}</p>

        {/* Color */}
        {product.variants.length > 1 && (
          <div className="mt-6">
            <div className="text-[11px] tracking-widest uppercase text-obsidian/50 font-medium">
              Color — <span className="text-obsidian normal-case tracking-normal">{variant?.color}</span>
            </div>
            <div className="mt-3 flex gap-2.5">
              {product.variants.map((v, i) => (
                <button
                  key={v.color}
                  onClick={() => pickVariant(i)}
                  title={v.color}
                  aria-label={`Color ${v.color}`}
                  aria-pressed={i === variantIndex}
                  className={cn(
                    "h-9 w-9 rounded-full border-2 transition-all",
                    i === variantIndex ? "border-obsidian scale-110" : "border-black/10 hover:border-stone-400",
                  )}
                  style={{ backgroundColor: v.colorHex }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Size */}
        {variant?.sizes && variant.sizes.length > 0 && (
          <div className="mt-6">
            <div className="text-[11px] tracking-widest uppercase text-obsidian/50 font-medium">
              Size — <span className="text-obsidian normal-case tracking-normal">{size}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {variant.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => { setSize(s); setAdded(false); }}
                  aria-pressed={s === size}
                  className={cn(
                    "h-10 min-w-[48px] px-3 rounded-[10px] border text-[14px] font-medium transition-colors",
                    s === size ? "border-obsidian bg-obsidian text-white" : "border-stone-200 hover:border-obsidian/40",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity + add */}
        <div className="mt-8 flex items-center gap-3">
          <div className="flex items-center rounded-full border border-stone-200">
            <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity" className="h-12 w-11 flex items-center justify-center rounded-l-full hover:bg-stone-100">
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-[15px] font-semibold tabular-nums">{qty}</span>
            <button onClick={() => setQty(qty + 1)} aria-label="Increase quantity" className="h-12 w-11 flex items-center justify-center rounded-r-full hover:bg-stone-100">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={add}
            disabled={outOfStock}
            className={cn(
              "flex-1 h-12 rounded-full font-semibold text-[15px] transition-all",
              outOfStock
                ? "bg-stone-100 text-obsidian/40 cursor-not-allowed"
                : added
                  ? "bg-lime text-obsidian"
                  : "bg-obsidian text-white hover:bg-obsidian-700",
            )}
          >
            {outOfStock ? (
              "Out of stock"
            ) : added ? (
              <span className="inline-flex items-center gap-2"><Check className="w-4 h-4" /> Added to cart</span>
            ) : (
              <span className="inline-flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> Add to cart</span>
            )}
          </button>
          <button
            onClick={() => toggleWishlist(product.id)}
            aria-label={wish ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={wish}
            className={cn(
              "h-12 w-12 shrink-0 rounded-full border flex items-center justify-center transition-colors",
              wish ? "border-obsidian bg-obsidian text-white" : "border-stone-200 hover:border-obsidian/40",
            )}
          >
            <Heart className={cn("w-5 h-5", wish && "fill-current")} />
          </button>
        </div>
        <p className="mt-2 text-[12px] text-obsidian/50" aria-live="polite">
          {outOfStock ? "Notify us via contact and we'll let you know when it's back." : added ? "Opening your cart…" : `${product.stock} in stock · demo store – no real payment`}
        </p>

        {/* Details */}
        <div className="mt-8 border-t border-stone-200 pt-6 space-y-6">
          <div>
            <h2 className="text-[11px] tracking-widest uppercase text-obsidian/50 font-medium">Highlights</h2>
            <ul className="mt-3 space-y-1.5">
              {product.features.map((f) => (
                <li key={f} className="flex gap-2 text-[14px] text-obsidian/80">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-obsidian/40" /> {f}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-[11px] tracking-widest uppercase text-obsidian/50 font-medium">Specifications</h2>
            <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {Object.entries(product.specifications).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 text-[13px] border-b border-stone-100 py-1.5">
                  <dt className="text-obsidian/50">{k}</dt>
                  <dd className="font-medium text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <Link href="/shop" className="mt-8 text-[13px] text-obsidian/50 hover:text-obsidian underline underline-offset-4 self-start">
          ← Continue shopping
        </Link>
      </div>
    </div>
  );
}
