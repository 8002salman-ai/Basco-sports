"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "lime";
  size?: "sm" | "md" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = "primary", size = "md", ...props }, ref) => {
  const base = "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<string, string> = {
    primary: "bg-obsidian text-white hover:bg-obsidian-700 focus-visible:ring-obsidian rounded-full",
    secondary: "bg-stone-100 text-obsidian hover:bg-stone-200 rounded-full",
    ghost: "bg-transparent text-obsidian hover:bg-stone-100 rounded-full",
    outline: "border border-obsidian/20 text-obsidian hover:bg-obsidian hover:text-white rounded-full",
    lime: "bg-lime text-obsidian hover:bg-lime-300 font-semibold rounded-full shadow-soft",
  };
  const sizes: Record<string, string> = {
    sm: "h-9 px-4 text-[13px] tracking-wide",
    md: "h-11 px-6 text-[14px] tracking-wide",
    lg: "h-12 px-8 text-[15px] tracking-wide",
    icon: "h-10 w-10",
  };
  return <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />;
});
Button.displayName = "Button";
export { Button };
