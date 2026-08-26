"use client";
export const dynamic = 'force-dynamic';
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { journalPosts } from "@/data/products";

export default function JournalPostPage() {
  const { slug } = useParams() as { slug: string };
  const post = journalPosts.find(p=>p.slug===slug);
  if (!post) return <div className="max-w-[800px] mx-auto px-4 py-20 text-center"><h1 className="font-display text-[32px]">Post not found</h1><Link href="/journal" className="mt-6 inline-flex h-11 px-6 rounded-full bg-obsidian text-white items-center">Back to journal</Link></div>;

  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <Link href="/journal" className="text-[13px] underline">← Back to journal</Link>
      <div className="mt-6 text-[11px] tracking-widest uppercase opacity-60">{post.category} • {post.date} • {post.readTime}</div>
      <h1 className="mt-3 font-display text-[36px] lg:text-[52px] leading-[0.9]">{post.title}</h1>
      <p className="mt-6 text-[18px] leading-relaxed text-obsidian/70">{post.excerpt}</p>
      <div className="mt-8 relative aspect-[16/10] rounded-[24px] overflow-hidden bg-stone-100"><Image src={post.image} alt={post.title} fill className="object-cover" /></div>
      <div className="mt-10 prose prose-stone max-w-none">
        <p className="text-[16px] leading-relaxed">{post.content}</p>
        <div className="mt-10 p-6 rounded-[20px] bg-white border">
          <div className="font-semibold">Shop the guide</div>
          <p className="mt-2 text-[14px] text-obsidian/60">Products mentioned are available in our curated shop. Free shipping over $100, 30-day returns.</p>
          <Link href="/shop" className="mt-4 inline-flex h-10 px-5 rounded-full bg-obsidian text-white text-[13px] items-center">Shop now</Link>
        </div>
      </div>
    </div>
  );
}
