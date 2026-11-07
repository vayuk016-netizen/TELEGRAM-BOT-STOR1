import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  variant?: "blue" | "emerald" | "amber" | "purple";
  loading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "blue",
  loading = false,
}) => {
  const colorStyles = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 group-hover:bg-blue-500/20",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 group-hover:bg-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 group-hover:bg-amber-500/20",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20 group-hover:bg-purple-500/20",
  };

  const glowStyles = {
    blue: "bg-blue-500/5 dark:bg-blue-500/10",
    emerald: "bg-emerald-500/5 dark:bg-emerald-500/10",
    amber: "bg-amber-500/5 dark:bg-amber-500/10",
    purple: "bg-purple-500/5 dark:bg-purple-500/10",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-4 sm:p-5 md:p-6 shadow-sm dark:shadow-md backdrop-blur-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-blue-400 dark:hover:border-slate-700 group">
      {/* Ambient background glow */}
      <div className={cn("absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl opacity-40 dark:opacity-20 group-hover:opacity-60 dark:group-hover:opacity-30 transition-all duration-300", glowStyles[variant])} />
      
      <div className="flex items-center justify-between relative z-10">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-sans">{title}</span>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-300", colorStyles[variant])}>
          <Icon className="h-5.5 w-5.5 transition-transform duration-300 group-hover:scale-110" />
        </div>
      </div>
      
      <div className="mt-4 relative z-10">
        {loading ? (
          <div className="space-y-2.5">
            <div className="h-8 w-28 rounded bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" />
            {subtitle && <div className="h-4.5 w-40 rounded bg-slate-200/40 dark:bg-slate-800/60 animate-pulse" />}
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-extrabold tracking-tight text-[#0f172a] dark:text-white font-sans">{value}</h3>
              {trend && (
                <span className="inline-flex items-center text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                  {trend}
                </span>
              )}
            </div>
            {subtitle && <p className="mt-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 leading-normal">{subtitle}</p>}
          </>
        )}
      </div>
    </div>
  );
};

