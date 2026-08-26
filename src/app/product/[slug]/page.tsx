"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { products, reviews } from "@/data/products";

export const runtime = 'edge';
import { formatPrice, discountPercent, cn } from "@/lib/utils";
import { Heart, Minus, Plus, Truck, ShieldCheck, RotateCcw, Star, ChevronDown } from "lucide-react";
import { useCart } from "@/components/cart/CartContext";
import { ProductCard } from "@/components/product/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdSlot } from "@/components/ads/AdSlot";

export default function ProductPage() {
  const { slug } = useParams() as { slug: string };
  const product = products.find(p => p.slug === slug);
  const { addToCart, toggleWishlist, isWishlisted } = useCart();
  const [variantIdx, setVariantIdx] = useState(product?.defaultVariantIndex || 0);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(product?.variants[product.defaultVariantIndex]?.sizes?.[0]);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [openAccordion, setOpenAccordion] = useState<string | null>("details");

  if (!product) {
    return <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center"><h1 className="font-display text-[32px]">Product not found</h1><Link href="/shop" className="mt-6 inline-flex h-11 px-6 rounded-full bg-obsidian text-white items-center">Back to shop</Link></div>;
  }

  const variant = product.variants[variantIdx];
  const disc = discountPercent(product.price, product.compareAtPrice);
  const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0,4);
  const productReviews = reviews.filter(r => r.productId === product.id);

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
      <div className="text-[12px] text-obsidian/50 flex gap-2">
        <Link href="/" className="hover:underline">Home</Link> / <Link href="/shop" className="hover:underline">Shop</Link> / <Link href={`/category/${product.category}`} className="hover:underline">{product.category}</Link> / <span className="text-obsidian">{product.name}</span>
      </div>

      <div className="mt-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12">
        {/* Gallery */}
        <div className="grid grid-cols-[80px_1fr] lg:grid-cols-[100px_1fr] gap-4">
          <div className="flex flex-col gap-3">
            {product.images.map((img, i) => (
              <button key={i} onClick={()=>setActiveImage(i)} className={cn("relative aspect-square rounded-xl overflow-hidden border-2 bg-stone-100", activeImage===i?"border-obsidian":"border-transparent")}>
                <Image src={img} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
          <div className="relative aspect-[4/5] rounded-[24px] overflow-hidden bg-stone-100">
            <Image src={product.images[activeImage]} alt={product.name} fill className="object-cover" />
            <div className="absolute top-4 left-4 flex gap-2">
              {product.badges?.includes("NEW") && <Badge variant="new">New</Badge>}
              {product.badges?.includes("SALE") && <Badge variant="sale">-{disc}%</Badge>}
              {product.badges?.includes("BESTSELLER") && <Badge variant="lime">Bestseller</Badge>}
            </div>
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] tracking-widest uppercase opacity-60">{product.brand} • {product.category}</div>
              <h1 className="mt-2 font-display text-[30px] lg:text-[40px] leading-[0.95] tracking-tight">{product.name}</h1>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center gap-1"><Star className="w-4 h-4 fill-obsidian" /><span className="font-semibold text-[14px]">{product.rating}</span></div>
                <span className="text-[13px] text-obsidian/60">({product.reviewCount} reviews)</span>
                <span className={cn("text-[11px] px-2 py-1 rounded-full", product.stock>0?"bg-stone-100":"bg-sale text-white")}>{product.stock>0?`${product.stock} in stock`:"Out of stock"}</span>
              </div>
            </div>
            <button onClick={()=>toggleWishlist(product.id)} className={cn("h-11 w-11 rounded-full border flex items-center justify-center shrink-0", isWishlisted(product.id)?"bg-obsidian text-white border-obsidian":"bg-white border-stone-200")}>
              <Heart className={cn("w-5 h-5", isWishlisted(product.id) && "fill-current")} />
            </button>
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-display text-[28px] font-semibold">{formatPrice(product.price)}</span>
            {product.compareAtPrice && <span className="text-[16px] line-through opacity-50">{formatPrice(product.compareAtPrice)}</span>}
            {disc>0 && <span className="px-2.5 py-1 rounded-full bg-sale-light text-sale text-[12px] font-bold">Save {disc}%</span>}
          </div>

          <p className="mt-6 text-[15px] leading-relaxed text-obsidian/70">{product.description}</p>

          {/* Variants */}
          <div className="mt-8">
            <div className="text-[12px] tracking-widest uppercase opacity-60">Color: {variant.color}</div>
            <div className="mt-3 flex gap-2">
              {product.variants.map((v,i)=>(
                <button key={v.color} onClick={()=>{ setVariantIdx(i); setSelectedSize(v.sizes?.[0]); setActiveImage(0); }} className={cn("h-10 w-10 rounded-full border-2 flex items-center justify-center", variantIdx===i?"border-obsidian":"border-transparent")}>
                  <span className="w-8 h-8 rounded-full border border-black/10" style={{ backgroundColor: v.colorHex }} />
                </button>
              ))}
            </div>
          </div>

          {variant.sizes && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <div className="text-[12px] tracking-widest uppercase opacity-60">Size</div>
                <button className="text-[12px] underline">Size guide</button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {variant.sizes.map(s=>(
                  <button key={s} onClick={()=>setSelectedSize(s)} className={cn("h-10 px-4 rounded-full border text-[13px] font-medium", selectedSize===s?"bg-obsidian text-white border-obsidian":"bg-white border-stone-200 hover:border-obsidian")}>{s}</button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex gap-3">
            <div className="flex items-center gap-2 bg-stone-100 rounded-full p-1">
              <button onClick={()=>setQty(Math.max(1, qty-1))} className="h-9 w-9 rounded-full bg-white flex items-center justify-center"><Minus className="w-4 h-4" /></button>
              <span className="w-8 text-center font-medium">{qty}</span>
              <button onClick={()=>setQty(Math.min(product.stock, qty+1))} className="h-9 w-9 rounded-full bg-white flex items-center justify-center"><Plus className="w-4 h-4" /></button>
            </div>
            <Button
              size="lg"
              className="flex-1"
              disabled={product.stock===0}
              onClick={()=>addToCart({ productId: product.id, variantIndex: variantIdx, color: variant.color, size: selectedSize, quantity: qty })}
            >
              Add to cart • {formatPrice(product.price * qty)}
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-[12px]">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-stone-50 border border-stone-100"><Truck className="w-4 h-4" /> Free ship over $100</div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-stone-50 border border-stone-100"><RotateCcw className="w-4 h-4" /> 30-day returns</div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-stone-50 border border-stone-100"><ShieldCheck className="w-4 h-4" /> 2-yr warranty</div>
          </div>

          {/* Product AdSlot demo */}
          <div className="mt-8">
            <AdSlot slotIdEnvKey="NEXT_PUBLIC_ADSENSE_SLOT_PRODUCT" label="Product Ad" />
          </div>

          {/* Accordions */}
          <div className="mt-10 border-t border-stone-200">
            {[
              { id: "details", title: "Product details", content: (
                <div className="space-y-3">
                  <ul className="list-disc pl-5 text-[14px] text-obsidian/70 space-y-1">{product.features.map(f=><li key={f}>{f}</li>)}</ul>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {Object.entries(product.specifications).map(([k,v])=><div key={k} className="flex justify-between text-[13px] py-2 border-b border-stone-100"><span className="opacity-60">{k}</span><span className="font-medium">{v}</span></div>)}
                  </div>
                </div>
              )},
              { id: "shipping", title: "Shipping & returns", content: <p className="text-[14px] text-obsidian/70">Free standard shipping over $100 (2-4 days). Express available at checkout. 30-day free returns with prepaid label. Items must be unused with tags.</p> },
              { id: "reviews", title: `Reviews (${product.reviewCount})`, content: (
                <div className="space-y-4">
                  {productReviews.length===0 ? <p className="text-[14px] text-obsidian/60">No reviews yet for this variant. Overall rating {product.rating} from {product.reviewCount} reviews.</p> :
                    productReviews.map(r=>(
                      <div key={r.id} className="border-b border-stone-100 pb-4">
                        <div className="flex items-center gap-2"><span className="font-medium text-[14px]">{r.author}</span>{r.verified && <span className="text-[10px] px-2 py-0.5 rounded-full bg-lime font-bold">VERIFIED</span>}<span className="text-[12px] opacity-60 ml-auto">{r.date}</span></div>
                        <div className="mt-1 font-medium text-[14px]">{r.title}</div>
                        <div className="mt-1 text-[13px] text-obsidian/70">{r.body}</div>
                      </div>
                    ))
                  }
                  <div className="bg-stone-50 p-4 rounded-xl text-[13px]">Demo reviews – real review system integration point documented in README.</div>
                </div>
              )},
            ].map(item=>(
              <div key={item.id} className="border-b border-stone-200">
                <button onClick={()=>setOpenAccordion(openAccordion===item.id?null:item.id)} className="w-full flex items-center justify-between py-5 text-left">
                  <span className="font-medium">{item.title}</span>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", openAccordion===item.id && "rotate-180")} />
                </button>
                {openAccordion===item.id && <div className="pb-6">{item.content}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {related.length>0 && (
        <div className="mt-20">
          <h2 className="font-display text-[28px]">Related products</h2>
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {related.map(p=><ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
