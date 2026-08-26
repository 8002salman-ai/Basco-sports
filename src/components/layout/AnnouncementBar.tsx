export function AnnouncementBar() {
  return (
    <div className="bg-obsidian text-white text-[12px] tracking-wide">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 overflow-hidden">
          <span className="hidden md:inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-lime rounded-full animate-pulse" />
            Free shipping over $100 • 30-day returns • Price match promise
          </span>
          <span className="md:hidden truncate">Free shipping over $100 • 30-day returns</span>
        </div>
        <div className="hidden lg:flex items-center gap-6 text-white/70">
          <span>Need help? +1 (800) BASCO-01</span>
          <span className="w-px h-3 bg-white/20" />
          <span>Track Order</span>
          <span className="w-px h-3 bg-white/20" />
          <span>Stores</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="bg-white/10 px-2.5 py-1 rounded-full">DEMO STORE • No real payments</span>
        </div>
      </div>
    </div>
  );
}
