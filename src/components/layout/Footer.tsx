"use client";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-obsidian text-white">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter */}
        <div className="py-14 lg:py-20 border-b border-white/10 grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
          <div>
            <h3 className="font-display text-[28px] lg:text-[40px] leading-[0.95] tracking-tight">Join the Basco Club.<br />Get 15% off your first order.</h3>
            <p className="mt-4 text-white/60 max-w-[520px]">Early access to drops, member pricing, and training notes from athletes. No spam, unsubscribe anytime.</p>
          </div>
          <NewsletterForm />
        </div>

        <div className="py-14 grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-[12px] flex items-center justify-center"><span className="text-obsidian font-black text-[20px] tracking-tighter">B</span></div>
              <div className="leading-none">
                <div className="font-display font-bold text-[22px] tracking-tight">BASCO</div>
                <div className="text-[10px] tracking-[0.2em] opacity-70 -mt-1">SPORTS</div>
              </div>
            </div>
            <p className="mt-6 text-white/60 text-[14px] leading-relaxed max-w-[320px]">Premium sports gear and apparel. Editorial curation, performance tested, built to last. Founded for athletes who care about craft.</p>
            <div className="mt-6 flex gap-3">
              <span className="h-9 px-4 inline-flex items-center rounded-full bg-white/10 text-[12px] tracking-wide">IG • @bascosports</span>
              <span className="h-9 px-4 inline-flex items-center rounded-full bg-white/10 text-[12px] tracking-wide">X • @basco</span>
            </div>
          </div>
          <div>
            <h4 className="text-[12px] tracking-[0.15em] uppercase opacity-60 mb-4">Shop</h4>
            <ul className="space-y-3 text-[14px] text-white/80">
              <li><Link href="/category/football" className="hover:text-white">Football</Link></li>
              <li><Link href="/category/cricket" className="hover:text-white">Cricket</Link></li>
              <li><Link href="/category/basketball" className="hover:text-white">Basketball</Link></li>
              <li><Link href="/category/running" className="hover:text-white">Running</Link></li>
              <li><Link href="/category/gym" className="hover:text-white">Gym & Training</Link></li>
              <li><Link href="/category/outdoor" className="hover:text-white">Outdoor</Link></li>
              <li><Link href="/shop" className="hover:text-white">All Products</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[12px] tracking-[0.15em] uppercase opacity-60 mb-4">Company</h4>
            <ul className="space-y-3 text-[14px] text-white/80">
              <li><Link href="/about" className="hover:text-white">About</Link></li>
              <li><Link href="/journal" className="hover:text-white">Journal</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
              <li><Link href="/shipping" className="hover:text-white">Shipping & Returns</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[12px] tracking-[0.15em] uppercase opacity-60 mb-4">Legal</h4>
            <ul className="space-y-3 text-[14px] text-white/80">
              <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
              <li><span className="text-white/40">Demo checkout – no real charges</span></li>
              <li className="pt-4">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-lime text-obsidian text-[11px] font-bold tracking-wide">
                  <span className="w-2 h-2 bg-obsidian rounded-full animate-pulse" /> PAYMENTS IN DEMO MODE
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="py-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-[12px] text-white/50">
          <span>© {new Date().getFullYear()} Basco Sports. All rights reserved. Original brand identity.</span>
          <span className="flex items-center gap-6">
            <span>USD $ • United States</span>
            <span>Designed in London • Built for sport</span>
          </span>
        </div>
      </div>
    </footer>
  );
}

function NewsletterForm() {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const input = form.elements.namedItem("email") as HTMLInputElement;
        if (!input.value || !input.value.includes("@")) {
          alert("Please enter a valid email.");
          return;
        }
        alert(`Thanks! Demo newsletter signup for ${input.value} – 15% code: WELCOME15 (apply at cart)`);
        input.value = "";
      }}
      className="flex gap-3"
    >
      <div className="flex-1 relative">
        <input name="email" type="email" placeholder="Email address" required className="w-full h-[52px] px-6 rounded-full bg-white text-obsidian placeholder:text-obsidian/40 text-[14px] focus:outline-none focus:ring-2 focus:ring-lime" />
      </div>
      <button type="submit" className="h-[52px] px-8 rounded-full bg-lime text-obsidian font-semibold text-[14px] tracking-wide hover:bg-lime-300 transition-colors">Join</button>
    </form>
  );
}
