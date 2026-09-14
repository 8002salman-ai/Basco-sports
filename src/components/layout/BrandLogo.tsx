type BrandLogoProps = {
  variant?: "header" | "footer";
};

/** The Basco football mark. `className` sizes and colours it (currentColor = ball). */
export function BrandMark({ className, fg = "#0B1220" }: { className?: string; fg?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={className} fill="none">
      <circle cx="20" cy="20" r="15" fill="currentColor" />
      <path
        d="m20 10.2 6.1 4.5-2.3 7.1h-7.6l-2.3-7.1L20 10.2Z"
        fill={fg}
      />
      <path
        d="M20 10.2V5.4M13.9 14.7 8 17M26.1 14.7 32 17M16.2 21.8l-3.7 6M23.8 21.8l3.7 6"
        stroke={fg}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandLogo({ variant = "header" }: BrandLogoProps) {
  const isFooter = variant === "footer";

  return (
    <span className="flex items-center gap-2 sm:gap-2.5 shrink-0">
      <span
        className={isFooter
          ? "w-10 h-10 bg-white rounded-[12px] flex items-center justify-center"
          : "w-8 h-8 lg:w-9 lg:h-9 bg-obsidian rounded-[10px] flex items-center justify-center"}
      >
        <BrandMark
          className={isFooter ? "w-7 h-7 text-obsidian" : "w-6 h-6 lg:w-7 lg:h-7 text-lime"}
          fg={isFooter ? "#FFFFFF" : "#0B1220"}
        />
      </span>
      <span className="leading-none whitespace-nowrap">
        <span className={isFooter ? "font-display font-bold text-[22px] tracking-tight" : "font-display font-bold tracking-tight text-[19px] sm:text-[21px] lg:text-[24px]"}>
          BASCO
        </span>
        <span className={isFooter ? "block text-[10px] tracking-[0.2em] opacity-70 -mt-1" : "block font-body text-[9px] lg:text-[10px] tracking-[0.22em] -mt-0.5 opacity-70"}>
          SPORTS
        </span>
      </span>
    </span>
  );
}
