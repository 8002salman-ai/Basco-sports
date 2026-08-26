import Link from "next/link";
import Image from "next/image";
import { journalPosts } from "@/data/products";

export default function JournalPage() {
  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[11px] tracking-widest uppercase opacity-50">Journal</div>
          <h1 className="mt-3 font-display text-[40px] lg:text-[56px] leading-[0.9]">Buying guides & training notes.</h1>
          <p className="mt-4 text-obsidian/60 max-w-[560px]">Editorial guides to help you choose gear that lasts – not just trends. Original Basco content.</p>
        </div>
      </div>
      <div className="mt-10 grid lg:grid-cols-3 gap-6">
        {journalPosts.map(post=>(
          <Link key={post.slug} href={`/journal/${post.slug}`} className="group bg-white rounded-[24px] border overflow-hidden hover:shadow-lift transition-all">
            <div className="relative aspect-[16/10] bg-stone-100"><Image src={post.image} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" /></div>
            <div className="p-6">
              <div className="flex items-center gap-2 text-[11px]"><span className="px-2 py-1 rounded-full bg-stone-100 tracking-widest uppercase">{post.category}</span><span className="opacity-60">{post.date} • {post.readTime}</span></div>
              <h3 className="mt-4 font-display text-[20px] leading-tight">{post.title}</h3>
              <p className="mt-3 text-[14px] text-obsidian/60 leading-relaxed">{post.excerpt}</p>
              <span className="mt-4 inline-flex text-[13px] font-medium underline underline-offset-4">Read guide</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
