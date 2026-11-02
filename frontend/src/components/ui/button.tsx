import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost" | "gradient";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const base = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

    const variants = {
      primary: "bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 hover:from-blue-500 hover:via-indigo-500 hover:to-rose-500 text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-rose-500/25 border border-white/10 filter hover:brightness-110 focus:ring-blue-500",
      gradient: "bg-gradient-to-r from-blue-600 via-purple-600 to-rose-600 hover:from-blue-500 hover:via-purple-500 hover:to-rose-500 text-white shadow-md shadow-blue-500/25 hover:shadow-xl hover:shadow-rose-500/35 border border-white/15 filter hover:brightness-110 focus:ring-rose-500",
      secondary: "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 focus:ring-slate-500 filter hover:brightness-105",
      outline: "border border-slate-700 hover:border-transparent hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-rose-600/20 text-slate-200 focus:ring-blue-500 shadow-sm hover:shadow-md hover:shadow-blue-500/10 filter hover:brightness-105",
      danger: "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white focus:ring-rose-500 shadow-md shadow-rose-500/25 filter hover:brightness-110",
      ghost: "hover:bg-gradient-to-r hover:from-blue-600/10 hover:to-rose-600/10 text-slate-300 hover:text-slate-100",
    };

    const sizes = {
      sm: "px-2.5 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-5 py-2.5 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
