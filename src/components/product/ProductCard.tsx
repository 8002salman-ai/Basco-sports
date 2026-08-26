"use client";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag } from "lucide-react";
import { Product } from "@/lib/types";
import { formatPrice, discountPercent, cn } from "@/lib/utils";
import { useCart } from "@/components/cart/CartContext";
import { Badge } from "@/components/ui/badge";

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const { toggleWishlist, isWishlisted, addToCart } = useCart();
  const wish = isWishlisted(product.id);
  const disc = discountPercent(product.price, product.compareAtPrice);

  return (
    <div className={cn("group relative bg-white rounded-[20px] border border-stone-200/70 overflow-hidden hover:shadow-lift transition-all duration-300 flex flex-col", className)}>
      <Link href={`/product/${product.slug}`} className="relative aspect-[4/5] overflow-hidden bg-stone-100 block">
        <Image src={product.images[0]} alt={product.name} fill className="object-cover group-hover:scale-[1.04] transition-transform duration-700" sizes="(max-width: 768px) 50vw, 25vw" />
        <div className="absolute top-3 left-3 flex gap-2">
          {product.badges?.includes("NEW") && <Badge variant="new">New</Badge>}
          {product.badges?.includes("SALE") && <Badge variant="sale">{disc ? `-${disc}%` : "Sale"}</Badge>}
          {product.badges?.includes("BESTSELLER") && <Badge variant="lime">Bestseller</Badge>}
        </div>
        <button
          aria-label="Wishlist"
          onClick={(e) => { e.preventDefault(); toggleWishlist(product.id); }}
          className={cn("absolute top-3 right-3 h-9 w-9 rounded-full flex items-center justify-center backdrop-blur-xl transition-colors", wish ? "bg-obsidian text-white" : "bg-white/90 text-obsidian hover:bg-white")}
        >
          <Heart className={cn("w-4 h-4", wish && "fill-current")} />
        </button>
        <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <button
            onClick={(e) => {
              e.preventDefault();
              const variant = product.variants[product.defaultVariantIndex];
              addToCart({ productId: product.id, variantIndex: product.defaultVariantIndex, color: variant.color, size: variant.sizes?.[0], quantity: 1 });
            }}
            className="flex-1 h-10 rounded-full bg-obsidian text-white text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-obsidian-700"
          >
            <ShoppingBag className="w-4 h-4" /> Quick add
          </button>
        </div>
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] tracking-widest uppercase text-obsidian/50 font-medium">{product.brand} • {product.category}</div>
            <Link href={`/product/${product.slug}`} className="block mt-1 font-medium leading-tight line-clamp-2 text-[15px] hover:underline underline-offset-4">{product.name}</Link>
          </div>
          <div className="text-right shrink-0">
            <div className="font-semibold text-[15px]">{formatPrice(product.price)}</div>
            {product.compareAtPrice && <div className="text-[12px] text-obsidian/40 line-through">{formatPrice(product.compareAtPrice)}</div>}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={cn("w-3 h-3 rounded-full", i < Math.round(product.rating) ? "bg-obsidian" : "bg-stone-200")} />
            ))}
          </div>
          <span className="text-[12px] text-obsidian/60">({product.reviewCount})</span>
          <span className={cn("ml-auto text-[11px] px-2 py-0.5 rounded-full", product.stock > 10 ? "bg-stone-100 text-obsidian/60" : product.stock > 0 ? "bg-sale-light text-sale" : "bg-obsidian text-white")}>
            {product.stock > 10 ? "In stock" : product.stock > 0 ? `Only ${product.stock} left` : "Out of stock"}
          </span>
        </div>
        <div className="mt-3 flex gap-1.5">
          {product.variants.slice(0,4).map(v => (
            <span key={v.color} title={v.color} className="w-5 h-5 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: v.colorHex }} />
          ))}
          {product.variants.length > 4 && <span className="text-[11px] text-obsidian/50 ml-1">+{product.variants.length - 4}</span>}
        </div>
      </div>
    </div>
  );
}
