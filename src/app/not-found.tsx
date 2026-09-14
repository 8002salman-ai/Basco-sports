import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <main className="max-w-[720px] mx-auto px-6 py-24 text-center">
      <div className="w-20 h-20 rounded-full bg-stone-100 mx-auto flex items-center justify-center">
        <ShoppingBag className="w-9 h-9 text-obsidian/30" />
      </div>
      <h1 className="mt-6 font-display text-[36px] leading-none">Page not found</h1>
      <p className="mt-4 text-obsidian/70">
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved. The gear is all still here.
      </p>
      <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
        <Link href="/shop" className="h-12 px-8 rounded-full bg-obsidian text-white font-semibold inline-flex items-center">
          Browse all products
        </Link>
        <Link href="/" className="h-12 px-8 rounded-full border border-obsidian/20 font-semibold inline-flex items-center hover:bg-stone-100 transition-colors">
          Back to home
        </Link>
      </div>
    </main>
  );
}
