import Link from "next/link";
import { notFound } from "next/navigation";
import { products } from "@/data/products";
import { ProductMarketPanel } from "@/components/product/ProductMarketPanel";
import { ProductPurchasePanel } from "@/components/product/ProductPurchasePanel";
import ProductReviews from "@/components/product/ProductReviews";

export const runtime = 'edge';

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = products.find((item) => item.slug === params.slug);
  if (!product) notFound();

  return (
    <main className="max-w-[1200px] mx-auto px-6 py-10 lg:py-14">
      <nav aria-label="Breadcrumb" className="text-[12px] text-obsidian/50">
        <Link href="/shop" className="hover:text-obsidian hover:underline underline-offset-4">Shop</Link>
        <span className="mx-1.5">/</span>
        <span className="text-obsidian/80">{product.name}</span>
      </nav>

      <div className="mt-6">
        <ProductPurchasePanel product={product} />
      </div>

      <div className="mt-12">
        <ProductMarketPanel priceUSD={product.price} />
      </div>

      <section className="mt-10 rounded-2xl border border-stone-200 p-6">
        <h2 className="font-semibold">Before purchase</h2>
        <p className="mt-3 text-sm opacity-70">Product availability, materials, safety information, image provenance and market eligibility are subject to verification. This demo catalog is not cleared for live sale.</p>
      </section>

      <ProductReviews productSlug={product.slug} productName={product.name} />
    </main>
  );
}
