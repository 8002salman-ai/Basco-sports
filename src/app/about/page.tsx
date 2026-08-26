import Image from "next/image";

export default function AboutPage() {
  return (
    <div>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <div className="text-[11px] tracking-[0.2em] uppercase opacity-50">About Basco Sports</div>
            <h1 className="mt-4 font-display text-[40px] lg:text-[64px] leading-[0.9] tracking-tight">Built for the long run. Designed to last.</h1>
            <p className="mt-8 text-[18px] leading-relaxed text-obsidian/70 max-w-[560px]">Basco Sports is a premium sports gear and apparel store founded in London. We curate – not aggregate – performance equipment. Every product is tested by athletes, not just listed.</p>
            <div className="mt-10 grid grid-cols-3 gap-6 border-t pt-10 max-w-[480px]">
              <div><div className="font-display text-[28px] font-bold">2021</div><div className="text-[11px] uppercase tracking-widest opacity-60">Founded</div></div>
              <div><div className="font-display text-[28px] font-bold">34</div><div className="text-[11px] uppercase tracking-widest opacity-60">Products curated</div></div>
              <div><div className="font-display text-[28px] font-bold">4.8</div><div className="text-[11px] uppercase tracking-widest opacity-60">Avg rating</div></div>
            </div>
          </div>
          <div className="relative aspect-[4/5] rounded-[28px] overflow-hidden bg-stone-100">
            <Image src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop" alt="Athletes" fill className="object-cover" />
          </div>
        </div>

        <div className="mt-20 grid lg:grid-cols-3 gap-6">
          {[
            { title: "Editorial curation", body: "We stock fewer, better products. Each season we remove what doesn't meet durability or fit standards." },
            { title: "Performance tested", body: "Our team logs miles, sets and overs in every product before it hits the shop. No pay-to-play listings." },
            { title: "Repair, not replace", body: "2-year warranty and repair program. We design for longevity – less waste, more use." },
          ].map(card=>(
            <div key={card.title} className="bg-white rounded-[20px] border p-8">
              <h3 className="font-display text-[22px]">{card.title}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-obsidian/60">{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
