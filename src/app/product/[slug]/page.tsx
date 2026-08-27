import { notFound } from "next/navigation";
import { products } from "@/data/products";
import { ProductMarketPanel } from "@/components/product/ProductMarketPanel";
import { convertForDisplay } from "@/lib/currency";

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = products.find((item) => item.slug === params.slug);
  if (!product) notFound();

  return (
    <main className="max-w-[1200px] mx-auto px-6 py-16">
      <p className="text-xs uppercase tracking-widest opacity-60">Product information</p>
      <h1 className="mt-3 text-4xl font-display">{product.name}</h1>
      <p className="mt-4 text-lg">{convertForDisplay(product.price, "USD")}</p>
      <p className="mt-6 max-w-2xl opacity-75">{product.description}</p>
      <ProductMarketPanel priceUSD={product.price} />
      <section className="mt-10 rounded-2xl border border-stone-200 p-6">
        <h2 className="font-semibold">Before purchase</h2>
        <p className="mt-3 text-sm opacity-70">Product availability, materials, safety information, image provenance and market eligibility are subject to verification. This demo catalog is not cleared for live sale.</p>
        <p className="mt-3 text-sm opacity-70">No customer rating or review is displayed until authentic review records are available.</p>
      </section>
    </main>
  );
}
