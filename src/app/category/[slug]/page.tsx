"use client";
export const dynamic = 'force-dynamic';
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { products, categories } from "@/data/products";
import { ProductCard } from "@/components/product/ProductCard";

export default function CategoryPage() {
  const { slug } = useParams() as { slug: string };
  const category = categories.find(c => c.slug === slug);
  const list = products.filter(p => p.categories.includes(slug as any) || p.category === slug);

  if (!category) {
    return <div className="max-w-[1600px] mx-auto px-4 py-20 text-center"><h1 className="font-display text-[32px]">Category not found</h1><Link href="/shop" className="mt-6 inline-flex h-11 px-6 rounded-full bg-obsidian text-white items-center">Back to shop</Link></div>;
  }

  return (
    <div>
      <div className="relative h-[420px] lg:h-[520px] overflow-hidden bg-obsidian">
        <Image src={category.image} alt={category.name} fill className="object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/30 to-transparent" />
        <div className="absolute inset-0 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12">
          <div className="text-white">
            <div className="text-[11px] tracking-[0.2em] uppercase opacity-60">Collection • {list.length} products</div>
            <h1 className="mt-3 font-display text-[44px] lg:text-[72px] leading-[0.9] tracking-tight">{category.name}</h1>
            <p className="mt-4 max-w-[560px] text-white/70 text-[16px] leading-relaxed">{category.description} Premium curation, performance tested. Demo store with full cart and wishlist functionality.</p>
            <div className="mt-6 flex gap-3">
              <span className="px-4 py-2 rounded-full bg-white text-obsidian text-[13px] font-medium">Free shipping over $100</span>
              <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/15 text-white text-[13px]">30-day returns</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        {list.length===0 ? (
          <div className="bg-white rounded-[20px] border p-12 text-center"><h3 className="font-display text-[22px]">No products in this collection yet</h3><p className="text-obsidian/60 mt-2">Check back soon or explore all products.</p><Link href="/shop" className="mt-6 inline-flex h-11 px-6 rounded-full bg-obsidian text-white items-center">Shop all</Link></div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {list.map(p=><ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
