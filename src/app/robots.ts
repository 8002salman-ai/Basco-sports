import { MetadataRoute } from "next";

export const runtime = 'edge';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/checkout", "/account"] },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || "https://basco-sports.example.com"}/sitemap.xml`,
  };
}
