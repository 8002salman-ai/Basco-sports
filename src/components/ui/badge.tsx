"use client";
import { cn } from "@/lib/utils";

export function Badge({ children, variant = "default", className }: { children: React.ReactNode; variant?: "default" | "sale" | "new" | "lime" | "obsidian"; className?: string }) {
  const map: Record<string, string> = {
    default: "bg-stone-100 text-obsidian",
    sale: "bg-sale text-white",
    new: "bg-obsidian text-white",
    lime: "bg-lime text-obsidian",
    obsidian: "bg-obsidian text-white",
  };
  return <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase", map[variant], className)}>{children}</span>;
}
