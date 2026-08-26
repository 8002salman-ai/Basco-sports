export default function ShippingPage() {
  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <h1 className="font-display text-[40px] leading-[0.9]">Shipping & Returns</h1>
      <div className="mt-10 space-y-8 text-[14px] leading-relaxed text-obsidian/70">
        <section className="bg-white rounded-[20px] border p-8">
          <h2 className="font-semibold text-obsidian text-[16px]">Shipping (demo policy)</h2>
          <ul className="mt-4 list-disc pl-5 space-y-2">
            <li>Free standard shipping over $100 – 2-4 business days, tracked via DPD / UPS.</li>
            <li>Under $100: $9.50 standard. Express 1-2 days: $18.00.</li>
            <li>Orders placed before 2pm GMT ship same day (Mon-Fri).</li>
            <li>International shipping coming soon – duties calculated at checkout when live.</li>
          </ul>
        </section>
        <section className="bg-white rounded-[20px] border p-8">
          <h2 className="font-semibold text-obsidian text-[16px]">Returns</h2>
          <ul className="mt-4 list-disc pl-5 space-y-2">
            <li>30-day free returns with prepaid label (UK & US demo).</li>
            <li>Items must be unused, unwashed, with tags attached.</li>
            <li>Worn shoes: return only if manufacturing defect – we offer repair first.</li>
            <li>Refunds processed to original payment method in 5-10 days when live.</li>
          </ul>
        </section>
        <section className="bg-white rounded-[20px] border p-8">
          <h2 className="font-semibold text-obsidian text-[16px]">Warranty</h2>
          <p className="mt-3">2-year warranty against manufacturing defects. We repair before replacing – less waste, more use. Contact support@bascosports.demo (demo address).</p>
        </section>
      </div>
    </div>
  );
}
