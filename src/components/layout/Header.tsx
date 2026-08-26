"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Search, Heart, ShoppingBag, User, Menu, X } from "lucide-react";
import { useCart } from "@/components/cart/CartContext";
import { categories } from "@/data/products";
import { useRouter } from "next/navigation";

export function Header() {
  const { cartCount, wishlist, setCartOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/shop?q=${encodeURIComponent(search.trim())}`);
      setMobileOpen(false);
    }
  };

  return (
    <header className={`sticky top-0 z-40 w-full bg-white/90 backdrop-blur-xl border-b transition-shadow ${scrolled ? "shadow-soft" : "border-stone-200"}`}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-[64px] lg:h-[76px] flex items-center justify-between gap-4">
          {/* Mobile menu */}
          <button aria-label="Open menu" className="lg:hidden p-2 -ml-2" onClick={() => setMobileOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-obsidian rounded-[10px] flex items-center justify-center">
              <span className="text-lime font-display font-black text-[18px] tracking-tighter leading-none">B</span>
            </div>
            <div className="leading-none">
              <div className="font-display font-bold tracking-tight text-[20px] lg:text-[22px]">BASCO</div>
              <div className="font-body text-[10px] tracking-[0.2em] -mt-1 opacity-70">SPORTS</div>
            </div>
          </Link>

          {/* Search desktop */}
          <form onSubmit={onSearch} className="hidden lg:flex flex-1 max-w-[560px] mx-8 relative">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian/40" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search football boots, cricket bats, running shoes..."
                className="w-full h-11 pl-11 pr-4 bg-stone-100 rounded-full text-[14px] placeholder:text-obsidian/40 focus:outline-none focus:ring-2 focus:ring-obsidian/10 focus:bg-white border border-transparent focus:border-obsidian/10 transition-all"
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-1 lg:gap-2">
            <Link href="/account" className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full hover:bg-stone-100 transition-colors" aria-label="Account">
              <User className="w-5 h-5" />
            </Link>
            <Link href="/account" className="relative hidden sm:flex h-10 w-10 items-center justify-center rounded-full hover:bg-stone-100 transition-colors" aria-label="Wishlist">
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && <span className="absolute -top-0.5 -right-0.5 bg-lime text-obsidian text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{wishlist.length}</span>}
            </Link>
            <button onClick={() => setCartOpen(true)} className="relative h-10 w-10 flex items-center justify-center rounded-full bg-obsidian text-white hover:bg-obsidian-700 transition-colors" aria-label="Cart">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-lime text-obsidian text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{cartCount}</span>}
            </button>
          </div>
        </div>

        {/* Category nav */}
        <nav className="hidden lg:flex h-12 items-center gap-1 border-t border-stone-100 -mx-4 px-4 overflow-x-auto">
          <Link href="/shop" className="px-3 py-2 text-[13px] font-medium tracking-wide hover:bg-stone-100 rounded-full transition-colors whitespace-nowrap">All Products</Link>
          {categories.map(cat => (
            <Link key={cat.slug} href={`/category/${cat.slug}`} className="px-3 py-2 text-[13px] font-medium tracking-wide hover:bg-stone-100 rounded-full transition-colors whitespace-nowrap uppercase">
              {cat.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-obsidian/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[86%] max-w-[360px] bg-white shadow-lift flex flex-col">
            <div className="h-[64px] px-6 flex items-center justify-between border-b">
              <span className="font-display font-bold text-[18px]">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="h-9 w-9 flex items-center justify-center rounded-full bg-stone-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={onSearch} className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian/40" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search gear..." className="w-full h-11 pl-10 pr-4 bg-stone-100 rounded-full text-[14px] focus:outline-none focus:ring-2 focus:ring-obsidian/10" />
              </div>
            </form>
            <div className="flex-1 overflow-auto p-2">
              <Link href="/shop" onClick={() => setMobileOpen(false)} className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-stone-100 font-medium">All Products</Link>
              {categories.map(cat => (
                <Link key={cat.slug} href={`/category/${cat.slug}`} onClick={() => setMobileOpen(false)} className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-stone-100 font-medium">
                  <span>{cat.name}</span>
                  <span className="text-[11px] tracking-widest opacity-50 uppercase">{cat.slug}</span>
                </Link>
              ))}
              <div className="h-px bg-stone-200 my-3" />
              <Link href="/journal" onClick={() => setMobileOpen(false)} className="flex px-4 py-3 rounded-xl hover:bg-stone-100">Journal</Link>
              <Link href="/about" onClick={() => setMobileOpen(false)} className="flex px-4 py-3 rounded-xl hover:bg-stone-100">About</Link>
              <Link href="/contact" onClick={() => setMobileOpen(false)} className="flex px-4 py-3 rounded-xl hover:bg-stone-100">Contact</Link>
              <Link href="/account" onClick={() => setMobileOpen(false)} className="flex px-4 py-3 rounded-xl hover:bg-stone-100">Account • Wishlist ({wishlist.length})</Link>
            </div>
            <div className="p-4 bg-stone-50 text-[12px] text-obsidian/60">
              Demo store – payments disabled. Free shipping over $100.
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
