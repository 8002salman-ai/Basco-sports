"use client";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { products as seedProducts, categories } from "@/data/products";
import { getStorefrontProducts } from "@/lib/storefront";
import { ProductCard } from "@/components/product/ProductCard";
import { formatPrice, cn } from "@/lib/utils";
import { SlidersHorizontal, Search, X } from "lucide-react";

type SortOption = "featured" | "price-asc" | "price-desc" | "rating" | "newest" | "trending";

function ShopInner() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState(seedProducts);
  const initialQ = searchParams.get("q") || "";
  const [q, setQ] = useState(initialQ);
  const [selectedCats, setSelectedCats] = useState<string[]>(() => {
    const cat = searchParams.get("category");
    return cat ? [cat] : [];
  });
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [sort, setSort] = useState<SortOption>((searchParams.get("sort") as SortOption) || "featured");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { void getStorefrontProducts().then(setProducts); }, []);

  const filtered = useMemo(() => {
    let list = [...products];
    if (q.trim()) {
      const lower = q.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(lower) || p.brand.toLowerCase().includes(lower) || p.category.toLowerCase().includes(lower) || p.description.toLowerCase().includes(lower));
    }
    if (selectedCats.length > 0) list = list.filter(p => p.categories.some(c => selectedCats.includes(c)) || selectedCats.includes(p.category));
    list = list.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    switch (sort) {
      case "price-asc": list.sort((a,b)=>a.price-b.price); break;
      case "price-desc": list.sort((a,b)=>b.price-a.price); break;
      case "rating": list.sort((a,b)=>b.rating-a.rating); break;
      case "newest": list.sort((a,b)=> (b.newArrival?1:0)-(a.newArrival?1:0)); break;
      case "trending": list.sort((a,b)=> (b.trending?1:0)-(a.trending?1:0)); break;
      default: list.sort((a,b)=> (b.featured?1:0)-(a.featured?1:0));
    }
    return list;
  }, [products, q, selectedCats, priceRange, sort]);

  const toggleCat = (slug: string) => setSelectedCats(prev => prev.includes(slug) ? prev.filter(s=>s!==slug) : [...prev, slug]);
  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6"><div><h1 className="font-display text-[36px] lg:text-[56px] leading-[0.9] tracking-tight">All products</h1><p className="mt-3 text-obsidian/60 max-w-[560px]">{filtered.length} products • Premium gear across football, cricket, basketball, running, gym, outdoor & accessories. Demo store.</p></div><div className="flex gap-3"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian/40" /><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search products..." className="h-11 pl-10 pr-4 w-[260px] lg:w-[340px] rounded-full bg-white border border-stone-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-obsidian/10" />{q && <button onClick={()=>setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4" /></button>}</div><button onClick={()=>setShowFilters(!showFilters)} className="lg:hidden h-11 px-5 rounded-full bg-obsidian text-white text-[13px] flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" />Filters</button></div></div>
      <div className="mt-8 grid lg:grid-cols-[280px_1fr] gap-8"><aside className={cn("lg:block bg-white rounded-[20px] border border-stone-200 p-6 h-fit lg:sticky lg:top-[124px]", showFilters ? "block" : "hidden")}><div className="flex items-center justify-between"><h3 className="font-semibold">Filters</h3><button onClick={()=>{setSelectedCats([]);setPriceRange([0,500]);setQ("")}} className="text-[12px] underline">Clear</button></div><div className="mt-6"><h4 className="text-[11px] tracking-widest uppercase opacity-60">Category</h4><div className="mt-3 space-y-2">{categories.map(cat=><label key={cat.slug} className="flex items-center gap-3 text-[14px] cursor-pointer group"><input type="checkbox" checked={selectedCats.includes(cat.slug)} onChange={()=>toggleCat(cat.slug)} className="w-4 h-4 rounded border-stone-300" /><span className="group-hover:underline">{cat.name}</span><span className="ml-auto text-[12px] opacity-50">{products.filter(p=>p.categories.includes(cat.slug as any)||p.category===cat.slug).length}</span></label>)}</div></div><div className="mt-8"><h4 className="text-[11px] tracking-widest uppercase opacity-60">Price range</h4><div className="mt-4 space-y-3"><div className="flex items-center justify-between text-[13px]"><span>{formatPrice(priceRange[0])}</span><span>{formatPrice(priceRange[1])}</span></div><input type="range" min={0} max={500} step={10} value={priceRange[1]} onChange={e=>setPriceRange([priceRange[0],parseInt(e.target.value)])} className="w-full accent-obsidian" /><div className="grid grid-cols-2 gap-2"><button onClick={()=>setPriceRange([0,100])} className={cn("h-8 rounded-full text-[12px] border",priceRange[1]===100?"bg-obsidian text-white":"bg-stone-100")}>Under $100</button><button onClick={()=>setPriceRange([0,200])} className={cn("h-8 rounded-full text-[12px] border",priceRange[1]===200?"bg-obsidian text-white":"bg-stone-100")}>Under $200</button></div></div></div><div className="mt-8"><h4 className="text-[11px] tracking-widest uppercase opacity-60">Sort</h4><select value={sort} onChange={e=>setSort(e.target.value as SortOption)} className="mt-3 w-full h-10 rounded-full bg-stone-100 px-4 text-[13px] focus:outline-none"><option value="featured">Featured</option><option value="trending">Trending</option><option value="newest">Newest</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option><option value="rating">Highest Rated</option></select></div></aside><div>{filtered.length===0?<div className="bg-white rounded-[20px] border border-stone-200 p-12 text-center"><h3 className="font-display text-[22px]">No products found</h3><p className="text-[14px] text-obsidian/60 mt-2">Try adjusting filters or search.</p><button onClick={()=>{setQ("");setSelectedCats([]);setPriceRange([0,500])}} className="mt-6 h-10 px-6 rounded-full bg-obsidian text-white text-[13px]">Clear filters</button></div>:<div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">{filtered.map(p=><ProductCard key={p.id} product={p}/>)}</div>}</div></div>
    </div>
  );
}
export default function ShopPage(){return <Suspense fallback={<div className="p-12 text-center">Loading shop...</div>}><ShopInner/></Suspense>}
