import { MetadataRoute } from "next";
import { products, categories, journalPosts } from "@/data/products";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://basco-sports.example.com";
  const now = new Date();
  const staticPages = ["", "/shop", "/cart", "/checkout", "/about", "/contact", "/faq", "/shipping", "/privacy", "/terms", "/journal", "/account"];
  const productPages = products.map(p => `/product/${p.slug}`);
  const categoryPages = categories.map(c => `/category/${c.slug}`);
  const journalPages = journalPosts.map(j => `/journal/${j.slug}`);

  const all = [...staticPages, ...productPages, ...categoryPages, ...journalPages];

  return all.map(path => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path.startsWith("/product") ? "weekly" : "monthly",
    priority: path === "" ? 1 : path.startsWith("/product") ? 0.8 : 0.6,
  }));
}
