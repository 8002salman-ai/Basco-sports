import { products as seedProducts } from '@/data/products';
import type { Product } from '@/lib/types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function getStorefrontProducts(): Promise<Product[]> {
  if (!url || !anonKey) return seedProducts;
  try {
    const response = await fetch(`${url}/rest/v1/products?isActive=eq.true&order=updatedAt.desc`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      next: { revalidate: 60 },
    });
    if (!response.ok) return seedProducts;
    const rows = (await response.json()) as Product[];
    return Array.isArray(rows) && rows.length ? rows : seedProducts;
  } catch {
    return seedProducts;
  }
}

export function hasStorefrontSupabase(): boolean {
  return Boolean(url && anonKey);
}
