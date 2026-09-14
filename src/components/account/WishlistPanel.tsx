'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/components/cart/CartContext';
import { products } from '@/data/products';
import { formatPrice } from '@/lib/utils';

/** Saved items live in localStorage, so this stays a client component. */
export default function WishlistPanel() {
  const { wishlist } = useCart();
  const saved = products.filter((product) => wishlist.includes(product.id));

  return (
    <section aria-labelledby="wishlist-heading" className="mt-10">
      <div className="flex items-center justify-between gap-4">
        <h2 id="wishlist-heading" className="font-display text-[20px]">
          Wishlist
        </h2>
        {saved.length > 0 && <span className="text-[12px] text-obsidian/50">{saved.length} saved</span>}
      </div>

      {saved.length === 0 ? (
        <div className="mt-4 bg-white rounded-[20px] border border-stone-200 p-6">
          <p className="text-[14px] text-obsidian/70">Nothing saved yet.</p>
          <p className="mt-1 text-[13px] text-obsidian/50">
            Tap the heart on any product to keep it here for later.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-4">
          {saved.map((product) => (
            <div key={product.id} className="flex gap-3 p-3 rounded-xl bg-white border border-stone-200">
              <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-stone-100">
                <Image src={product.images[0]} alt="" fill className="object-cover" sizes="64px" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-medium leading-tight truncate">{product.name}</div>
                <div className="text-[12px] text-obsidian/60">{formatPrice(product.price)}</div>
                <Link
                  href={`/product/${product.slug}`}
                  className="text-[12px] underline underline-offset-4 hover:text-obsidian/70"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
