import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Truck, ShieldCheck, RotateCcw, Star } from "lucide-react";
import { products, categories } from "@/data/products";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { AdSlot } from "@/components/ads/AdSlot";

export default function HomePage() {
  const trending = products.filter(p => p.trending).slice(0, 8);
  const featured = products.filter(p => p.featured).slice(0, 4);
  const newArrivals = products.filter(p => p.newArrival).slice(0, 8);

  return (
    <div className="bg-[#FCFBF9]">
      {/* Hero */}
      <section className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10">
        <div className="relative rounded-[28px] overflow-hidden bg-obsidian text-white min-h-[640px] lg:min-h-[760px] flex">
          <div className="absolute inset-0">
            <Image src="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=2000&auto=format&fit=crop" alt="Athlete running" fill className="object-cover opacity-70" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-obsidian/80 via-transparent to-transparent" />
          </div>

          <div className="relative z-10 w-full flex flex-col lg:flex-row">
            <div className="flex-1 p-8 lg:p-14 flex flex-col justify-end lg:justify-between">
              <div className="hidden lg:flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-white/10 text-[11px] tracking-widest uppercase">New Season 24/25</span>
                <span className="px-3 py-1 rounded-full bg-lime text-obsidian text-[11px] font-bold tracking-widest uppercase">Editorial Drop</span>
              </div>
              <div className="mt-auto lg:mt-0 max-w-[720px]">
                <h1 className="font-display text-[44px] lg:text-[84px] leading-[0.9] tracking-[-0.03em] font-bold">
                  Gear built<br />for the long<br /><span className="text-lime">run.</span>
                </h1>
                <p className="mt-6 text-[16px] lg:text-[18px] leading-relaxed text-white/70 max-w-[520px]">
                  Basco Sports curates premium performance gear – tested on track, pitch and trail. No hype, just craft, fit and durability.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/shop" className="h-12 px-7 rounded-full bg-white text-obsidian font-semibold text-[14px] inline-flex items-center gap-2 hover:bg-stone-100 transition-colors">
                    Shop new arrivals <ArrowUpRight className="w-4 h-4" />
                  </Link>
                  <Link href="/category/running" className="h-12 px-7 rounded-full bg-white/10 backdrop-blur text-white font-medium text-[14px] inline-flex items-center gap-2 hover:bg-white/20 transition-colors border border-white/10">
                    Explore running
                  </Link>
                </div>
                <div className="mt-10 grid grid-cols-3 gap-6 max-w-[480px] border-t border-white/10 pt-8">
                  <div><div className="font-display text-[24px] font-bold">Worldwide</div><div className="text-[11px] tracking-widest uppercase text-white/50">Tracked delivery</div></div>
                  <div><div className="font-display text-[24px] font-bold">30 days</div><div className="text-[11px] tracking-widest uppercase text-white/50">Voluntary returns</div></div>
                  <div><div className="font-display text-[24px] font-bold">Pre-pay</div><div className="text-[11px] tracking-widest uppercase text-white/50">Total shown first</div></div>
                </div>
              </div>
            </div>

            {/* Right card stack */}
            <div className="lg:w-[380px] p-4 lg:p-6 flex flex-col gap-4 justify-end">
              <div className="rounded-[20px] bg-white text-obsidian p-5 shadow-lift">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] tracking-widest uppercase opacity-60">Featured kit</span>
                  <span className="px-2 py-1 rounded-full bg-lime text-[10px] font-bold">BESTSELLER</span>
                </div>
                <div className="mt-4 flex gap-4">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-stone-100"><Image src={products[10].images[0]} alt="" fill className="object-cover" /></div>
                  <div>
                    <div className="text-[11px] tracking-widest uppercase opacity-50">{products[10].brand}</div>
                    <div className="font-medium leading-tight mt-1">{products[10].name}</div>
                    <div className="mt-2 flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-obsidian" /><span className="text-[12px] font-semibold">{products[10].rating}</span><span className="text-[12px] opacity-60">({products[10].reviewCount})</span></div>
                  </div>
                </div>
                <Link href={`/product/${products[10].slug}`} className="mt-4 h-10 rounded-full bg-obsidian text-white text-[13px] font-medium flex items-center justify-center hover:bg-obsidian-700">View product</Link>
              </div>
              <div className="rounded-[20px] bg-lime text-obsidian p-5">
                <div className="text-[11px] tracking-widest uppercase opacity-60">Basco Club</div>
                <div className="mt-2 font-display text-[20px] leading-tight font-semibold">Get 15% off your first order. Use code WELCOME15.</div>
                <div className="mt-3 text-[13px] opacity-70">Demo coupon – apply at cart. No email spam.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust strip */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Truck, title: "Worldwide shipping", desc: "Tracked international delivery" },
            { icon: RotateCcw, title: "30-day returns", desc: "See our returns policy for your market" },
            { icon: ShieldCheck, title: "Statutory rights", desc: "Guarantees per your local consumer law" },
            { icon: Star, title: "Honest reviews only", desc: "No invented ratings – ever" },
          ].map(item => (
            <div key={item.title} className="flex items-center gap-3 rounded-2xl bg-white border border-stone-200/70 px-5 py-4">
              <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center shrink-0"><item.icon className="w-5 h-5" /></div>
              <div><div className="text-[13px] font-semibold leading-tight">{item.title}</div><div className="text-[12px] text-obsidian/60">{item.desc}</div></div>
            </div>
          ))}
        </div>
      </section>

      {/* Shop by sport */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="text-[11px] tracking-[0.2em] uppercase opacity-50">Curated discovery</div>
            <h2 className="mt-3 font-display text-[32px] lg:text-[48px] leading-[0.95] tracking-tight">Shop by sport</h2>
          </div>
          <Link href="/shop" className="hidden lg:inline-flex items-center gap-2 text-[13px] font-medium underline underline-offset-4">View all categories <ArrowUpRight className="w-4 h-4" /></Link>
        </div>
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {categories.filter(c => c.slug !== "deals").map(cat => (
            <Link key={cat.slug} href={`/category/${cat.slug}`} className="group relative rounded-[24px] overflow-hidden aspect-[4/5] bg-obsidian">
              <Image src={cat.image} alt={cat.name} fill className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/20 to-transparent" />
              <div className="absolute bottom-0 p-6 text-white">
                <div className="text-[11px] tracking-widest uppercase opacity-60">Collection</div>
                <div className="mt-1 font-display text-[28px] leading-none">{cat.name}</div>
                <div className="mt-3 inline-flex items-center gap-2 text-[12px] px-3 py-1.5 rounded-full bg-white text-obsidian font-medium group-hover:bg-lime transition-colors">Shop now <ArrowUpRight className="w-3.5 h-3.5" /></div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-[28px] lg:text-[40px] leading-none">Trending now</h2>
          <Link href="/shop?sort=trending" className="text-[13px] font-medium underline underline-offset-4">Shop trending</Link>
        </div>
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {trending.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Editorial banners */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
          <div className="relative rounded-[28px] overflow-hidden min-h-[480px] bg-stone-100">
            <Image src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1400&auto=format&fit=crop" alt="Gym training" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian/80 via-obsidian/10 to-transparent" />
            <div className="absolute bottom-0 p-8 lg:p-10 text-white max-w-[520px]">
              <span className="px-3 py-1 rounded-full bg-lime text-obsidian text-[11px] font-bold tracking-widest">GYM & TRAINING</span>
              <h3 className="mt-4 font-display text-[32px] lg:text-[44px] leading-[0.9]">Strength without the noise.</h3>
              <p className="mt-3 text-white/70">Bare steel, full-grain leather, no plastic. Gear that earns its place on the rack.</p>
              <Link href="/category/gym" className="mt-6 inline-flex h-11 px-6 rounded-full bg-white text-obsidian font-semibold text-[14px] items-center gap-2">Shop gym <ArrowUpRight className="w-4 h-4" /></Link>
            </div>
          </div>
          <div className="grid gap-4 lg:gap-6">
            <div className="relative rounded-[28px] overflow-hidden min-h-[280px] bg-obsidian text-white p-8 lg:p-10 flex flex-col justify-between">
              <div className="absolute right-0 top-0 w-[55%] h-full opacity-60">
                <Image src="https://images.unsplash.com/photo-1501554728187-ce583db33af7?q=80&w=1000&auto=format&fit=crop" alt="Outdoor" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-obsidian to-transparent" />
              </div>
              <div className="relative">
                <div className="text-[11px] tracking-widest uppercase opacity-60">Outdoor • Waterproof</div>
                <h3 className="mt-3 font-display text-[28px] leading-[0.95] max-w-[260px]">Summit shells built for 20k weather.</h3>
              </div>
              <div className="relative mt-6 flex gap-3">
                <Link href="/category/outdoor" className="h-10 px-5 rounded-full bg-white text-obsidian text-[13px] font-semibold inline-flex items-center">Shop outdoor</Link>
                <Link href="/journal" className="h-10 px-5 rounded-full bg-white/10 border border-white/15 text-white text-[13px] inline-flex items-center">Read buying guide</Link>
              </div>
            </div>
            <div className="rounded-[28px] bg-lime p-8 lg:p-10 flex flex-col justify-between min-h-[280px]">
              <div>
                <div className="text-[11px] tracking-widest uppercase opacity-60">Limited • Deals</div>
                <h3 className="mt-3 font-display text-[30px] leading-[0.95] max-w-[320px]">Seasonal reductions on pro gear.</h3>
                <p className="mt-3 text-[14px] opacity-70 max-w-[360px]">Selected styles from the deals edit. Availability confirmed at checkout.</p>
              </div>
              <Link href="/category/deals" className="mt-6 self-start h-11 px-6 rounded-full bg-obsidian text-white text-[14px] font-semibold inline-flex items-center gap-2">Shop deals <ArrowUpRight className="w-4 h-4" /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured collections */}
      <section className="bg-white border-y border-stone-200/70">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[28px] lg:text-[40px] leading-none">Featured collections</h2>
            <Link href="/shop" className="text-[13px] font-medium underline underline-offset-4">View all</Link>
          </div>
          <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="flex items-end justify-between gap-6">
          <h2 className="font-display text-[28px] lg:text-[40px] leading-none">New arrivals</h2>
          <div className="flex gap-2">
            <span className="hidden lg:inline-flex text-[12px] px-3 py-1 rounded-full bg-obsidian text-white tracking-wide">Fresh this week</span>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {newArrivals.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* AdSlot demo – footer placement */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <AdSlot slotIdEnvKey="NEXT_PUBLIC_ADSENSE_SLOT_FOOTER" className="min-h-[90px]" label="Footer Ad" />
      </section>

      {/* Brand strip */}
      <section className="bg-obsidian text-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-wrap items-center justify-between gap-6 text-[13px] tracking-[0.15em] uppercase opacity-70">
          <span>Basco Lab • Basco Run • Basco Court • Basco Cricket Co. • Basco Outdoor • Basco Training</span>
          <span className="hidden lg:inline">Editorial curation • Worldwide delivery • Duties shown before payment</span>
        </div>
      </section>
    </div>
  );
}
