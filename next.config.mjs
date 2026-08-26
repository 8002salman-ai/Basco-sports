/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Cloudflare Pages has no Next.js image optimizer – serve raw images there.
    // Vercel keeps optimization (Vercel/CF_PAGES envs are set at build time by each platform).
    unoptimized: process.env.CF_PAGES === '1',
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    // for cloudflare compatibility
  },
};

export default nextConfig;
